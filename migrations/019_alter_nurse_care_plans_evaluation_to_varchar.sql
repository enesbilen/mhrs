-- Evaluation kolonunu ENUM'dan VARCHAR'a çevir (dinamik değerlendirme seçenekleri için)
ALTER TABLE nurse_care_plans 
MODIFY COLUMN evaluation VARCHAR(100) NULL;

