-- Neon Schema for skintwinformx
-- Execute this script in the Neon database to create the necessary tables and relationships

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id varchar(50) PRIMARY KEY NOT NULL,
  inci_name varchar(255) NOT NULL,
  trade_names jsonb DEFAULT '[]',
  cas_number varchar(50),
  functions jsonb DEFAULT '[]',
  description text,
  concentration_range jsonb DEFAULT '{"min": 0.001, "max": 100}',
  safety_rating varchar(50) NOT NULL,
  usage_frequency integer DEFAULT 0,
  cosing jsonb,
  regulatory jsonb DEFAULT '{}',
  physical_properties jsonb DEFAULT '{}',
  network_properties jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create formulations table
CREATE TABLE IF NOT EXISTS formulations (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  type varchar(100) NOT NULL,
  description text,
  ingredient_count integer DEFAULT 0,
  complexity_score integer DEFAULT 0,
  target_benefits jsonb DEFAULT '[]',
  target_skin_types jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create phases table
CREATE TABLE IF NOT EXISTS phases (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  order integer NOT NULL,
  description text,
  processing_instructions text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create ingredient_usage table
CREATE TABLE IF NOT EXISTS ingredient_usage (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  ingredient_id varchar(50) NOT NULL,
  phase_id integer,
  concentration decimal(10, 4) NOT NULL,
  purpose varchar(255),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create formulation_properties table
CREATE TABLE IF NOT EXISTS formulation_properties (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  property_name varchar(100) NOT NULL,
  property_value varchar(255) NOT NULL,
  unit varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create stability_tests table
CREATE TABLE IF NOT EXISTS stability_tests (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  test_type varchar(100) NOT NULL,
  start_date timestamp NOT NULL,
  end_date timestamp,
  conditions jsonb NOT NULL,
  status varchar(50) NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create stability_observations table
CREATE TABLE IF NOT EXISTS stability_observations (
  id serial PRIMARY KEY,
  test_id integer NOT NULL,
  observation_date timestamp NOT NULL,
  parameter varchar(100) NOT NULL,
  value varchar(255) NOT NULL,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create regulatory_data table
CREATE TABLE IF NOT EXISTS regulatory_data (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  region varchar(100) NOT NULL,
  compliance_status varchar(50) NOT NULL,
  restrictions jsonb DEFAULT '[]',
  documentation jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  metric_name varchar(100) NOT NULL,
  metric_value decimal(10, 4) NOT NULL,
  test_method varchar(255),
  test_date timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create processing_instructions table
CREATE TABLE IF NOT EXISTS processing_instructions (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  equipment varchar(255),
  parameters jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create quality_control table
CREATE TABLE IF NOT EXISTS quality_control (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  parameter varchar(100) NOT NULL,
  specification varchar(255) NOT NULL,
  test_method varchar(255),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create packaging_compatibility table
CREATE TABLE IF NOT EXISTS packaging_compatibility (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  packaging_material varchar(100) NOT NULL,
  compatibility_status varchar(50) NOT NULL,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  code varchar(50) NOT NULL,
  contact_info jsonb DEFAULT '{}',
  certifications jsonb DEFAULT '[]',
  regions_served jsonb DEFAULT '[]',
  specialties jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  category varchar(100) NOT NULL,
  target_market varchar(100),
  price_point varchar(50),
  benefits jsonb DEFAULT '[]',
  ingredient_count integer DEFAULT 0,
  complexity_score integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create batch_records table
CREATE TABLE IF NOT EXISTS batch_records (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  batch_number varchar(50) NOT NULL UNIQUE,
  production_date timestamp NOT NULL,
  expiry_date timestamp,
  quantity decimal(10, 2) NOT NULL,
  unit varchar(20) NOT NULL,
  production_site varchar(255),
  equipment jsonb DEFAULT '[]',
  operators jsonb DEFAULT '[]',
  raw_material_lots jsonb DEFAULT '{}',
  qc_status varchar(50) NOT NULL DEFAULT 'pending',
  qc_date timestamp,
  qc_by varchar(255),
  deviations jsonb DEFAULT '[]',
  production_cost decimal(10, 2),
  packaging_cost decimal(10, 2),
  total_cost decimal(10, 2),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_inci_name ON ingredients (inci_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_cas_number ON ingredients (cas_number);
CREATE INDEX IF NOT EXISTS idx_formulations_type ON formulations (type);
CREATE INDEX IF NOT EXISTS idx_phases_formulation ON phases (formulation_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_formulation ON ingredient_usage (formulation_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_ingredient ON ingredient_usage (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_phase ON ingredient_usage (phase_id);
CREATE INDEX IF NOT EXISTS idx_formulation_properties_formulation ON formulation_properties (formulation_id);
CREATE INDEX IF NOT EXISTS idx_stability_tests_formulation ON stability_tests (formulation_id);
CREATE INDEX IF NOT EXISTS idx_stability_observations_test ON stability_observations (test_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_data_formulation ON regulatory_data (formulation_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_formulation ON performance_metrics (formulation_id);
CREATE INDEX IF NOT EXISTS idx_processing_instructions_formulation ON processing_instructions (formulation_id);
CREATE INDEX IF NOT EXISTS idx_quality_control_formulation ON quality_control (formulation_id);
CREATE INDEX IF NOT EXISTS idx_packaging_compatibility_formulation ON packaging_compatibility (formulation_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers (code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_batch_formulation ON batch_records (formulation_id);
CREATE INDEX IF NOT EXISTS idx_batch_number ON batch_records (batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_production_date ON batch_records (production_date);
CREATE INDEX IF NOT EXISTS idx_batch_qc_status ON batch_records (qc_status);

-- Add foreign key constraints
ALTER TABLE phases ADD CONSTRAINT fk_phases_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE ingredient_usage ADD CONSTRAINT fk_ingredient_usage_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE ingredient_usage ADD CONSTRAINT fk_ingredient_usage_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE;
ALTER TABLE ingredient_usage ADD CONSTRAINT fk_ingredient_usage_phase FOREIGN KEY (phase_id) REFERENCES phases (id) ON DELETE SET NULL;
ALTER TABLE formulation_properties ADD CONSTRAINT fk_formulation_properties_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE stability_tests ADD CONSTRAINT fk_stability_tests_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE stability_observations ADD CONSTRAINT fk_stability_observations_test FOREIGN KEY (test_id) REFERENCES stability_tests (id) ON DELETE CASCADE;
ALTER TABLE regulatory_data ADD CONSTRAINT fk_regulatory_data_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE performance_metrics ADD CONSTRAINT fk_performance_metrics_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE processing_instructions ADD CONSTRAINT fk_processing_instructions_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE quality_control ADD CONSTRAINT fk_quality_control_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE packaging_compatibility ADD CONSTRAINT fk_packaging_compatibility_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;
ALTER TABLE batch_records ADD CONSTRAINT fk_batch_records_formulation FOREIGN KEY (formulation_id) REFERENCES formulations (id) ON DELETE CASCADE;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formulations_updated_at
  BEFORE UPDATE ON formulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_usage_updated_at
  BEFORE UPDATE ON ingredient_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formulation_properties_updated_at
  BEFORE UPDATE ON formulation_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stability_tests_updated_at
  BEFORE UPDATE ON stability_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stability_observations_updated_at
  BEFORE UPDATE ON stability_observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_data_updated_at
  BEFORE UPDATE ON regulatory_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_instructions_updated_at
  BEFORE UPDATE ON processing_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_control_updated_at
  BEFORE UPDATE ON quality_control
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packaging_compatibility_updated_at
  BEFORE UPDATE ON packaging_compatibility
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_records_updated_at
  BEFORE UPDATE ON batch_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to import sample data
CREATE OR REPLACE FUNCTION import_sample_data()
RETURNS void AS $$
BEGIN
  -- Import sample ingredients
  INSERT INTO ingredients (id, inci_name, cas_number, functions, safety_rating)
  VALUES 
    ('R000001', 'Aqua', '7732-18-5', '["Solvent"]', 'Safe'),
    ('R000002', 'Glycerin', '56-81-5', '["Humectant", "Solvent"]', 'Safe'),
    ('R000003', 'Sodium Hyaluronate', '9067-32-7', '["Humectant", "Skin Conditioning"]', 'Safe')
  ON CONFLICT (id) DO NOTHING;
  
  -- Import sample formulations
  INSERT INTO formulations (id, name, type, description, ingredient_count)
  VALUES 
    ('F000001', 'Basic Moisturizer', 'Cream', 'A simple moisturizing cream', 3),
    ('F000002', 'Hydrating Serum', 'Serum', 'A hydrating serum with hyaluronic acid', 2)
  ON CONFLICT (id) DO NOTHING;
  
  -- Import sample phases
  INSERT INTO phases (formulation_id, name, order, description)
  VALUES 
    ('F000001', 'Water Phase', 1, 'Combine water-soluble ingredients'),
    ('F000001', 'Oil Phase', 2, 'Combine oil-soluble ingredients'),
    ('F000002', 'Active Phase', 1, 'Combine active ingredients')
  ON CONFLICT DO NOTHING;
  
  -- Import sample ingredient usage
  INSERT INTO ingredient_usage (formulation_id, ingredient_id, concentration, purpose)
  VALUES 
    ('F000001', 'R000001', 70.0, 'Base'),
    ('F000001', 'R000002', 5.0, 'Moisturizer'),
    ('F000002', 'R000001', 90.0, 'Base'),
    ('F000002', 'R000003', 1.0, 'Active')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
