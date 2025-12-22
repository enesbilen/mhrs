CREATE TABLE IF NOT EXISTS diagnosis_criteria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  diagnosis_id INT NOT NULL,
  question_id INT NOT NULL,
  -- Accepted values as JSON array
  -- Example: ["Hayır"] or ["Düşük", "Çok düşük"] or ["İshal"]
  accepted_values_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES anamnesis_questions(id) ON DELETE CASCADE,
  INDEX idx_diagnosis (diagnosis_id),
  INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
