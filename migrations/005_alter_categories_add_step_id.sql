-- Add step_id column to anamnesis_categories
ALTER TABLE anamnesis_categories 
ADD COLUMN step_id INT NULL AFTER step,
ADD INDEX idx_step_id (step_id),
ADD FOREIGN KEY (step_id) REFERENCES anamnesis_steps(id) ON DELETE SET NULL;

-- Migrate existing step values to step_id
-- First, create default steps if they don't exist
INSERT IGNORE INTO anamnesis_steps (name, order_index) VALUES
  ('Genel Değerlendirme', 1),
  ('Detaylı Değerlendirme', 2);

-- Update categories to use step_id based on their current step value
UPDATE anamnesis_categories ac
INNER JOIN anamnesis_steps s ON s.order_index = ac.step
SET ac.step_id = s.id;

-- After migration is complete, you can drop the old step column
-- ALTER TABLE anamnesis_categories DROP COLUMN step;
-- ALTER TABLE anamnesis_categories DROP INDEX idx_step;

