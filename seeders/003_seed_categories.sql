-- Anamnez soru kategorileri
-- Step 1: Genel Değerlendirme
INSERT INTO anamnesis_categories (name, step_id, order_index) 
VALUES 
  ('Genel Değerlendirme', (SELECT id FROM anamnesis_steps WHERE name = 'Genel Değerlendirme' LIMIT 1), 1)
ON DUPLICATE KEY UPDATE 
  step_id = (SELECT id FROM anamnesis_steps WHERE name = 'Genel Değerlendirme' LIMIT 1),
  order_index = 1;

-- Step 2: Diğer kategoriler
INSERT INTO anamnesis_categories (name, step_id, order_index) 
VALUES 
  ('Beslenme', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 1),
  ('Boşaltım', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 2),
  ('Aktivite/Dinlenme', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 3),
  ('Uyku/İstirahat', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 4),
  ('Bilişsel/Algısal', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 5),
  ('Güvenlik/Koruma', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 6),
  ('Rol/İlişki', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 7),
  ('Değer/İnanç', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 8),
  ('Başa Çıkma/Stres Toleransı', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 9),
  ('Konfor', (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1), 10)
ON DUPLICATE KEY UPDATE 
  step_id = (SELECT id FROM anamnesis_steps WHERE name = 'Detaylı Değerlendirme' LIMIT 1);

