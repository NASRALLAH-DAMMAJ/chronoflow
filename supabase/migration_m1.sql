-- ChronoFlow M1 Migration: Critical Bug Fixes & Data Integrity
-- Run this in Supabase SQL Editor AFTER setup_remote_db.sql
-- https://supabase.com/dashboard/project/dkuwoqqgdihmkadkiczu/sql/new

-- 1. Add unique constraint on blocks(user_id, date, start_min)
--    Prevents duplicate blocks at the same time for the same user on the same day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blocks_user_date_start_unique'
  ) THEN
    ALTER TABLE public.blocks
      ADD CONSTRAINT blocks_user_date_start_unique
      UNIQUE (user_id, date, start_min);
  END IF;
END $$;

-- 2. Add unique constraint on recurring_rules(user_id, label, category, start_min)
--    Prevents duplicate rules with same label/category/start time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recurring_rules_user_label_cat_start_unique'
  ) THEN
    ALTER TABLE public.recurring_rules
      ADD CONSTRAINT recurring_rules_user_label_cat_start_unique
      UNIQUE (user_id, label, category, start_min);
  END IF;
END $$;

-- 3. Add index on blocks(user_id, date) for faster day queries
CREATE INDEX IF NOT EXISTS idx_blocks_user_date
  ON public.blocks(user_id, date);

-- 4. Add index on blocks(user_id, archived) for faster archive queries
CREATE INDEX IF NOT EXISTS idx_blocks_user_archived
  ON public.blocks(user_id, archived);

-- 5. Add index on recurring_rules(user_id) for faster rule lookups
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user
  ON public.recurring_rules(user_id);

-- 6. Auto-update updated_at on blocks table
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_blocks_updated_at ON public.blocks;
CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. Auto-update updated_at on recurring_rules table
DROP TRIGGER IF EXISTS update_recurring_rules_updated_at ON public.recurring_rules;
CREATE TRIGGER update_recurring_rules_updated_at
  BEFORE UPDATE ON public.recurring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 8. Auto-update updated_at on settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 9. Clean up any existing duplicate blocks (keep earliest created_at)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date, start_min
      ORDER BY created_at ASC
    ) as rn
  FROM public.blocks
)
DELETE FROM public.blocks
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 10. Clean up any existing duplicate recurring rules (keep earliest created_at)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, label, category, start_min
      ORDER BY created_at ASC
    ) as rn
  FROM public.recurring_rules
)
DELETE FROM public.recurring_rules
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
