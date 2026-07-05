-- ChronoFlow: Security Fixes (from Supabase DB Linter warnings)
-- Run this in Supabase SQL Editor AFTER setup_remote_db.sql and migration_m1.sql
-- https://supabase.com/dashboard/project/dkuwoqqgdihmkadkiczu/sql/new

-- ============================================================
-- 1. Revoke EXECUTE on SECURITY DEFINER trigger functions
-- ============================================================
-- These are trigger functions that run internally via TRIGGER,
-- not meant to be called via REST API (PostgREST rpc).

-- handle_new_user: trigger on auth.users INSERT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, service_role;
    RAISE NOTICE 'Revoked EXECUTE on handle_new_user()';
  ELSE
    RAISE NOTICE 'handle_new_user() not found, skipping';
  END IF;
END $$;

-- rls_auto_enable: trigger function (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'rls_auto_enable'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, service_role;
    RAISE NOTICE 'Revoked EXECUTE on rls_auto_enable()';
  ELSE
    RAISE NOTICE 'rls_auto_enable() not found, skipping';
  END IF;
END $$;

-- update_updated_at: trigger function created in migration_m1.sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, service_role;
    RAISE NOTICE 'Revoked EXECUTE on update_updated_at()';
  ELSE
    RAISE NOTICE 'update_updated_at() not found, skipping';
  END IF;
END $$;

-- ============================================================
-- 2. Verify: these queries should return 0 rows after fix
-- ============================================================
-- SELECT
--   grantee,
--   routine_schema,
--   routine_name,
--   security_type
-- FROM information_schema.role_routine_grants
-- WHERE grantee IN ('anon', 'authenticated')
--   AND security_type = 'DEFINER';

-- ============================================================
-- 3. Enable leaked password protection (Dashboard only)
-- ============================================================
-- Go to: Dashboard → Authentication → Password Settings
-- Toggle: "Check password against breached password database"
-- This is NOT configurable via SQL.
