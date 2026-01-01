-- Fix: Add missing columns to OTP tables
-- Run this SQL in Supabase SQL Editor to fix the "column does not exist" errors

-- ============================================================================
-- FIX 1: Add 'name' column (code expects 'name', DB has 'title')
-- Option A: Rename 'title' to 'name' (RECOMMENDED)
-- ============================================================================
ALTER TABLE public.master_programs RENAME COLUMN title TO name;

-- ============================================================================
-- FIX 2: Add missing columns to master_programs
-- ============================================================================
ALTER TABLE public.master_programs ADD COLUMN IF NOT EXISTS reference_doc TEXT;

-- ============================================================================
-- FIX 3: Add missing columns to program_progress
-- ============================================================================
ALTER TABLE public.program_progress ADD COLUMN IF NOT EXISTS pic_manager TEXT;
ALTER TABLE public.program_progress ADD COLUMN IF NOT EXISTS pic_manager_email TEXT;
ALTER TABLE public.program_progress ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- ============================================================================
-- Verify the changes
-- ============================================================================
-- Run this to check the columns are now correct:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'master_programs' ORDER BY ordinal_position;
