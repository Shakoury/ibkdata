/*
# ABKDATA Schema — Transactions and Status History

## Overview
Creates the transactions and transaction_status_history tables, matching the
Django backend's transactions/models.py. The Django backend uses a state
machine for transaction status (PENDING -> PROCESSING -> SUCCESS/FAILED ->
REFUNDED) and logs every status transition.

## New Tables

1. **transactions** — Main transaction record for airtime, data, electricity,
   and cable TV purchases. Has a state machine for status, idempotency key,
   provider reference, and metadata JSONB.
   - `id` uuid PK
   - `user_id` uuid FK to auth.users, DEFAULT auth.uid()
   - `type` varchar(20) ('AIRTIME' | 'DATA' | 'ELECTRICITY' | 'CABLE_TV')
   - `network` varchar(20) nullable ('MTN' | 'GLO' | 'AIRTEL' | '9MOBILE')
   - `amount` numeric(12,2)
   - `phone_number` varchar(20)
   - `status` varchar(20) default 'PENDING'
     ('PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED')
   - `reference` varchar(100) unique (auto-generated TXN-XXXXXXXXXXXX)
   - `provider_reference` varchar(100) nullable unique
   - `idempotency_key` varchar(100) nullable unique
   - `provider_id` bigint nullable FK to providers
   - `metadata` jsonb default '{}'
   - `response_message` text default ''
   - `retries` integer default 0
   - `created_at`, `updated_at` timestamptz
   - `processing_started_at` timestamptz nullable
   - `completed_at` timestamptz nullable

2. **transaction_status_history** — Logs every status transition with
   from_status, to_status, reason, and who changed it.
   - `id` bigint PK
   - `transaction_id` uuid FK to transactions
   - `from_status` varchar(20)
   - `to_status` varchar(20)
   - `reason` text
   - `changed_by_id` uuid nullable FK to auth.users
   - `created_at` timestamptz

## Security
- RLS enabled on both tables.
- transactions: users CRUD own; staff read all + update all.
- transaction_status_history: users read own; staff read all.
  No client INSERT/UPDATE/DELETE — entries created server-side only.

## Reference Auto-Generation
- A DEFAULT on the `reference` column auto-generates TXN-XXXXXXXXXXXX on insert.
*/

-- ============================================================
-- 1. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(20) NOT NULL CHECK (type IN ('AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE_TV')),
  network varchar(20) CHECK (network IS NULL OR network IN ('MTN', 'GLO', 'AIRTEL', '9MOBILE')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0.01),
  phone_number varchar(20) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  reference varchar(100) UNIQUE NOT NULL DEFAULT ('TXN-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12))),
  provider_reference varchar(100) UNIQUE,
  idempotency_key varchar(100) UNIQUE,
  provider_id bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_message text NOT NULL DEFAULT '',
  retries integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tx_user_status_created ON transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_status_created ON transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_tx_provider_ref ON transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);

-- Users can CRUD their own transactions
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Staff can read all transactions
DROP POLICY IF EXISTS "staff_read_all_transactions" ON transactions;
CREATE POLICY "staff_read_all_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- Staff can update all transactions (status changes, retries)
DROP POLICY IF EXISTS "staff_update_all_transactions" ON transactions;
CREATE POLICY "staff_update_all_transactions" ON transactions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- ============================================================
-- 2. TRANSACTION_STATUS_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_status_history (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  from_status varchar(20) NOT NULL,
  to_status varchar(20) NOT NULL,
  reason text NOT NULL DEFAULT '',
  changed_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transaction_status_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tx_history_tx_created ON transaction_status_history(transaction_id, created_at DESC);

-- Users can read their own transaction history (via transaction ownership)
DROP POLICY IF EXISTS "select_own_tx_history" ON transaction_status_history;
CREATE POLICY "select_own_tx_history" ON transaction_status_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid())
  );

-- Staff can read all transaction history
DROP POLICY IF EXISTS "staff_read_all_tx_history" ON transaction_status_history;
CREATE POLICY "staff_read_all_tx_history" ON transaction_status_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- No client INSERT/UPDATE/DELETE — status history is created server-side
-- only (edge functions / RPC) to maintain audit integrity.
