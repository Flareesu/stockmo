-- Migration 08: Seed PDI item templates, maintenance task templates,
--               final check templates, and vehicle models from hardcoded app data.
-- All inserts use ON CONFLICT DO NOTHING for idempotency.

-- ─── PDI Item Templates (25 items) ────────────────────────────────────────────
-- Sections: Exterior (7), Interior (7), Mechanical (6), Electrical (2), Documents (3)

INSERT INTO pdi_item_templates (id, name, section, priority, ord, required, active)
VALUES
  -- Exterior
  (gen_random_uuid(), 'Body panels — no shipping damage, dents, or scratches',  'Exterior',   'high', 1,  true, true),
  (gen_random_uuid(), 'Paint condition & panel gap alignment',                   'Exterior',   'high', 2,  true, true),
  (gen_random_uuid(), 'All glass — windshield, windows, mirrors — no chips',     'Exterior',   'high', 3,  true, true),
  (gen_random_uuid(), 'All lighting — headlamps, DRL, fog, tail, turn signals',  'Exterior',   'med',  4,  true, true),
  (gen_random_uuid(), 'Door seals, hood & trunk alignment',                      'Exterior',   'med',  5,  true, true),
  (gen_random_uuid(), 'Wiper blades & washer spray pattern',                     'Exterior',   'med',  6,  true, true),
  (gen_random_uuid(), 'Wheel & tire condition — correct pressure per GAC spec',  'Exterior',   'high', 7,  true, true),
  -- Interior
  (gen_random_uuid(), 'Dashboard — no warning lights on startup',                'Interior',   'high', 8,  true, true),
  (gen_random_uuid(), 'Infotainment system boot-up & operation',                 'Interior',   'med',  9,  true, true),
  (gen_random_uuid(), 'Climate control / A/C operational',                       'Interior',   'med',  10, true, true),
  (gen_random_uuid(), 'All seat adjustments & seat belt function',               'Interior',   'high', 11, true, true),
  (gen_random_uuid(), 'Interior trim — no damage or defects',                    'Interior',   'med',  12, true, true),
  (gen_random_uuid(), 'Power windows, mirrors, locks operational',               'Interior',   'med',  13, true, true),
  (gen_random_uuid(), 'Panoramic sunroof operation (where applicable)',          'Interior',   'med',  14, false, true),
  -- Mechanical
  (gen_random_uuid(), 'Engine starts smoothly — no warning lights',              'Mechanical', 'high', 15, true, true),
  (gen_random_uuid(), 'Brake pedal firm — no abnormal noise',                    'Mechanical', 'high', 16, true, true),
  (gen_random_uuid(), '7-DCT / 8AT transmission shift quality',                  'Mechanical', 'high', 17, true, true),
  (gen_random_uuid(), 'Battery voltage check (12V system)',                      'Mechanical', 'high', 18, true, true),
  (gen_random_uuid(), 'Engine oil & coolant levels',                             'Mechanical', 'med',  19, true, true),
  (gen_random_uuid(), 'All fluid levels — brake, power steering, washer',        'Mechanical', 'med',  20, true, true),
  -- Electrical
  (gen_random_uuid(), 'ADAS / 360° camera calibration verified',                 'Electrical', 'med',  21, true, true),
  (gen_random_uuid(), 'Parking sensors functional',                              'Electrical', 'med',  22, true, true),
  -- Documents
  (gen_random_uuid(), 'Owner''s manual & warranty book present',                 'Documents',  'med',  23, true, true),
  (gen_random_uuid(), 'All key sets — smart keys accounted for',                 'Documents',  'high', 24, true, true),
  (gen_random_uuid(), 'VIN plate matches documents',                             'Documents',  'high', 25, true, true)
ON CONFLICT DO NOTHING;

-- ─── Maintenance Task Templates (12 tasks) ────────────────────────────────────

INSERT INTO maint_task_templates (id, name, freq_days, priority, ord, active)
VALUES
  (gen_random_uuid(), 'Engine start & idle run (10-15 min turbo warm-up)', 7,  'high', 1,  true),
  (gen_random_uuid(), 'Battery voltage check & top charge',                14, 'high', 2,  true),
  (gen_random_uuid(), 'Tire pressure check (TPMS verification)',           14, 'med',  3,  true),
  (gen_random_uuid(), 'Tire rotation (prevent flat spots)',                 30, 'high', 4,  true),
  (gen_random_uuid(), 'Exterior wash & paint protection',                  14, 'low',  5,  true),
  (gen_random_uuid(), 'Interior clean & dehumidify',                       30, 'low',  6,  true),
  (gen_random_uuid(), 'All fluid levels check (oil, coolant, brake)',      30, 'med',  7,  true),
  (gen_random_uuid(), 'Brake pad & disc inspection',                       60, 'med',  8,  true),
  (gen_random_uuid(), 'DCT/AT transmission warm-up cycle',                 14, 'med',  9,  true),
  (gen_random_uuid(), 'Pest & rodent inspection',                          30, 'med',  10, true),
  (gen_random_uuid(), 'A/C system run cycle',                              14, 'low',  11, true),
  (gen_random_uuid(), 'Smart key fob battery check',                       60, 'low',  12, true)
ON CONFLICT DO NOTHING;

-- ─── Final Check Templates (14 items) ─────────────────────────────────────────
-- Sections: Exterior (5), Interior (2), Mechanical (3), Documents (3), Electrical (1)

INSERT INTO final_check_templates (id, name, section, priority, ord, required, active)
VALUES
  -- Exterior
  (gen_random_uuid(), 'No new exterior damage since PDI',                             'Exterior',   'high', 1,  true, true),
  (gen_random_uuid(), 'Paint — no new scratches, swirls, or blemishes',              'Exterior',   'high', 2,  true, true),
  (gen_random_uuid(), 'All glass clean & undamaged',                                  'Exterior',   'high', 3,  true, true),
  (gen_random_uuid(), 'Professional exterior wash & polish complete',                 'Exterior',   'med',  4,  true, true),
  (gen_random_uuid(), 'Shipping protection films removed',                            'Exterior',   'med',  5,  true, true),
  -- Interior
  (gen_random_uuid(), 'Full interior detail & vacuum complete',                       'Interior',   'med',  6,  true, true),
  (gen_random_uuid(), 'No new interior damage since PDI',                             'Interior',   'high', 7,  true, true),
  -- Mechanical
  (gen_random_uuid(), 'Engine start — no new warning lights',                         'Mechanical', 'high', 8,  true, true),
  (gen_random_uuid(), 'All 4 tires at delivery pressure (GAC spec)',                  'Mechanical', 'high', 9,  true, true),
  (gen_random_uuid(), 'Battery fully charged (12.6V+)',                               'Mechanical', 'high', 10, true, true),
  -- Documents
  (gen_random_uuid(), 'All smart key sets present & functional',                      'Documents',  'high', 11, true, true),
  (gen_random_uuid(), 'Owner''s manual, warranty book, service booklet complete',     'Documents',  'high', 12, true, true),
  (gen_random_uuid(), 'PDI findings resolved or documented',                          'Documents',  'high', 13, true, true),
  -- Electrical
  (gen_random_uuid(), 'ADAS systems verified operational',                            'Electrical', 'med',  14, true, true)
ON CONFLICT DO NOTHING;

-- ─── Vehicle Models (GAC lineup) ─────────────────────────────────────────────

INSERT INTO vehicle_models (id, name, variant, engine, fuel_type, color_options)
VALUES
  (gen_random_uuid(), 'GS3 Emzoom', 'suv', '1.5T 174hp 7-DCT', 'Gasoline',
    ARRAY['Superstar Silver','Ivory White','Moonlight Grey','Salt Lake Blue','Graphene Grey','Galaxy Lilac']),
  (gen_random_uuid(), 'EMPOW',      'sedan', '1.5T 174hp 7-DCT', 'Gasoline',
    ARRAY['Ivory White','Moonlight Grey','Elegant Black','Matt Fighter Green']),
  (gen_random_uuid(), 'Emkoo',      'suv',   '1.5T 177hp 7-DCT', 'Gasoline',
    ARRAY['Snow White','Elegant Black','Moonlight Grey','Superstar Silver','Star Lake Green']),
  (gen_random_uuid(), 'GS8',        'suv',   '2.0T 248hp 8AT',   'Gasoline',
    ARRAY['Crystal White','Elegant Black','Moonlight Grey','Speed Silver','Ink Seal Green']),
  (gen_random_uuid(), 'M6 Pro',     'mpv',   '1.5T 174hp 7-DCT', 'Gasoline',
    ARRAY['Elegant Black','Peacock Blue','Crystal White']),
  (gen_random_uuid(), 'M8',         'mpv',   '2.0T 248hp 8AT',   'Gasoline',
    ARRAY['Crystal White','Elegant Black','Temple Gold']),
  (gen_random_uuid(), 'GN6',        'mpv',   '1.5T 170hp 6AT',   'Gasoline',
    ARRAY['Brown','Black','Grey','White','Blue'])
ON CONFLICT (name) DO NOTHING;
