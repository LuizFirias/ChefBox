-- ChefBox Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RECIPES TABLE
-- Stores all generated recipes (shared across users)
-- ============================================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prep_time TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 2,
  estimated_cost TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);

-- ============================================================================
-- USER_RECIPES TABLE
-- Tracks which recipes each user has saved
-- ============================================================================
CREATE TABLE user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  -- Ensure user doesn't save same recipe twice
  UNIQUE(user_id, recipe_id)
);

-- Indexes for fast user queries
CREATE INDEX idx_user_recipes_user_id ON user_recipes(user_id, saved_at DESC);
CREATE INDEX idx_user_recipes_recipe_id ON user_recipes(recipe_id);

-- ============================================================================
-- SHOPPING_LISTS TABLE
-- User shopping lists with items
-- ============================================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova lista',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for user lists
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id, created_at DESC);

-- ============================================================================
-- MEAL_PLANS TABLE
-- Weekly meal planning for premium users
-- ============================================================================
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Planejamento semanal',
  plan JSONB NOT NULL DEFAULT '[]',
  shopping_list JSONB NOT NULL DEFAULT '[]',
  prep_notes JSONB NOT NULL DEFAULT '[]',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user meal plans
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id, start_date DESC);

-- ============================================================================
-- GENERATION_HISTORY TABLE
-- Track AI generation history per user
-- ============================================================================
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('recipe', 'meal_plan')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('ai', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rate limiting and analytics
CREATE INDEX idx_generation_history_user_id ON generation_history(user_id, created_at DESC);
CREATE INDEX idx_generation_history_ip ON generation_history(ip_address, created_at DESC);
CREATE INDEX idx_generation_history_type ON generation_history(generation_type, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables that contain user data
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- RECIPES: Public read, no direct writes (controlled by API)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_public_read" ON recipes FOR SELECT USING (true);

-- USER_RECIPES: Users can only see and manage their own saved recipes
CREATE POLICY "user_recipes_own_read" ON user_recipes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_recipes_own_insert" ON user_recipes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_recipes_own_delete" ON user_recipes 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_recipes_own_update" ON user_recipes 
  FOR UPDATE USING (auth.uid() = user_id);

-- SHOPPING_LISTS: Users can only access their own lists
CREATE POLICY "shopping_lists_own_read" ON shopping_lists 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_own_insert" ON shopping_lists 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_own_update" ON shopping_lists 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_own_delete" ON shopping_lists 
  FOR DELETE USING (auth.uid() = user_id);

-- MEAL_PLANS: Users can only access their own plans
CREATE POLICY "meal_plans_own_read" ON meal_plans 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meal_plans_own_insert" ON meal_plans 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plans_own_update" ON meal_plans 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meal_plans_own_delete" ON meal_plans 
  FOR DELETE USING (auth.uid() = user_id);

-- GENERATION_HISTORY: Users can only read their own history
CREATE POLICY "generation_history_own_read" ON generation_history 
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View combining recipes with user save status
CREATE OR REPLACE VIEW user_recipe_status AS
SELECT 
  r.*,
  CASE 
    WHEN ur.id IS NOT NULL THEN true 
    ELSE false 
  END as is_saved,
  ur.saved_at,
  ur.notes as user_notes
FROM recipes r
LEFT JOIN user_recipes ur ON r.id = ur.recipe_id AND ur.user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_recipe_status TO authenticated;

-- ============================================================================
-- INITIAL DATA / SEED (optional)
-- ============================================================================

-- You can add initial seed data here if needed
-- Example: default categories, sample recipes, etc.

COMMENT ON TABLE recipes IS 'All generated recipes, shared across the platform';
COMMENT ON TABLE user_recipes IS 'User-saved recipes relationship table';
COMMENT ON TABLE shopping_lists IS 'User shopping lists with checked items';
COMMENT ON TABLE meal_plans IS 'Weekly meal planning data';
COMMENT ON TABLE generation_history IS 'AI generation audit log';
