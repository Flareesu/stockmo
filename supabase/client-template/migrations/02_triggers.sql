-- ─── TRIGGERS — Per-Client Schema ─────────────────────────────────────────────

-- ─── Issue Alert: auto-insert admin_alerts when any check becomes 'issue' ─────
CREATE OR REPLACE FUNCTION create_issue_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_source      TEXT;
  v_check_id    TEXT;
BEGIN
  -- Only fire when transitioning INTO 'issue' state
  IF NEW.state = 'issue' AND (OLD IS NULL OR OLD.state IS DISTINCT FROM 'issue') THEN

    -- Determine source table name for the alert
    v_source := CASE TG_TABLE_NAME
      WHEN 'pdi_checks'        THEN 'pdi'
      WHEN 'stock_maintenance' THEN 'stockyard'
      WHEN 'final_checks'      THEN 'final'
    END;

    -- pdi_checks and final_checks use item_id; stock_maintenance uses task_id
    v_check_id := CASE TG_TABLE_NAME
      WHEN 'stock_maintenance' THEN NEW.task_id
      ELSE NEW.item_id
    END;

    INSERT INTO admin_alerts (
      vehicle_id,
      source,
      check_item_id,
      check_name,
      note
    ) VALUES (
      NEW.vehicle_id,
      v_source,
      v_check_id,
      NEW.name,
      NEW.note
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER pdi_issue_alert
  AFTER INSERT OR UPDATE OF state ON pdi_checks
  FOR EACH ROW EXECUTE FUNCTION create_issue_alert();

CREATE TRIGGER stock_issue_alert
  AFTER INSERT OR UPDATE OF state ON stock_maintenance
  FOR EACH ROW EXECUTE FUNCTION create_issue_alert();

CREATE TRIGGER final_issue_alert
  AFTER INSERT OR UPDATE OF state ON final_checks
  FOR EACH ROW EXECUTE FUNCTION create_issue_alert();

-- ─── Stage Transition History: auto-log when vehicle.stage changes ────────────
CREATE OR REPLACE FUNCTION log_stage_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO vehicle_history (vehicle_id, action, stage_from, stage_to)
    VALUES (
      NEW.id,
      'stage_change',
      OLD.stage,
      NEW.stage
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicle_stage_history
  AFTER UPDATE OF stage ON vehicles
  FOR EACH ROW EXECUTE FUNCTION log_stage_transition();

-- ─── Auto-create technician profile on signup ─────────────────────────────────
-- Fires on auth.users INSERT so profile creation is server-side and
-- requires no session (works regardless of email confirmation setting).
CREATE OR REPLACE FUNCTION public.handle_new_tech_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name     TEXT := NEW.raw_user_meta_data ->> 'name';
  v_initials TEXT;
BEGIN
  IF (NEW.raw_user_meta_data ->> 'role') != 'tech' THEN
    RETURN NEW;
  END IF;

  v_initials := upper(
    left(split_part(v_name, ' ', 1), 1) ||
    left(split_part(v_name, ' ', 2), 1)
  );
  IF v_initials = '' OR v_initials IS NULL THEN
    v_initials := upper(left(v_name, 2));
  END IF;

  INSERT INTO public.technicians (name, initials, role, online, user_id)
  VALUES (
    COALESCE(v_name, 'Technician'),
    COALESCE(NULLIF(v_initials, ''), 'T'),
    'technician',
    false,
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tech_user();
