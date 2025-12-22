CREATE TABLE IF NOT EXISTS anamnesis_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT,
  question_text TEXT NOT NULL,
  question_type ENUM(
    'yes_no',
    'yes_no_with_note',
    'text_input',
    'single_choice',
    'multiple_choice',
    'medication_list'
  ) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  order_index INT NOT NULL DEFAULT 0,
  -- For single_choice and multiple_choice: JSON array of options
  -- Example: ["Seçenek 1", "Seçenek 2", "Seçenek 3"]
  options_json TEXT NULL,
  -- Criteria for conditional display: JSON array
  -- Example: ["age_under_4", "consciousness_closed", "developmental_neurological"]
  criteria_json TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES anamnesis_categories(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

