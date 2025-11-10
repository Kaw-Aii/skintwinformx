-- CEO (Cognitive Execution Orchestration) Subsystem Tables
-- Created: November 10, 2025

CREATE TABLE IF NOT EXISTS public.ceo_task_log (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) UNIQUE NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ceo_task_log_task_id ON public.ceo_task_log(task_id);
