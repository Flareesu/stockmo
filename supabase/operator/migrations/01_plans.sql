-- ─── TABLE: plans ─────────────────────────────────────────────────────────────
-- Plan definitions (pricing removed per scope). Used for capacity limits only.

CREATE TABLE operator.plans (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL UNIQUE,
  max_seats      INT           NOT NULL CHECK (max_seats > 0),
  max_vehicles   INT           NOT NULL CHECK (max_vehicles > 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

INSERT INTO operator.plans (name, max_seats, max_vehicles) VALUES
  ('Starter',    3,    50),
  ('Growth',     10,  200),
  ('Enterprise', 25, 1000);
