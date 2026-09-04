// Types matching the Django backend (github.com/Shakoury/vtu_backend)

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: number | null;
  role_name: string;
  balance: number;
  locked_balance: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  has_pin: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  identifier: string;
  email?: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export type TransactionType = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'CABLE_TV';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type NetworkType = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE';

export interface Transaction {
  id: string;
  user: string;
  type: TransactionType;
  network: NetworkType | null;
  amount: number;
  phone_number: string;
  status: TransactionStatus;
  reference: string;
  provider_reference: string | null;
  idempotency_key: string | null;
  provider: number | null;
  metadata: Record<string, unknown>;
  response_message: string;
  retries: number;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  network?: NetworkType;
  amount: number;
  phone_number: string;
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WalletFunding {
  id: number;
  user: string;
  amount: number;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface Wallet {
  id: number;
  user: string;
  user_email: string;
  balance: number;
  locked_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference: string | null;
  created_at: string;
}

export interface ElectricityProvider {
  id: number;
  name: string;
  code: string;
  meter_types: string[];
  is_active: boolean;
}

export interface CableTVProvider {
  id: number;
  name: string;
  code: string;
  packages: CableTVPackage[];
}

export interface CableTVPackage {
  id: number;
  name: string;
  code: string;
  amount: number;
}

export interface DataPlan {
  id: number;
  network: NetworkType;
  name: string;
  code: string;
  data_volume: string;
  validity: string;
  amount: number;
}

export interface ProviderStatus {
  name: string;
  is_healthy: boolean;
  avg_response_time: number;
}

export interface UserStats {
  wallet_balance: number;
  total_spent: number;
  transaction_count: number;
  successful_transactions: number;
  failed_transactions: number;
  is_verified: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: number | null;
  role_name: string;
  balance: number;
  locked_balance: number;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_transactions: number;
  total_revenue: number;
  active_users: number;
  pending_fund_requests: number;
}

export interface DailyVolume {
  date: string;
  volume: number;
  count: number;
}

export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}
