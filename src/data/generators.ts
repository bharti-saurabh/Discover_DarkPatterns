import { createPrng, randInt, randPick, randBool, randFloat, randDate, randDatetime, randHash, type Prng } from './prng'
import {
  FIRST_NAMES, LAST_NAMES, CITIES, STREET_TYPES, STREET_NAMES, MCCs,
  MERCHANT_NAMES, PRODUCT_CODES_A, PRODUCT_CODES_B, ACQUIRER_IDS,
  ISSUER_BINS, NAICS_CODES, EMAILS_DOMAINS,
} from './staticData'
import type {
  CapCustomer, CapAccount, CapTransaction, CapDeviceSession, CapDispute, CapCommercial,
  DiscCustomer, DiscAccount, DiscCardholderTxn, DiscMerchant, DiscTerminal,
  DiscNetworkTxn, DiscSettlement, DiscChargeback, DiscBinEntry, DiscFraudPattern,
  AllData,
} from './types'

const START = new Date('2022-01-01')
const END   = new Date('2025-01-01')

function makeAddress(rand: Prng) {
  const num = randInt(rand, 1, 9999)
  const street = randPick(rand, STREET_NAMES)
  const type = randPick(rand, STREET_TYPES)
  return `${num} ${street} ${type}`
}

function makeEmail(rand: Prng, first: string, last: string): string {
  const domain = randPick(rand, EMAILS_DOMAINS)
  const sep = randPick(rand, ['.', '_', ''])
  const n = rand()
  if (n < 0.33) return `${first.toLowerCase()}${sep}${last.toLowerCase()}@${domain}`
  if (n < 0.66) return `${first.toLowerCase()[0]}${last.toLowerCase()}${randInt(rand,1,99)}@${domain}`
  return `${last.toLowerCase()}${sep}${first.toLowerCase()}@${domain}`
}

function makePhone(rand: Prng): string {
  return `${randInt(rand,200,999)}-${randInt(rand,200,999)}-${randInt(rand,1000,9999)}`
}

function makeNameHash(rand: Prng, _first: string, _last: string): string {
  return randHash(rand, 32)
}

// ── Capital One Generators ───────────────────────────────────────────────────

function genCapCustomers(rand: Prng, count: number): CapCustomer[] {
  const channels: CapCustomer['acquisition_channel'][] = ['online','branch','partner','direct_mail','referral']
  const docs: CapCustomer['id_document_type'][] = ['passport','drivers_license','state_id']

  return Array.from({ length: count }, (_, i) => {
    const first = randPick(rand, FIRST_NAMES)
    const last  = randPick(rand, LAST_NAMES)
    const loc   = randPick(rand, CITIES)
    return {
      customer_id:      `CAP-${String(i + 1).padStart(6, '0')}`,
      first_name:       first,
      last_name:        last,
      name_hash:        makeNameHash(rand, first, last),
      ssn_last4:        String(randInt(rand, 1000, 9999)),
      dob:              randDate(rand, new Date('1950-01-01'), new Date('2002-01-01')),
      email:            makeEmail(rand, first, last),
      phone_primary:    makePhone(rand),
      phone_secondary:  randBool(rand, 0.3) ? makePhone(rand) : '',
      address_billing:  makeAddress(rand),
      address_mailing:  randBool(rand, 0.7) ? makeAddress(rand) : makeAddress(rand),
      city:             loc.city,
      state:            loc.state,
      zip:              randPick(rand, loc.zips),
      kyc_status:       randBool(rand, 0.9) ? 'verified' : randPick(rand, ['pending','failed'] as const),
      kyc_tier:         randPick(rand, [1, 2, 3]),
      id_document_type: randPick(rand, docs),
      acquisition_channel: randPick(rand, channels),
      created_date:     randDate(rand, new Date('2015-01-01'), END),
    }
  })
}

function genCapAccounts(rand: Prng, customers: CapCustomer[]): CapAccount[] {
  const grades: CapAccount['risk_grade'][] = ['A','B','C','D','F']
  const delq: CapAccount['delinquency_status'][] = ['current','30_dpd','60_dpd','90_dpd','charge_off']
  const bins = Object.keys(ISSUER_BINS).filter(b => ISSUER_BINS[b].name === 'Capital One')

  const accounts: CapAccount[] = []
  customers.forEach(c => {
    const numAccounts = randBool(rand, 0.3) ? 2 : 1
    for (let a = 0; a < numAccounts; a++) {
      const bin = randPick(rand, bins)
      const cardType = ISSUER_BINS[bin].type
      const limit = cardType === 'commercial'
        ? randInt(rand, 5000, 100000)
        : randInt(rand, 500, 25000)
      const grade = randPick(rand, grades)
      const dpd = grade === 'A' ? 0 : grade === 'B' ? randInt(rand, 0, 20) : randInt(rand, 21, 90)
      accounts.push({
        account_id:          `CAPA-${randHash(rand, 12)}`,
        customer_id:         c.customer_id,
        pan_hash:            randHash(rand, 64),
        bin,
        card_type:           cardType,
        product_code:        randPick(rand, PRODUCT_CODES_A),
        credit_limit:        limit,
        current_balance:     randFloat(rand, 0, limit * 0.8),
        risk_grade:          grade,
        behavior_score:      randInt(rand, 100, 999),
        fico_at_origination: randInt(rand, 580, 850),
        delinquency_status:  grade === 'A' ? 'current' : randPick(rand, delq),
        days_past_due:       dpd,
        opened_date:         randDate(rand, new Date('2015-01-01'), END),
      })
    }
  })
  return accounts
}

function genCapTransactions(rand: Prng, accounts: CapAccount[], merchantIds: string[], count: number): CapTransaction[] {
  const channels: CapTransaction['channel'][] = ['POS','CNP','contactless','ATM']
  const responses: CapTransaction['auth_response_code'][] = ['00','00','00','00','05','51','14']

  return Array.from({ length: count }, () => {
    const acct = randPick(rand, accounts)
    const mcc  = randPick(rand, MCCs)
    const resp = randPick(rand, responses)
    return {
      txn_id:              `CAPT-${randHash(rand, 12)}`,
      account_id:          acct.account_id,
      merchant_name_raw:   randPick(rand, MERCHANT_NAMES),
      merchant_id:         randPick(rand, merchantIds),
      mcc:                 mcc.code,
      amount:              randFloat(rand, 1, 2000),
      currency:            'USD',
      auth_code:           randHash(rand, 6).toUpperCase(),
      auth_response_code:  resp,
      txn_datetime:        randDatetime(rand, START, END),
      channel:             randPick(rand, channels),
      device_fingerprint:  randHash(rand, 32),
      ip_address:          `${randInt(rand,1,254)}.${randInt(rand,0,255)}.${randInt(rand,0,255)}.${randInt(rand,1,254)}`,
      token_id:            randBool(rand, 0.4) ? `TOK-${randHash(rand, 16)}` : '',
      is_3ds_authenticated: randBool(rand, 0.6),
    }
  })
}

function genCapDeviceSessions(rand: Prng, accounts: CapAccount[], count: number): CapDeviceSession[] {
  const devices: CapDeviceSession['device_type'][] = ['mobile','desktop','tablet']
  const oss = ['iOS 17.2','iOS 16.5','Android 14','Android 13','Windows 11','macOS 14','Windows 10']
  const browsers = ['Chrome/121','Safari/17','Firefox/122','Edge/121']

  return Array.from({ length: count }, () => {
    const acct = randPick(rand, accounts)
    const loc  = randPick(rand, CITIES)
    return {
      session_id:          `SES-${randHash(rand, 12)}`,
      account_id:          acct.account_id,
      device_fingerprint:  randHash(rand, 32),
      device_type:         randPick(rand, devices),
      os_version:          randPick(rand, oss),
      ip_address:          `${randInt(rand,1,254)}.${randInt(rand,0,255)}.${randInt(rand,0,255)}.${randInt(rand,1,254)}`,
      ip_geo_city:         loc.city,
      ip_geo_country:      'US',
      browser_fingerprint: randHash(rand, 24),
      user_agent:          `Mozilla/5.0 (${randPick(rand, oss)}) AppleWebKit/537.36 ${randPick(rand, browsers)}`,
      login_datetime:      randDatetime(rand, START, END),
      biometric_score:     randFloat(rand, 0.5, 1.0, 4),
    }
  })
}

function genCapDisputes(rand: Prng, _accounts: CapAccount[], transactions: CapTransaction[], count: number): CapDispute[] {
  const types: CapDispute['dispute_type'][] = ['fraud','unauthorized','quality']
  const reasons = ['4853','4855','4859','4862','4863','UA01','UA02','UA05','UA06','UA38','10.1','10.2','10.4','11.1','11.2']

  return Array.from({ length: count }, () => {
    const txn = randPick(rand, transactions)
    const resolved = randBool(rand, 0.7)
    const filedDate = new Date(txn.txn_datetime)
    filedDate.setDate(filedDate.getDate() + randInt(rand, 1, 60))
    return {
      dispute_id:           `DISP-${randHash(rand, 10)}`,
      account_id:           txn.account_id,
      txn_id:               txn.txn_id,
      dispute_type:         randPick(rand, types),
      reason_code:          randPick(rand, reasons),
      claim_amount:         randFloat(rand, txn.amount * 0.5, txn.amount),
      chargeback_initiated: randBool(rand, 0.5),
      resolution_status:    resolved ? randPick(rand, ['resolved_cardholder','resolved_merchant','withdrawn'] as const) : 'open',
      resolution_date:      resolved ? randDate(rand, filedDate, END) : null,
    }
  })
}

function genCapCommercial(rand: Prng, count: number): CapCommercial[] {
  const ratings: CapCommercial['risk_rating'][] = ['investment_grade','speculative','distressed']
  const covenants: CapCommercial['covenant_status'][] = ['compliant','waiver','breach']

  return Array.from({ length: count }, (_, i) => {
    const first = randPick(rand, LAST_NAMES)
    const second = randPick(rand, ['Industries','Holdings','Group','Partners','Capital','Ventures','Solutions','Services'])
    const state = randPick(rand, CITIES).state
    const numOwners = randInt(rand, 1, 4)
    return {
      counterparty_id:      `COMM-${String(i + 1).padStart(5, '0')}`,
      legal_name:           `${first} ${second} LLC`,
      dba_name:             randBool(rand, 0.4) ? `${randPick(rand, MERCHANT_NAMES)}` : `${first} ${second}`,
      ein_hash:             randHash(rand, 32),
      registration_state:   state,
      naics_code:           randPick(rand, NAICS_CODES),
      credit_facility_id:   `FAC-${randHash(rand, 10)}`,
      exposure_amount:      randFloat(rand, 100000, 50000000),
      risk_rating:          randPick(rand, ratings),
      covenant_status:      randPick(rand, covenants),
      last_review_date:     randDate(rand, new Date('2023-01-01'), END),
      beneficial_owner_ids: Array.from({ length: numOwners }, () => `CAP-${String(randInt(rand, 1, 5000)).padStart(6, '0')}`),
    }
  })
}

// ── Discover Generators ──────────────────────────────────────────────────────

function genDiscCustomers(rand: Prng, count: number, overlapPool: CapCustomer[]): DiscCustomer[] {
  const channels: DiscCustomer['acquisition_channel'][] = ['online','branch','partner','referral']
  const OVERLAP_COUNT = Math.floor(count * 0.4) // 40% overlap with Cap One customers

  return Array.from({ length: count }, (_, i) => {
    const isOverlap = i < OVERLAP_COUNT && i < overlapPool.length
    const src = isOverlap ? overlapPool[i] : null

    const first = src ? src.first_name : randPick(rand, FIRST_NAMES)
    // Fuzzy name: 80% exact, 15% minor variant, 5% significant variant
    let last: string
    if (src) {
      const fuzz = rand()
      if (fuzz < 0.80) last = src.last_name
      else if (fuzz < 0.95) last = src.last_name.slice(0, -1) + randPick(rand, ['e','s','n',''])
      else last = randPick(rand, LAST_NAMES)
    } else {
      last = randPick(rand, LAST_NAMES)
    }

    const loc = src ? { city: src.city, state: src.state, zip: randPick(rand, CITIES).zips[0] } : randPick(rand, CITIES)
    const email = src && randBool(rand, 0.7) ? src.email : makeEmail(rand, first, last)

    return {
      customer_id:     `DIS-${String(i + 1).padStart(6, '0')}`,
      first_name:      first,
      last_name:       last,
      name_hash:       makeNameHash(rand, first, last),
      ssn_last4:       src ? src.ssn_last4 : String(randInt(rand, 1000, 9999)),
      dob:             src ? src.dob : randDate(rand, new Date('1950-01-01'), new Date('2002-01-01')),
      email,
      phone_primary:   src && randBool(rand, 0.6) ? src.phone_primary : makePhone(rand),
      address_billing: src && randBool(rand, 0.55) ? src.address_billing : makeAddress(rand),
      city:            'city' in loc ? loc.city : (loc as typeof CITIES[0]).city,
      state:           'state' in loc ? loc.state : (loc as typeof CITIES[0]).state,
      zip:             'zip' in loc ? loc.zip : randPick(rand, (loc as typeof CITIES[0]).zips),
      kyc_status:      randBool(rand, 0.88) ? 'verified' : randPick(rand, ['pending','failed'] as const),
      acquisition_channel: randPick(rand, channels),
      created_date:    randDate(rand, new Date('2015-01-01'), END),
      cashback_enrolled: randBool(rand, 0.75),
    }
  })
}

function genDiscAccounts(rand: Prng, customers: DiscCustomer[]): DiscAccount[] {
  const types: DiscAccount['product_type'][] = ['credit_card','student_loan','personal_loan','savings','checking']
  const bins = Object.keys(ISSUER_BINS).filter(b => ISSUER_BINS[b].name === 'Discover')
  const accounts: DiscAccount[] = []

  customers.forEach(c => {
    const numAccounts = randBool(rand, 0.25) ? 2 : 1
    for (let a = 0; a < numAccounts; a++) {
      const ptype = randPick(rand, types)
      const bin = randPick(rand, bins)
      const isCard = ptype === 'credit_card'
      const limit = isCard ? randInt(rand, 500, 20000) : null
      accounts.push({
        account_id:      `DISA-${randHash(rand, 12)}`,
        customer_id:     c.customer_id,
        pan_hash:        randHash(rand, 64),
        bin,
        product_type:    ptype,
        product_code:    randPick(rand, PRODUCT_CODES_B),
        credit_limit:    limit,
        current_balance: randFloat(rand, 0, isCard ? (limit ?? 5000) * 0.7 : 50000),
        apr:             randFloat(rand, 9.99, 29.99),
        cashback_rate:   isCard ? randFloat(rand, 0.01, 0.05, 3) : 0,
        rewards_balance: isCard ? randFloat(rand, 0, 500) : 0,
        status:          randBool(rand, 0.88) ? 'active' : randPick(rand, ['delinquent','closed'] as const),
        opened_date:     randDate(rand, new Date('2015-01-01'), END),
      })
    }
  })
  return accounts
}

function genDiscCardholderTxns(rand: Prng, accounts: DiscAccount[], merchantIds: string[], count: number): DiscCardholderTxn[] {
  const channels: DiscCardholderTxn['channel'][] = ['POS','CNP','contactless','ATM']
  const cardAccts = accounts.filter(a => a.product_type === 'credit_card')

  return Array.from({ length: count }, () => {
    const acct = randPick(rand, cardAccts.length ? cardAccts : accounts)
    const mcc  = randPick(rand, MCCs)
    const amount = randFloat(rand, 1, 1500)
    const cashbackRate = (acct.cashback_rate ?? 0.01)
    return {
      txn_id:          `DIST-${randHash(rand, 12)}`,
      account_id:      acct.account_id,
      network_txn_id:  `NTX-${randHash(rand, 14)}`,
      merchant_id:     randPick(rand, merchantIds),
      amount,
      cashback_earned: parseFloat((amount * cashbackRate).toFixed(2)),
      txn_datetime:    randDatetime(rand, START, END),
      mcc:             mcc.code,
      channel:         randPick(rand, channels),
      status:          randBool(rand, 0.93) ? 'approved' : randPick(rand, ['declined','pending'] as const),
    }
  })
}

function genDiscMerchants(rand: Prng, count: number): DiscMerchant[] {
  return Array.from({ length: count }, (_, i) => {
    const loc  = randPick(rand, CITIES)
    const mcc  = randPick(rand, MCCs)
    const name = MERCHANT_NAMES[i % MERCHANT_NAMES.length] + (i >= MERCHANT_NAMES.length ? ` #${Math.floor(i / MERCHANT_NAMES.length) + 1}` : '')
    return {
      merchant_id:        `MID-${String(i + 1).padStart(7, '0')}`,
      merchant_name:      name,
      dba_name:           randBool(rand, 0.3) ? name + ' LLC' : name,
      legal_entity_name:  name + ' Inc',
      ein_hash:           randHash(rand, 32),
      mcc:                mcc.code,
      address_street:     makeAddress(rand),
      address_city:       loc.city,
      address_state:      loc.state,
      address_zip:        randPick(rand, loc.zips),
      phone:              makePhone(rand),
      email:              `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      website:            `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      merchant_type:      randPick(rand, ['POS','CNP','mPOS'] as const),
      registration_date:  randDate(rand, new Date('2010-01-01'), new Date('2023-01-01')),
      acquirer_id:        randPick(rand, ACQUIRER_IDS),
    }
  })
}

function genDiscTerminals(rand: Prng, merchants: DiscMerchant[], count: number): DiscTerminal[] {
  return Array.from({ length: count }, (_, i) => {
    const m = randPick(rand, merchants)
    return {
      terminal_id:       `TID-${String(i + 1).padStart(7, '0')}`,
      merchant_id:       m.merchant_id,
      terminal_type:     randPick(rand, ['POS','ATM','mPOS'] as const),
      device_serial:     randHash(rand, 16).toUpperCase(),
      software_version:  `v${randInt(rand, 2, 5)}.${randInt(rand, 0, 9)}.${randInt(rand, 0, 9)}`,
      ip_address:        `${randInt(rand,10,254)}.${randInt(rand,0,255)}.${randInt(rand,0,255)}.${randInt(rand,1,254)}`,
      location_lat:      randFloat(rand, 25.0, 48.0, 6),
      location_lon:      randFloat(rand, -124.0, -66.0, 6),
      installation_date: randDate(rand, new Date('2018-01-01'), new Date('2024-01-01')),
    }
  })
}

function genDiscNetworkTxns(rand: Prng, merchants: DiscMerchant[], terminals: DiscTerminal[], count: number): DiscNetworkTxn[] {
  const issuers = Object.keys(ISSUER_BINS)
  const entryModes: DiscNetworkTxn['entry_mode'][] = ['swipe','chip','tap','CNP']

  return Array.from({ length: count }, () => {
    const merchant  = randPick(rand, merchants)
    const terminal  = terminals.find(t => t.merchant_id === merchant.merchant_id) ?? randPick(rand, terminals)
    const issuerBin = randPick(rand, issuers)
    const issuerInfo = ISSUER_BINS[issuerBin]
    const amount = randFloat(rand, 1, 3000)
    const rate = randFloat(rand, 0.015, 0.025, 4)

    // Plant card_type misclassification: ~8% of commercial cards labeled consumer
    const trueType = issuerInfo.type
    const classifiedType: 'consumer' | 'commercial' =
      trueType === 'commercial' && rand() < 0.08 ? 'consumer' : trueType

    return {
      network_txn_id:        `NTX-${randHash(rand, 14)}`,
      issuer_bin:            issuerBin,
      issuer_id:             `ISS-${issuerBin}`,
      merchant_id:           merchant.merchant_id,
      terminal_id:           terminal.terminal_id,
      acquirer_id:           merchant.acquirer_id,
      pan_hash:              randHash(rand, 64),
      card_type:             classifiedType,
      amount,
      currency:              'USD',
      interchange_rate_applied: rate,
      interchange_fee_charged: parseFloat((amount * rate).toFixed(2)),
      auth_datetime:         randDatetime(rand, START, END),
      clearing_datetime:     randDatetime(rand, START, END),
      settlement_datetime:   randDatetime(rand, START, END),
      auth_code:             randHash(rand, 6).toUpperCase(),
      entry_mode:            randPick(rand, entryModes),
      network_fraud_score:   randFloat(rand, 0, 1, 4),
    }
  })
}

function genDiscSettlements(rand: Prng, merchants: DiscMerchant[], count: number): DiscSettlement[] {
  return Array.from({ length: count }, () => {
    const m = randPick(rand, merchants)
    const gross = randFloat(rand, 5000, 500000)
    const interchange = parseFloat((gross * 0.02).toFixed(2))
    const chargebacks = randInt(rand, 0, 10)
    const disputed = randFloat(rand, 0, chargebacks * 200)
    return {
      settlement_id:        `SET-${randHash(rand, 10)}`,
      merchant_id:          m.merchant_id,
      acquirer_id:          m.acquirer_id,
      settlement_date:      randDate(rand, START, END),
      gross_amount:         gross,
      total_interchange:    interchange,
      chargeback_count:     chargebacks,
      disputed_amount:      disputed,
      net_settlement_amount: parseFloat((gross - interchange - disputed).toFixed(2)),
    }
  })
}

function genDiscChargebacks(rand: Prng, networkTxns: DiscNetworkTxn[], count: number): DiscChargeback[] {
  const reasons = ['4853','4855','4859','4862','10.1','10.2','10.4','11.1','11.3','13.1','13.2']
  const statuses: DiscChargeback['resolution_status'][] = ['open','won_issuer','won_merchant','arbitration']
  const highFraudTxns = networkTxns.filter(t => t.network_fraud_score > 0.7)
  const pool = highFraudTxns.length > count ? highFraudTxns : networkTxns

  return Array.from({ length: count }, () => {
    const txn = randPick(rand, pool)
    const filedDate = new Date(txn.auth_datetime)
    filedDate.setDate(filedDate.getDate() + randInt(rand, 1, 45))
    const deadlineDate = new Date(filedDate)
    deadlineDate.setDate(deadlineDate.getDate() + 45)
    return {
      chargeback_id:     `CB-${randHash(rand, 10)}`,
      network_txn_id:    txn.network_txn_id,
      merchant_id:       txn.merchant_id,
      issuer_bin:        txn.issuer_bin,
      reason_code:       randPick(rand, reasons),
      dispute_amount:    randFloat(rand, txn.amount * 0.5, txn.amount),
      filing_date:       filedDate.toISOString().split('T')[0],
      response_deadline: deadlineDate.toISOString().split('T')[0],
      resolution_status: randPick(rand, statuses),
    }
  })
}

function genDiscBinTable(): DiscBinEntry[] {
  return Object.entries(ISSUER_BINS).map(([bin, info]) => ({
    bin,
    issuer_id:          `ISS-${bin}`,
    issuer_name:        info.name,
    issuer_country:     'US',
    card_type:          info.type,
    card_brand:         info.name === 'Discover' ? 'Discover' : 'Visa/MC',
    card_product_tier:  info.tier as DiscBinEntry['card_product_tier'],
  }))
}

function genDiscFraudPatterns(rand: Prng, merchants: DiscMerchant[], count: number): DiscFraudPattern[] {
  const types: DiscFraudPattern['pattern_type'][] = ['ring','mule','synthetic','bust_out','laundering']
  const geoSpreads = ['Northeast US','West Coast','Southeast','Midwest','National','Multi-state']
  const velocities = [
    'High authorization frequency within 2hr window',
    'Multiple small-amount transactions below $25 threshold',
    'Repeated declines followed by approvals across terminals',
    'Cross-merchant split transactions',
    'Velocity spike at merchant registration',
  ]
  const bins = Object.keys(ISSUER_BINS)

  return Array.from({ length: count }, (_, i) => {
    const numMerchants = randInt(rand, 2, 8)
    const numBins = randInt(rand, 1, 4)
    const firstObs = new Date(randDate(rand, new Date('2023-01-01'), new Date('2024-06-01')))
    const lastObs  = new Date(firstObs)
    lastObs.setDate(lastObs.getDate() + randInt(rand, 7, 180))
    return {
      pattern_id:          `FP-${String(i + 1).padStart(4, '0')}`,
      pattern_type:        randPick(rand, types),
      merchant_ids:        Array.from({ length: numMerchants }, () => randPick(rand, merchants).merchant_id),
      bin_ranges:          Array.from({ length: numBins }, () => randPick(rand, bins)),
      velocity_indicators: randPick(rand, velocities),
      geographic_spread:   randPick(rand, geoSpreads),
      cross_issuer:        randBool(rand, 0.7),
      first_observed:      firstObs.toISOString().split('T')[0],
      last_observed:       lastObs.toISOString().split('T')[0],
      active:              randBool(rand, 0.6),
    }
  })
}

// ── Main entry point ─────────────────────────────────────────────────────────

let _cachedData: AllData | null = null

export function generateAllData(): AllData {
  if (_cachedData) return _cachedData

  const rand = createPrng(42) // fixed seed — same data every run

  // Cap One
  const capCustomers    = genCapCustomers(rand, 5000)
  const capAccounts     = genCapAccounts(rand, capCustomers)
  const discMerchants   = genDiscMerchants(rand, 2000)
  const capTransactions = genCapTransactions(rand, capAccounts, discMerchants.map(m => m.merchant_id), 50000)
  const capSessions     = genCapDeviceSessions(rand, capAccounts, 15000)
  const capDisputes     = genCapDisputes(rand, capAccounts, capTransactions, 1500)
  const capCommercial   = genCapCommercial(rand, 400)

  // Discover — customers with overlap planted against first 2000 Cap One customers
  const discCustomers   = genDiscCustomers(rand, 4000, capCustomers.slice(0, 2000))
  const discAccounts    = genDiscAccounts(rand, discCustomers)
  const discTerminals   = genDiscTerminals(rand, discMerchants, 5000)
  const discNetworkTxns = genDiscNetworkTxns(rand, discMerchants, discTerminals, 100000)
  const discCardTxns    = genDiscCardholderTxns(rand, discAccounts, discMerchants.map(m => m.merchant_id), 35000)
  const discSettlements = genDiscSettlements(rand, discMerchants, 2000)
  const discChargebacks = genDiscChargebacks(rand, discNetworkTxns, 1200)
  const discBinTable    = genDiscBinTable()
  const discFraudPat    = genDiscFraudPatterns(rand, discMerchants, 80)

  _cachedData = {
    capone: {
      customers: capCustomers,
      accounts: capAccounts,
      transactions: capTransactions,
      deviceSessions: capSessions,
      disputes: capDisputes,
      commercial: capCommercial,
    },
    discover: {
      customers: discCustomers,
      accounts: discAccounts,
      cardholderTxns: discCardTxns,
      merchants: discMerchants,
      terminals: discTerminals,
      networkTxns: discNetworkTxns,
      settlements: discSettlements,
      chargebacks: discChargebacks,
      binTable: discBinTable,
      fraudPatterns: discFraudPat,
    },
  }

  return _cachedData
}
