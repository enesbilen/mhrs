-- Fix foreign keys for care_plan_selected_outcomes and care_plan_selected_interventions
-- Note: This migration may need to be run manually if foreign key names differ

-- Drop old foreign keys (adjust constraint names if needed)
-- You may need to check actual constraint names first:
-- SHOW CREATE TABLE care_plan_selected_outcomes;
-- SHOW CREATE TABLE care_plan_selected_interventions;

-- Try to drop old foreign keys (will fail silently if they don't exist)
ALTER TABLE care_plan_selected_outcomes DROP FOREIGN KEY care_plan_selected_outcomes_ibfk_2;

ALTER TABLE care_plan_selected_interventions DROP FOREIGN KEY care_plan_selected_interventions_ibfk_2;

-- Add correct foreign keys
ALTER TABLE care_plan_selected_outcomes 
  ADD CONSTRAINT care_plan_selected_outcomes_ibfk_2 
  FOREIGN KEY (outcome_id) REFERENCES diagnosis_expected_outcomes(id) ON DELETE CASCADE;

ALTER TABLE care_plan_selected_interventions 
  ADD CONSTRAINT care_plan_selected_interventions_ibfk_2 
  FOREIGN KEY (intervention_id) REFERENCES diagnosis_interventions(id) ON DELETE CASCADE;
