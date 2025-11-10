-- CEO (Cognitive Execution Orchestration) Subsystem Tables
-- Migration: 001
-- Created: November 10, 2025
-- Purpose: Track JAX-powered cognitive operations and optimizations

-- CEO Task Execution Log
CREATE TABLE IF NOT EXISTS public.ceo_task_log (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) UNIQUE NOT NULL,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('analysis', 'optimization', 'prediction', 'generation')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failure', 'partial')),
  input_data JSONB,
  result_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  memory_used_mb REAL,
  cpu_utilization REAL,
  gpu_utilization REAL,
  device_used VARCHAR(20),
  insights TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_ceo_task_log_task_id ON public.ceo_task_log(task_id);
CREATE INDEX idx_ceo_task_log_status ON public.ceo_task_log(status);
CREATE INDEX idx_ceo_task_log_task_type ON public.ceo_task_log(task_type);
CREATE INDEX idx_ceo_task_log_created_at ON public.ceo_task_log(created_at DESC);

-- Formulation Optimization History
CREATE TABLE IF NOT EXISTS public.formulation_optimization_history (
  id SERIAL PRIMARY KEY,
  optimization_id VARCHAR(100) UNIQUE NOT NULL,
  formulation_id VARCHAR(100),
  optimization_method VARCHAR(50) NOT NULL,
  initial_objective REAL,
  final_objective REAL,
  iterations INTEGER,
  convergence_status VARCHAR(50),
  target_properties JSONB,
  constraints JSONB,
  optimization_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_formulation_optimization_formulation_id ON public.formulation_optimization_history(formulation_id);
CREATE INDEX idx_formulation_optimization_created_at ON public.formulation_optimization_history(created_at DESC);

-- Multi-Scale Analysis Results
CREATE TABLE IF NOT EXISTS public.multiscale_analysis_results (
  id SERIAL PRIMARY KEY,
  analysis_id VARCHAR(100) UNIQUE NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  scales_analyzed TEXT[],
  correlations JSONB,
  causal_relationships JSONB,
  emergent_properties JSONB,
  insights TEXT[],
  confidence_score REAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_multiscale_analysis_type ON public.multiscale_analysis_results(analysis_type);
CREATE INDEX idx_multiscale_analysis_created_at ON public.multiscale_analysis_results(created_at DESC);

-- Skin Condition Predictions
CREATE TABLE IF NOT EXISTS public.skin_condition_predictions (
  id SERIAL PRIMARY KEY,
  prediction_id VARCHAR(100) UNIQUE NOT NULL,
  user_features JSONB,
  conditions_predicted TEXT[],
  predictions JSONB,
  recommendations JSONB,
  time_horizon_days INTEGER,
  confidence_score REAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skin_condition_predictions_created_at ON public.skin_condition_predictions(created_at DESC);

-- JAX Model Registry
CREATE TABLE IF NOT EXISTS public.jax_model_registry (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(100) UNIQUE NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  architecture JSONB,
  parameters JSONB,
  training_config JSONB,
  performance_metrics JSONB,
  version VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('training', 'trained', 'deployed', 'deprecated')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jax_model_registry_model_id ON public.jax_model_registry(model_id);
CREATE INDEX idx_jax_model_registry_status ON public.jax_model_registry(status);

-- CEO Performance Metrics
CREATE TABLE IF NOT EXISTS public.ceo_performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_timestamp TIMESTAMP DEFAULT NOW(),
  active_tasks INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  average_execution_time_ms REAL,
  average_memory_usage_mb REAL,
  average_cpu_utilization REAL,
  average_gpu_utilization REAL,
  success_rate REAL,
  error_rate REAL,
  device_distribution JSONB
);

CREATE INDEX idx_ceo_performance_metrics_timestamp ON public.ceo_performance_metrics(metric_timestamp DESC);

-- Create view for CEO dashboard
CREATE OR REPLACE VIEW public.ceo_dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'running') as active_tasks,
  COUNT(*) FILTER (WHERE status = 'success') as successful_tasks,
  COUNT(*) FILTER (WHERE status = 'failure') as failed_tasks,
  AVG(execution_time_ms) as avg_execution_time,
  AVG(memory_used_mb) as avg_memory_usage,
  AVG(cpu_utilization) as avg_cpu_utilization,
  COUNT(DISTINCT task_type) as task_types_count,
  MAX(created_at) as last_task_time
FROM public.ceo_task_log
WHERE created_at > NOW() - INTERVAL '24 hours';

COMMENT ON TABLE public.ceo_task_log IS 'Logs all tasks executed by the CEO (Cognitive Execution Orchestration) subsystem';
COMMENT ON TABLE public.formulation_optimization_history IS 'History of formulation optimizations using gradient-based methods';
COMMENT ON TABLE public.multiscale_analysis_results IS 'Results from multi-scale analysis across molecular, cellular, tissue, and organ levels';
COMMENT ON TABLE public.skin_condition_predictions IS 'Predictions of skin conditions using neural networks';
COMMENT ON TABLE public.jax_model_registry IS 'Registry of JAX-based neural network models';
COMMENT ON TABLE public.ceo_performance_metrics IS 'Performance metrics for the CEO subsystem';
