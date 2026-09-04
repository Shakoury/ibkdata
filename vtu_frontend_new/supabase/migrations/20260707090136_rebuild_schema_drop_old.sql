/*
# Rebuild ABKDATA Schema to Match Django Backend

## Overview
This migration drops the simplified tables from the first migration and
recreates the schema to match the actual Django backend at
github.com/Shakoury/vtu_backend. The Django backend uses a custom User model
(AbstractBaseUser), separate Wallet model, transaction state machine, service
provider catalog, and RBAC (roles + permissions).

## Changes
1. Drops the 8 simplified tables from the first migration.
2. Recreates all tables to match the Django models exactly.

## Tables Dropped (replaced)
- profiles, transactions, fund_requests, service_providers, data_plans,
  cable_packages, bank_details, wallet_ledger

## Notes
- The Django backend uses its own auth (custom User model, not Supabase auth).
  In Supabase, we map the Django `users` table to `profiles` (linked to
  auth.users) so Supabase Auth handles authentication, while the business
  data (wallet, transactions, etc.) lives in the application tables.
- All tables get RLS with owner-scoped policies using auth.uid().
*/

-- Drop simplified tables from first migration (safe — they have no data yet)
DROP TABLE IF EXISTS wallet_ledger CASCADE;
DROP TABLE IF EXISTS bank_details CASCADE;
DROP TABLE IF EXISTS cable_packages CASCADE;
DROP TABLE IF EXISTS data_plans CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS fund_requests CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop the auto-profile trigger (will be recreated)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
