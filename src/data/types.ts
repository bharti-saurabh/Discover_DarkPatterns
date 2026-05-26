// ── Institution A (Capital One) ─────────────────────────────────────────────

export interface CapCustomer {
  customer_id: string
  first_name: string
  last_name: string
  name_hash: string
  ssn_last4: string
  dob: string
  email: string
  phone_primary: string
  phone_secondary: string
  address_billing: string
  address_mailing: string
  city: string
  state: string
  zip: string
  kyc_status: 'verified' | 'pending' | 'failed'
  kyc_tier: 1 | 2 | 3
  id_document_type: 'passport' | 'drivers_license' | 'state_id'
  acquisition_channel: 'online' | 'branch' | 'partner' | 'direct_mail' | 'referral'
  created_date: string
}

export interface CapAccount {
  account_id: string
  customer_id: string
  pan_hash: string
  bin: string
  card_type: 'consumer' | 'commercial' | 'secured'
  product_code: string
  credit_limit: number
  current_balance: number
  risk_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  behavior_score: number
  fico_at_origination: number
  delinquency_status: 'current' | '30_dpd' | '60_dpd' | '90_dpd' | 'charge_off'
  days_past_due: number
  opened_date: string
}

export interface CapTransaction {
  txn_id: string
  account_id: string
  merchant_name_raw: string
  merchant_id: string
  mcc: string
  amount: number
  currency: string
  auth_code: string
  auth_response_code: '00' | '05' | '51' | '14'
  txn_datetime: string
  channel: 'POS' | 'CNP' | 'contactless' | 'ATM'
  device_fingerprint: string
  ip_address: string
  token_id: string
  is_3ds_authenticated: boolean
}

export interface CapDeviceSession {
  session_id: string
  account_id: string
  device_fingerprint: string
  device_type: 'mobile' | 'desktop' | 'tablet'
  os_version: string
  ip_address: string
  ip_geo_city: string
  ip_geo_country: string
  browser_fingerprint: string
  user_agent: string
  login_datetime: string
  biometric_score: number
}

export interface CapDispute {
  dispute_id: string
  account_id: string
  txn_id: string
  dispute_type: 'fraud' | 'unauthorized' | 'quality'
  reason_code: string
  claim_amount: number
  chargeback_initiated: boolean
  resolution_status: 'open' | 'resolved_cardholder' | 'resolved_merchant' | 'withdrawn'
  resolution_date: string | null
}

export interface CapCommercial {
  counterparty_id: string
  legal_name: string
  dba_name: string
  ein_hash: string
  registration_state: string
  naics_code: string
  credit_facility_id: string
  exposure_amount: number
  risk_rating: 'investment_grade' | 'speculative' | 'distressed'
  covenant_status: 'compliant' | 'waiver' | 'breach'
  last_review_date: string
  beneficial_owner_ids: string[]
}

// ── Institution B (Discover) — Issuer Side ──────────────────────────────────

export interface DiscCustomer {
  customer_id: string
  first_name: string
  last_name: string
  name_hash: string
  ssn_last4: string
  dob: string
  email: string
  phone_primary: string
  address_billing: string
  city: string
  state: string
  zip: string
  kyc_status: 'verified' | 'pending' | 'failed'
  acquisition_channel: 'online' | 'branch' | 'partner' | 'referral'
  created_date: string
  cashback_enrolled: boolean
}

export interface DiscAccount {
  account_id: string
  customer_id: string
  pan_hash: string
  bin: string
  product_type: 'credit_card' | 'student_loan' | 'personal_loan' | 'savings' | 'checking'
  product_code: string
  credit_limit: number | null
  current_balance: number
  apr: number
  cashback_rate: number
  rewards_balance: number
  status: 'active' | 'delinquent' | 'closed'
  opened_date: string
}

export interface DiscCardholderTxn {
  txn_id: string
  account_id: string
  network_txn_id: string
  merchant_id: string
  amount: number
  cashback_earned: number
  txn_datetime: string
  mcc: string
  channel: 'POS' | 'CNP' | 'contactless' | 'ATM'
  status: 'approved' | 'declined' | 'pending'
}

// ── Institution B (Discover) — Network Side ──────────────────────────────────

export interface DiscMerchant {
  merchant_id: string
  merchant_name: string
  dba_name: string
  legal_entity_name: string
  ein_hash: string
  mcc: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  phone: string
  email: string
  website: string
  merchant_type: 'POS' | 'CNP' | 'mPOS'
  registration_date: string
  acquirer_id: string
}

export interface DiscTerminal {
  terminal_id: string
  merchant_id: string
  terminal_type: 'POS' | 'ATM' | 'mPOS'
  device_serial: string
  software_version: string
  ip_address: string
  location_lat: number
  location_lon: number
  installation_date: string
}

export interface DiscNetworkTxn {
  network_txn_id: string
  issuer_bin: string
  issuer_id: string
  merchant_id: string
  terminal_id: string
  acquirer_id: string
  pan_hash: string
  card_type: 'consumer' | 'commercial'
  amount: number
  currency: string
  interchange_rate_applied: number
  interchange_fee_charged: number
  auth_datetime: string
  clearing_datetime: string
  settlement_datetime: string
  auth_code: string
  entry_mode: 'swipe' | 'chip' | 'tap' | 'CNP'
  network_fraud_score: number
}

export interface DiscSettlement {
  settlement_id: string
  merchant_id: string
  acquirer_id: string
  settlement_date: string
  gross_amount: number
  total_interchange: number
  chargeback_count: number
  disputed_amount: number
  net_settlement_amount: number
}

export interface DiscChargeback {
  chargeback_id: string
  network_txn_id: string
  merchant_id: string
  issuer_bin: string
  reason_code: string
  dispute_amount: number
  filing_date: string
  response_deadline: string
  resolution_status: 'open' | 'won_issuer' | 'won_merchant' | 'arbitration'
}

export interface DiscBinEntry {
  bin: string
  issuer_id: string
  issuer_name: string
  issuer_country: string
  card_type: 'consumer' | 'commercial'
  card_brand: string
  card_product_tier: 'standard' | 'gold' | 'platinum' | 'signature' | 'infinite'
}

export interface DiscFraudPattern {
  pattern_id: string
  pattern_type: 'ring' | 'mule' | 'synthetic' | 'bust_out' | 'laundering'
  merchant_ids: string[]
  bin_ranges: string[]
  velocity_indicators: string
  geographic_spread: string
  cross_issuer: boolean
  first_observed: string
  last_observed: string
  active: boolean
}

// ── Aggregate types for the app ───────────────────────────────────────────────

export interface CapOneDataset {
  customers: CapCustomer[]
  accounts: CapAccount[]
  transactions: CapTransaction[]
  deviceSessions: CapDeviceSession[]
  disputes: CapDispute[]
  commercial: CapCommercial[]
}

export interface DiscoverDataset {
  customers: DiscCustomer[]
  accounts: DiscAccount[]
  cardholderTxns: DiscCardholderTxn[]
  merchants: DiscMerchant[]
  terminals: DiscTerminal[]
  networkTxns: DiscNetworkTxn[]
  settlements: DiscSettlement[]
  chargebacks: DiscChargeback[]
  binTable: DiscBinEntry[]
  fraudPatterns: DiscFraudPattern[]
}

export interface AllData {
  capone: CapOneDataset
  discover: DiscoverDataset
}
