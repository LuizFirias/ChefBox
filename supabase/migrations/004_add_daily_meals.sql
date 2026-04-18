-- Migration: Add daily_meals table
-- Created: 2026-04-12
-- Purpose: Store user's daily meal macros (breakfast, lunch, snack, dinner)

CREATE TABLE IF NOT EXISTS public.daily_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  
  -- Meal data
  items JSONB NOT NULL, -- Array of food items with their individual macros
  
  -- Total macros for the meal
  total_calories INTEGER NOT NULL,
  total_protein_g NUMERIC(6,2) NOT NULL,
  total_carbs_g NUMERIC(6,2) NOT NULL,
  total_fat_g NUMERIC(6,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one meal of each type per day per user
  UNIQUE (user_id, meal_date, meal_type)
);

-- Index for faster queries by user and date
CREATE INDEX idx_daily_meals_user_date ON public.daily_meals(user_id, meal_date DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own meals" ON public.daily_meals;
CREATE POLICY "Users can read own meals"
ON public.daily_meals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.daily_meals;
CREATE POLICY "Users can insert own meals"
ON public.daily_meals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.daily_meals;
CREATE POLICY "Users can update own meals"
ON public.daily_meals FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.daily_meals;
CREATE POLICY "Users can delete own meals"
ON public.daily_meals FOR DELETE
USING (auth.uid() = user_id);
