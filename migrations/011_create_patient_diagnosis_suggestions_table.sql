CREATE TABLE IF NOT EXISTS patient_diagnosis_suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  diagnosis_id INT NOT NULL,
  matched_criteria_count INT NOT NULL,
  suggested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES anamnesis_forms(id) ON DELETE CASCADE,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  INDEX idx_form (form_id),
  INDEX idx_diagnosis (diagnosis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

