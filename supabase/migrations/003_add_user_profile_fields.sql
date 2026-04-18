-- Migration: Add weight and height fields to users table
-- Created: 2026-04-12
-- Purpose: Store user's weight and height for macro calculations and personalization

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS height TEXT;
