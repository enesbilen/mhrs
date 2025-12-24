-- Create question_conditions table for dynamic question visibility
CREATE TABLE IF NOT EXISTS question_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  depends_on_question_id INT NOT NULL,
  action ENUM('show', 'hide') NOT NULL DEFAULT 'hide',
  condition_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES anamnesis_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_question_id) REFERENCES anamnesis_questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id),
  INDEX idx_depends_on (depends_on_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
