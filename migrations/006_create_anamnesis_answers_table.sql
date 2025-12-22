CREATE TABLE IF NOT EXISTS anamnesis_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  question_id INT NOT NULL,
  -- Answer value stored as JSON to handle different types
  -- yes_no: "Evet" or "Hayır"
  -- yes_no_with_note: {"answer": "Evet", "note": "açıklama"}
  -- text_input: "text value"
  -- single_choice: "selected option"
  -- multiple_choice: ["option1", "option2"]
  -- medication_list: [{"name": "...", "dose": "...", "route": "...", "time": "..."}]
  answer_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES anamnesis_forms(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES anamnesis_questions(id) ON DELETE CASCADE,
  INDEX idx_form (form_id),
  INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
