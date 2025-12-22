CREATE TABLE IF NOT EXISTS anamnesis_forms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  created_by INT NOT NULL,
  -- Static answers (Step 1) stored as JSON
  -- Contains: developmental_neurological, allergies, chronic_disease, surgery, home_medication,
  -- admission_from, admission_reason, brought_equipment, consciousness
  static_answers_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_patient (patient_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

