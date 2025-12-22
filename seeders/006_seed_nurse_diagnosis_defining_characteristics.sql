-- Tanımlayıcı özellikler için seeder
-- "Beslenmede Dengesizlik: Beden gereksiniminden az" tanısı için örnek tanımlayıcı özellikler

-- Önce tanı ID'sini bulalım (eğer seeder çalıştırılmışsa)
INSERT INTO nurse_diagnosis_defining_characteristics (diagnosis_id, characteristic_text, order_index)
SELECT 
  nd.id,
  dc.characteristic_text,
  dc.order_index
FROM (
  SELECT 
    'Beslenmede Dengesizlik: Beden gereksiniminden az' as name,
    'Abdominal kramp' as characteristic_text,
    1 as order_index
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Abdominal ağrı', 2
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Kapiller frajilite', 3
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Konstipasyon', 4
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Yara iyileşmesinde geçikme', 5
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Diyare', 6
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Aşırı saç dökülmesi', 7
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Hiperaktif bağırsak sesleri', 8
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Hipoglisemi', 9
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Yaşa ve cinsiyete göre yetersiz baş çevresi büyümesi', 10
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Letarji', 11
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Kas hipotonisi', 12
  UNION ALL SELECT 'Beslenmede Dengesizlik: Beden gereksiniminden az', 'Mukozalarda solukluk', 13
) dc
INNER JOIN nurse_diagnoses nd ON nd.name = dc.name
WHERE NOT EXISTS (
  SELECT 1 FROM nurse_diagnosis_defining_characteristics ndc 
  WHERE ndc.diagnosis_id = nd.id AND ndc.characteristic_text = dc.characteristic_text
);

