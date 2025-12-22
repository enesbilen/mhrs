CREATE TABLE IF NOT EXISTS nurse_diagnosis_defining_characteristics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  diagnosis_id INT NOT NULL,
  characteristic_text VARCHAR(500) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnosis_id) REFERENCES nurse_diagnoses(id) ON DELETE CASCADE,
  INDEX idx_diagnosis (diagnosis_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

