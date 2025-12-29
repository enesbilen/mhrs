-- Beklenen Sonuç Kriterleri Tablosu (Tanı bazında şablonlar)
CREATE TABLE IF NOT EXISTS diagnosis_expected_outcomes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  diagnosis_id INT NOT NULL,
  outcome_text VARCHAR(500) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  INDEX idx_diagnosis (diagnosis_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Girişimler Tablosu (Tanı bazında şablonlar)
CREATE TABLE IF NOT EXISTS diagnosis_interventions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  diagnosis_id INT NOT NULL,
  intervention_text VARCHAR(500) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  INDEX idx_diagnosis (diagnosis_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seçilen Beklenen Sonuç Kriterleri (Hasta bazında seçimler)
-- Eğer tablo yoksa oluştur, varsa foreign key'leri güncelle
CREATE TABLE IF NOT EXISTS care_plan_selected_outcomes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_plan_id INT NOT NULL,
  outcome_id INT NOT NULL,
  selected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (care_plan_id) REFERENCES nurse_care_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (outcome_id) REFERENCES diagnosis_expected_outcomes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_selected_outcome (care_plan_id, outcome_id),
  INDEX idx_care_plan (care_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seçilen Girişimler (Hasta bazında seçimler)
-- Eğer tablo yoksa oluştur, varsa foreign key'leri güncelle
CREATE TABLE IF NOT EXISTS care_plan_selected_interventions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_plan_id INT NOT NULL,
  intervention_id INT NOT NULL,
  selected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (care_plan_id) REFERENCES nurse_care_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (intervention_id) REFERENCES diagnosis_interventions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_selected_intervention (care_plan_id, intervention_id),
  INDEX idx_care_plan (care_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

