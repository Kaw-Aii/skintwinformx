-- Supabase Schema for skintwinformx
-- Execute this script in the Supabase SQL Editor to create the necessary tables and relationships

-- Create schema for skintwinformx
CREATE SCHEMA IF NOT EXISTS skintwinformx;

-- Set the search path to use our schema
SET search_path TO skintwinformx, public;

-- Create ingredients table
CREATE TABLE IF NOT EXISTS skintwinformx.ingredients (
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
CREATE TABLE IF NOT EXISTS skintwinformx.formulations (
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
CREATE TABLE IF NOT EXISTS skintwinformx.phases (
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
CREATE TABLE IF NOT EXISTS skintwinformx.ingredient_usage (
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
CREATE TABLE IF NOT EXISTS skintwinformx.formulation_properties (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  property_name varchar(100) NOT NULL,
  property_value varchar(255) NOT NULL,
  unit varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create stability_tests table
CREATE TABLE IF NOT EXISTS skintwinformx.stability_tests (
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
CREATE TABLE IF NOT EXISTS skintwinformx.stability_observations (
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
CREATE TABLE IF NOT EXISTS skintwinformx.regulatory_data (
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
CREATE TABLE IF NOT EXISTS skintwinformx.performance_metrics (
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
CREATE TABLE IF NOT EXISTS skintwinformx.processing_instructions (
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
CREATE TABLE IF NOT EXISTS skintwinformx.quality_control (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  parameter varchar(100) NOT NULL,
  specification varchar(255) NOT NULL,
  test_method varchar(255),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create packaging_compatibility table
CREATE TABLE IF NOT EXISTS skintwinformx.packaging_compatibility (
  id serial PRIMARY KEY,
  formulation_id varchar(50) NOT NULL,
  packaging_material varchar(100) NOT NULL,
  compatibility_status varchar(50) NOT NULL,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS skintwinformx.suppliers (
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
CREATE TABLE IF NOT EXISTS skintwinformx.products (
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
CREATE TABLE IF NOT EXISTS skintwinformx.batch_records (
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
CREATE INDEX IF NOT EXISTS idx_ingredients_inci_name ON skintwinformx.ingredients (inci_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_cas_number ON skintwinformx.ingredients (cas_number);
CREATE INDEX IF NOT EXISTS idx_formulations_type ON skintwinformx.formulations (type);
CREATE INDEX IF NOT EXISTS idx_phases_formulation ON skintwinformx.phases (formulation_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_formulation ON skintwinformx.ingredient_usage (formulation_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_ingredient ON skintwinformx.ingredient_usage (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_phase ON skintwinformx.ingredient_usage (phase_id);
CREATE INDEX IF NOT EXISTS idx_formulation_properties_formulation ON skintwinformx.formulation_properties (formulation_id);
CREATE INDEX IF NOT EXISTS idx_stability_tests_formulation ON skintwinformx.stability_tests (formulation_id);
CREATE INDEX IF NOT EXISTS idx_stability_observations_test ON skintwinformx.stability_observations (test_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_data_formulation ON skintwinformx.regulatory_data (formulation_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_formulation ON skintwinformx.performance_metrics (formulation_id);
CREATE INDEX IF NOT EXISTS idx_processing_instructions_formulation ON skintwinformx.processing_instructions (formulation_id);
CREATE INDEX IF NOT EXISTS idx_quality_control_formulation ON skintwinformx.quality_control (formulation_id);
CREATE INDEX IF NOT EXISTS idx_packaging_compatibility_formulation ON skintwinformx.packaging_compatibility (formulation_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON skintwinformx.suppliers (code);
CREATE INDEX IF NOT EXISTS idx_products_category ON skintwinformx.products (category);
CREATE INDEX IF NOT EXISTS idx_batch_formulation ON skintwinformx.batch_records (formulation_id);
CREATE INDEX IF NOT EXISTS idx_batch_number ON skintwinformx.batch_records (batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_production_date ON skintwinformx.batch_records (production_date);
CREATE INDEX IF NOT EXISTS idx_batch_qc_status ON skintwinformx.batch_records (qc_status);

-- Add foreign key constraints
ALTER TABLE skintwinformx.phases ADD CONSTRAINT fk_phases_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.ingredient_usage ADD CONSTRAINT fk_ingredient_usage_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.ingredient_usage ADD CONSTRAINT fk_ingredient_usage_ingredient FOREIGN KEY (ingredient_id) REFERENCES skintwinformx.ingredients (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.ingredient_usage ADD CONSTRAINT fk_ingredient_usage_phase FOREIGN KEY (phase_id) REFERENCES skintwinformx.phases (id) ON DELETE SET NULL;
ALTER TABLE skintwinformx.formulation_properties ADD CONSTRAINT fk_formulation_properties_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.stability_tests ADD CONSTRAINT fk_stability_tests_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.stability_observations ADD CONSTRAINT fk_stability_observations_test FOREIGN KEY (test_id) REFERENCES skintwinformx.stability_tests (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.regulatory_data ADD CONSTRAINT fk_regulatory_data_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.performance_metrics ADD CONSTRAINT fk_performance_metrics_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.processing_instructions ADD CONSTRAINT fk_processing_instructions_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.quality_control ADD CONSTRAINT fk_quality_control_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.packaging_compatibility ADD CONSTRAINT fk_packaging_compatibility_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;
ALTER TABLE skintwinformx.batch_records ADD CONSTRAINT fk_batch_records_formulation FOREIGN KEY (formulation_id) REFERENCES skintwinformx.formulations (id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE skintwinformx.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.ingredient_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.formulation_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.stability_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.stability_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.regulatory_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.processing_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.quality_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.packaging_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE skintwinformx.batch_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to ingredients" ON skintwinformx.ingredients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to formulations" ON skintwinformx.formulations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to phases" ON skintwinformx.phases
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to ingredient_usage" ON skintwinformx.ingredient_usage
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to formulation_properties" ON skintwinformx.formulation_properties
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to stability_tests" ON skintwinformx.stability_tests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to stability_observations" ON skintwinformx.stability_observations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to regulatory_data" ON skintwinformx.regulatory_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to performance_metrics" ON skintwinformx.performance_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to processing_instructions" ON skintwinformx.processing_instructions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to quality_control" ON skintwinformx.quality_control
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to packaging_compatibility" ON skintwinformx.packaging_compatibility
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to suppliers" ON skintwinformx.suppliers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to products" ON skintwinformx.products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to batch_records" ON skintwinformx.batch_records
  FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION skintwinformx.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON skintwinformx.ingredients
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_formulations_updated_at
  BEFORE UPDATE ON skintwinformx.formulations
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_phases_updated_at
  BEFORE UPDATE ON skintwinformx.phases
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_ingredient_usage_updated_at
  BEFORE UPDATE ON skintwinformx.ingredient_usage
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_formulation_properties_updated_at
  BEFORE UPDATE ON skintwinformx.formulation_properties
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_stability_tests_updated_at
  BEFORE UPDATE ON skintwinformx.stability_tests
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_stability_observations_updated_at
  BEFORE UPDATE ON skintwinformx.stability_observations
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_regulatory_data_updated_at
  BEFORE UPDATE ON skintwinformx.regulatory_data
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON skintwinformx.performance_metrics
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_processing_instructions_updated_at
  BEFORE UPDATE ON skintwinformx.processing_instructions
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_quality_control_updated_at
  BEFORE UPDATE ON skintwinformx.quality_control
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_packaging_compatibility_updated_at
  BEFORE UPDATE ON skintwinformx.packaging_compatibility
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON skintwinformx.suppliers
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON skintwinformx.products
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

CREATE TRIGGER update_batch_records_updated_at
  BEFORE UPDATE ON skintwinformx.batch_records
  FOR EACH ROW EXECUTE FUNCTION skintwinformx.update_updated_at_column();

-- Create a function to import sample data from vessels
CREATE OR REPLACE FUNCTION skintwinformx.import_sample_data()
RETURNS void AS $$
BEGIN
  -- Import sample ingredients
  INSERT INTO skintwinformx.ingredients (id, inci_name, cas_number, functions, safety_rating)
  VALUES 
    ('R000001', 'Aqua', '7732-18-5', '["Solvent"]', 'Safe'),
    ('R000002', 'Glycerin', '56-81-5', '["Humectant", "Solvent"]', 'Safe'),
    ('R000003', 'Sodium Hyaluronate', '9067-32-7', '["Humectant", "Skin Conditioning"]', 'Safe')
  ON CONFLICT (id) DO NOTHING;
  
  -- Import sample formulations
  INSERT INTO skintwinformx.formulations (id, name, type, description, ingredient_count)
  VALUES 
    ('F000001', 'Basic Moisturizer', 'Cream', 'A simple moisturizing cream', 3),
    ('F000002', 'Hydrating Serum', 'Serum', 'A hydrating serum with hyaluronic acid', 2)
  ON CONFLICT (id) DO NOTHING;
  
  -- Import sample phases
  INSERT INTO skintwinformx.phases (formulation_id, name, order, description)
  VALUES 
    ('F000001', 'Water Phase', 1, 'Combine water-soluble ingredients'),
    ('F000001', 'Oil Phase', 2, 'Combine oil-soluble ingredients'),
    ('F000002', 'Active Phase', 1, 'Combine active ingredients')
  ON CONFLICT DO NOTHING;
  
  -- Import sample ingredient usage
  INSERT INTO skintwinformx.ingredient_usage (formulation_id, ingredient_id, concentration, purpose)
  VALUES 
    ('F000001', 'R000001', 70.0, 'Base'),
    ('F000001', 'R000002', 5.0, 'Moisturizer'),
    ('F000002', 'R000001', 90.0, 'Base'),
    ('F000002', 'R000003', 1.0, 'Active')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
