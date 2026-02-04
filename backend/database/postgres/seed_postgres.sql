-- AIML-BMS System - PostgreSQL seed (datasets + B0005~B0018 packs/modules/cells)
-- Run after schema.sql and schema_ext_postgres.sql

-- datasets
INSERT INTO datasets(key, name, description)
VALUES
  ('NASA', 'NASA Battery Dataset', 'B0005~B0018 cycling + impedance'),
  ('WLTP', 'WLTP Driving Cycle', 'WLTP driving cycle reference + partial runs')
ON CONFLICT (key) DO NOTHING;

-- battery_packs (NASA: B0005, B0006, B0007, B0018)
INSERT INTO battery_packs(dataset_id, pack_key, chemistry, notes)
SELECT d.id, p.pack_key, NULL, 'seeded pack'
FROM datasets d
CROSS JOIN (VALUES ('B0005'), ('B0006'), ('B0007'), ('B0018')) AS p(pack_key)
WHERE d.key = 'NASA'
ON CONFLICT (dataset_id, pack_key) DO NOTHING;

-- battery_modules: 1 module per pack (18 cells)
INSERT INTO battery_modules(pack_id, module_no, cell_count, notes)
SELECT bp.id, 1, 18, 'default module'
FROM battery_packs bp
JOIN datasets d ON d.id = bp.dataset_id
WHERE d.key = 'NASA'
ON CONFLICT (pack_id, module_no) DO NOTHING;

-- battery_cells: E1..E18 per pack (attach to module 1)
INSERT INTO battery_cells(pack_id, module_id, cell_key, notes)
SELECT bp.id, bm.id, 'E' || gs.n, 'seed cell'
FROM battery_packs bp
JOIN battery_modules bm ON bm.pack_id = bp.id AND bm.module_no = 1
JOIN generate_series(1, 18) AS gs(n) ON true
JOIN datasets d ON d.id = bp.dataset_id
WHERE d.key = 'NASA'
ON CONFLICT (pack_id, cell_key) DO NOTHING;
