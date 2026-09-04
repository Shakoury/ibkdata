/*
# ABKDATA Schema — Seed Catalog Data

## Overview
Seeds the service catalog tables with Nigerian electricity providers, cable
TV providers and packages, and data plans for all four networks (MTN, Airtel,
Glo, 9Mobile). This matches the service catalog the Django backend expects.

## Seeded Tables
1. **electricity_providers** — Nigerian electricity distribution companies.
2. **cable_tv_providers** — DStv, GOtv, StarTimes.
3. **cable_tv_packages** — Subscription packages per cable provider.
4. **data_plans** — Data plans per network (MTN, Airtel, Glo, 9Mobile).

## Notes
- All inserts use ON CONFLICT DO NOTHING for idempotency.
- Prices are in NGN and reflect typical Nigerian market rates.
*/

-- ============================================================
-- 1. ELECTRICITY PROVIDERS (Nigerian DisCos)
-- ============================================================
INSERT INTO electricity_providers (name, code, meter_types, is_active) VALUES
  ('Ikeja Electric (IKEDC)', 'IKEDC', '["PREPAID","POSTPAID"]', true),
  ('Eko Electric (EKEDC)', 'EKEDC', '["PREPAID","POSTPAID"]', true),
  ('Abuja Electric (AEDC)', 'AEDC', '["PREPAID","POSTPAID"]', true),
  ('Port Harcourt Electric (PHED)', 'PHED', '["PREPAID","POSTPAID"]', true),
  ('Ibadan Electric (IBEDC)', 'IBEDC', '["PREPAID","POSTPAID"]', true),
  ('Kano Electric (KEDCO)', 'KEDCO', '["PREPAID","POSTPAID"]', true),
  ('Enugu Electric (EEDC)', 'EEDC', '["PREPAID","POSTPAID"]', true),
  ('Jos Electric (JED)', 'JED', '["PREPAID","POSTPAID"]', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. CABLE TV PROVIDERS
-- ============================================================
INSERT INTO cable_tv_providers (name, code, is_active) VALUES
  ('DStv', 'DSTV', true),
  ('GOtv', 'GOTV', true),
  ('StarTimes', 'STARTIMES', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. CABLE TV PACKAGES
-- ============================================================
-- DStv packages
INSERT INTO cable_tv_packages (provider_id, name, code, amount, is_active)
SELECT ctp.id, pkg.name, pkg.code, pkg.amount, true
FROM cable_tv_providers ctp
CROSS JOIN (VALUES
  ('DStv Padi', 'padi', 4400),
  ('DStv Yanga', 'yanga', 6200),
  ('DStv Confam', 'confam', 11000),
  ('DStv Compact', 'compact', 12500),
  ('DStv Compact Plus', 'compact_plus', 19000),
  ('DStv Premium', 'premium', 24500)
) AS pkg(name, code, amount)
WHERE ctp.code = 'DSTV'
ON CONFLICT (provider_id, code) DO NOTHING;

-- GOtv packages
INSERT INTO cable_tv_packages (provider_id, name, code, amount, is_active)
SELECT ctp.id, pkg.name, pkg.code, pkg.amount, true
FROM cable_tv_providers ctp
CROSS JOIN (VALUES
  ('GOtv Smallie', 'smallie', 1900),
  ('GOv Jinja', 'jinja', 3900),
  ('GOtv Plus', 'plus', 4900),
  ('GOtv Max', 'max', 7600),
  ('GOtv Supa', 'supa', 9600),
  ('GOtv Supa Plus', 'supa_plus', 16100)
) AS pkg(name, code, amount)
WHERE ctp.code = 'GOTV'
ON CONFLICT (provider_id, code) DO NOTHING;

-- StarTimes packages
INSERT INTO cable_tv_packages (provider_id, name, code, amount, is_active)
SELECT ctp.id, pkg.name, pkg.code, pkg.amount, true
FROM cable_tv_providers ctp
CROSS JOIN (VALUES
  ('StarTimes Nova', 'nova', 1250),
  ('StarTimes Basic', 'basic', 1850),
  ('StarTimes Smart', 'smart', 2600),
  ('StarTimes Classic', 'classic', 3750),
  ('StarTimes Super', 'super', 6250),
  ('StarTimes Prime', 'prime', 8250)
) AS pkg(name, code, amount)
WHERE ctp.code = 'STARTIMES'
ON CONFLICT (provider_id, code) DO NOTHING;

-- ============================================================
-- 4. DATA PLANS (per network)
-- ============================================================
-- MTN
INSERT INTO data_plans (network, name, code, data_volume, validity, amount, is_active) VALUES
  ('MTN', 'MTN 500MB', 'mtn_500mb', '500MB', '30 days', 200, true),
  ('MTN', 'MTN 1GB', 'mtn_1gb', '1GB', '30 days', 350, true),
  ('MTN', 'MTN 2GB', 'mtn_2gb', '2GB', '30 days', 650, true),
  ('MTN', 'MTN 3GB', 'mtn_3gb', '3GB', '30 days', 1100, true),
  ('MTN', 'MTN 5GB', 'mtn_5gb', '5GB', '30 days', 1500, true),
  ('MTN', 'MTN 10GB', 'mtn_10gb', '10GB', '30 days', 3000, true),
  ('MTN', 'MTN 20GB', 'mtn_20gb', '20GB', '30 days', 5500, true),
  ('MTN', 'MTN 50GB', 'mtn_50gb', '50GB', '30 days', 12500, true)
ON CONFLICT (network, code) DO NOTHING;

-- Airtel
INSERT INTO data_plans (network, name, code, data_volume, validity, amount, is_active) VALUES
  ('AIRTEL', 'Airtel 500MB', 'airtel_500mb', '500MB', '30 days', 200, true),
  ('AIRTEL', 'Airtel 1GB', 'airtel_1gb', '1GB', '30 days', 350, true),
  ('AIRTEL', 'Airtel 2GB', 'airtel_2gb', '2GB', '30 days', 650, true),
  ('AIRTEL', 'Airtel 3GB', 'airtel_3gb', '3GB', '30 days', 1100, true),
  ('AIRTEL', 'Airtel 5GB', 'airtel_5gb', '5GB', '30 days', 1500, true),
  ('AIRTEL', 'Airtel 10GB', 'airtel_10gb', '10GB', '30 days', 3000, true),
  ('AIRTEL', 'Airtel 20GB', 'airtel_20gb', '20GB', '30 days', 5500, true),
  ('AIRTEL', 'Airtel 50GB', 'airtel_50gb', '50GB', '30 days', 12500, true)
ON CONFLICT (network, code) DO NOTHING;

-- Glo
INSERT INTO data_plans (network, name, code, data_volume, validity, amount, is_active) VALUES
  ('GLO', 'Glo 500MB', 'glo_500mb', '500MB', '30 days', 200, true),
  ('GLO', 'Glo 1GB', 'glo_1gb', '1GB', '30 days', 300, true),
  ('GLO', 'Glo 2GB', 'glo_2gb', '2GB', '30 days', 550, true),
  ('GLO', 'Glo 3GB', 'glo_3gb', '3GB', '30 days', 1000, true),
  ('GLO', 'Glo 5GB', 'glo_5gb', '5GB', '30 days', 1300, true),
  ('GLO', 'Glo 10GB', 'glo_10gb', '10GB', '30 days', 2500, true),
  ('GLO', 'Glo 20GB', 'glo_20gb', '20GB', '30 days', 5000, true),
  ('GLO', 'Glo 50GB', 'glo_50gb', '50GB', '30 days', 11000, true)
ON CONFLICT (network, code) DO NOTHING;

-- 9Mobile
INSERT INTO data_plans (network, name, code, data_volume, validity, amount, is_active) VALUES
  ('9MOBILE', '9Mobile 500MB', '9mobile_500mb', '500MB', '30 days', 200, true),
  ('9MOBILE', '9Mobile 1GB', '9mobile_1gb', '1GB', '30 days', 350, true),
  ('9MOBILE', '9Mobile 2GB', '9mobile_2gb', '2GB', '30 days', 650, true),
  ('9MOBILE', '9Mobile 3GB', '9mobile_3gb', '3GB', '30 days', 1100, true),
  ('9MOBILE', '9Mobile 5GB', '9mobile_5gb', '5GB', '30 days', 1500, true),
  ('9MOBILE', '9Mobile 10GB', '9mobile_10gb', '10GB', '30 days', 3000, true),
  ('9MOBILE', '9Mobile 20GB', '9mobile_20gb', '20GB', '30 days', 5500, true),
  ('9MOBILE', '9Mobile 50GB', '9mobile_50gb', '50GB', '30 days', 12500, true)
ON CONFLICT (network, code) DO NOTHING;
