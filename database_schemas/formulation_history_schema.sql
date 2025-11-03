-- Enhanced Database Schema for Formulation History Tracking
-- Generated on: 2025-11-03
-- Purpose: Track formulation changes, versions, and audit trail

-- Formulation History Table
CREATE TABLE IF NOT EXISTS formulation_history (
  id SERIAL PRIMARY KEY,
  formulation_id VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  changes JSONB NOT NULL,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_type VARCHAR(50) CHECK (change_type IN ('create', 'update', 'delete', 'ingredient_add', 'ingredient_remove', 'concentration_change')),
  previous_state JSONB,
  current_state JSONB,
  notes TEXT,
  UNIQUE(formulation_id, version)
);

-- Formulation Metadata Table
CREATE TABLE IF NOT EXISTS formulation_metadata (
  id SERIAL PRIMARY KEY,
  formulation_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_skin_type VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) CHECK (status IN ('draft', 'testing', 'approved', 'archived')) DEFAULT 'draft',
  tags JSONB,
  regulatory_status JSONB
);

-- Ingredient Usage Tracking
CREATE TABLE IF NOT EXISTS ingredient_usage (
  id SERIAL PRIMARY KEY,
  formulation_id VARCHAR(50) NOT NULL,
  ingredient_id VARCHAR(20) NOT NULL,
  concentration DECIMAL(5,2),
  concentration_unit VARCHAR(20) DEFAULT '%',
  function VARCHAR(100),
  added_at TIMESTAMP DEFAULT NOW(),
  removed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (formulation_id) REFERENCES formulation_metadata(formulation_id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_formulation_history_id ON formulation_history(formulation_id);
CREATE INDEX IF NOT EXISTS idx_formulation_history_timestamp ON formulation_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_formulation_history_type ON formulation_history(change_type);
CREATE INDEX IF NOT EXISTS idx_formulation_metadata_status ON formulation_metadata(status);
CREATE INDEX IF NOT EXISTS idx_formulation_metadata_category ON formulation_metadata(category);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_formulation ON ingredient_usage(formulation_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_ingredient ON ingredient_usage(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_active ON ingredient_usage(is_active);

-- Trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_formulation_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_formulation_metadata_timestamp
BEFORE UPDATE ON formulation_metadata
FOR EACH ROW
EXECUTE FUNCTION update_formulation_metadata_timestamp();

-- View for active formulations with ingredient counts
CREATE OR REPLACE VIEW active_formulations_summary AS
SELECT 
  fm.formulation_id,
  fm.name,
  fm.category,
  fm.status,
  fm.created_at,
  fm.updated_at,
  COUNT(iu.id) FILTER (WHERE iu.is_active = TRUE) as active_ingredient_count,
  MAX(fh.version) as latest_version
FROM formulation_metadata fm
LEFT JOIN ingredient_usage iu ON fm.formulation_id = iu.formulation_id
LEFT JOIN formulation_history fh ON fm.formulation_id = fh.formulation_id
WHERE fm.status != 'archived'
GROUP BY fm.formulation_id, fm.name, fm.category, fm.status, fm.created_at, fm.updated_at;

-- View for formulation change timeline
CREATE OR REPLACE VIEW formulation_change_timeline AS
SELECT 
  fh.formulation_id,
  fm.name as formulation_name,
  fh.version,
  fh.change_type,
  fh.changed_by,
  fh.changed_at,
  fh.notes,
  jsonb_array_length(COALESCE(fh.changes, '[]'::jsonb)) as change_count
FROM formulation_history fh
JOIN formulation_metadata fm ON fh.formulation_id = fm.formulation_id
ORDER BY fh.changed_at DESC;
