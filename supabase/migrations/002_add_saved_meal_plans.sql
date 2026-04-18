-- Migration: Add saved_meal_plans table
-- Created: 2026-04-03
-- Purpose: Store user's saved meal plans with full payload and settings

CREATE TABLE IF NOT EXISTS public.saved_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX idx_saved_meal_plans_user_id ON public.saved_meal_plans(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own meal plans" ON public.saved_meal_plans;
CREATE POLICY "Users can read own meal plans"
ON public.saved_meal_plans FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.saved_meal_plans;
CREATE POLICY "Users can insert own meal plans"
ON public.saved_meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meal plans" ON public.saved_meal_plans;
CREATE POLICY "Users can update own meal plans"
ON public.saved_meal_plans FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meal plans" ON public.saved_meal_plans;
CREATE POLICY "Users can delete own meal plans"
ON public.saved_meal_plans FOR DELETE
USING (auth.uid() = user_id);
