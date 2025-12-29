-- Değerlendirme Seçenekleri Tablosu (Tanı bazında)
CREATE TABLE IF NOT EXISTS diagnosis_evaluation_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  diagnosis_id INT NOT NULL,
  option_text VARCHAR(255) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  INDEX idx_diagnosis (diagnosis_id),
  INDEX idx_order (order_index),
  UNIQUE KEY unique_diagnosis_option_value (diagnosis_id, option_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mevcut tanılar için varsayılan değerlendirme seçeneklerini ekle
INSERT INTO diagnosis_evaluation_options (diagnosis_id, option_text, option_value, order_index)
SELECT 
  id as diagnosis_id,
  'Ulaşıldı' as option_text,
  'ulaşıldı' as option_value,
  1 as order_index
FROM nurse_diagnoses
WHERE NOT EXISTS (
  SELECT 1 FROM diagnosis_evaluation_options 
  WHERE diagnosis_evaluation_options.diagnosis_id = nurse_diagnoses.id 
  AND diagnosis_evaluation_options.option_value = 'ulaşıldı'
);

INSERT INTO diagnosis_evaluation_options (diagnosis_id, option_text, option_value, order_index)
SELECT 
  id as diagnosis_id,
  'Kısmen Ulaşıldı' as option_text,
  'kısmen_ulaşıldı' as option_value,
  2 as order_index
FROM nurse_diagnoses
WHERE NOT EXISTS (
  SELECT 1 FROM diagnosis_evaluation_options 
  WHERE diagnosis_evaluation_options.diagnosis_id = nurse_diagnoses.id 
  AND diagnosis_evaluation_options.option_value = 'kısmen_ulaşıldı'
);

INSERT INTO diagnosis_evaluation_options (diagnosis_id, option_text, option_value, order_index)
SELECT 
  id as diagnosis_id,
  'Ulaşılamadı' as option_text,
  'ulaşılamadı' as option_value,
  3 as order_index
FROM nurse_diagnoses
WHERE NOT EXISTS (
  SELECT 1 FROM diagnosis_evaluation_options 
  WHERE diagnosis_evaluation_options.diagnosis_id = nurse_diagnoses.id 
  AND diagnosis_evaluation_options.option_value = 'ulaşılamadı'
);

