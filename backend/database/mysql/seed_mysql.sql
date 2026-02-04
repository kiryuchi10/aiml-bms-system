-- AIML-BMS System - MySQL seed (datasets + B0005~B0018 packs/modules/cells)
-- Run after schema_mysql.sql; use INSERT IGNORE for idempotency

-- datasets
INSERT IGNORE INTO datasets(`key`, name, description)
VALUES
  ('NASA', 'NASA Battery Dataset', 'B0005~B0018 cycling + impedance'),
  ('WLTP', 'WLTP Driving Cycle', 'WLTP driving cycle reference + partial runs');

-- battery_packs (NASA: B0005, B0006, B0007, B0018)
INSERT IGNORE INTO battery_packs(dataset_id, pack_key, chemistry, notes)
SELECT d.id, p.pack_key, NULL, 'seeded pack'
FROM datasets d
CROSS JOIN (
  SELECT 'B0005' AS pack_key UNION ALL
  SELECT 'B0006' UNION ALL SELECT 'B0007' UNION ALL SELECT 'B0018'
) p
WHERE d.`key` = 'NASA';

-- battery_modules: 1 module per pack (18 cells)
INSERT IGNORE INTO battery_modules(pack_id, module_no, cell_count, notes)
SELECT bp.id, 1, 18, 'default module'
FROM battery_packs bp
JOIN datasets d ON d.id = bp.dataset_id
WHERE d.`key` = 'NASA';

-- battery_cells: E1..E18 per pack (attach to module 1)
INSERT IGNORE INTO battery_cells(pack_id, module_id, cell_key, notes)
SELECT bp.id, bm.id, CONCAT('E', n.n), 'seed cell'
FROM battery_packs bp
JOIN battery_modules bm ON bm.pack_id = bp.id AND bm.module_no = 1
JOIN (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL
  SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
  SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18
) n
JOIN datasets d ON d.id = bp.dataset_id
WHERE d.`key` = 'NASA';
