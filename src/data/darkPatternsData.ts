// ── FinCEN Reference Categories ───────────────────────────────────────────────
// Sources: FIN-2014-A008, FIN-2020-A008

export interface FinCENCategory {
  id: string
  label: string
  description: string
  source: string
  sourceUrl: string
}

export const FINCEN_CATEGORIES: Record<string, FinCENCategory> = {
  '14-MCC': {
    id: '14-MCC',
    label: 'Industry / MCC Red Flags',
    description: 'Transactions at hotels, motels, massage parlors, escort services, rideshare, or adult entertainment venues — especially in known high-trafficking corridors.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '14-Cash': {
    id: '14-Cash',
    label: 'Cash & Prepaid Card Activity',
    description: 'Frequent purchase or reload of prepaid cards, money orders, or large ATM cash advances — particularly when structuring keeps amounts below $10,000.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '14-Geo': {
    id: '14-Geo',
    label: 'Geographic Corridor Movement',
    description: 'Transactions in multiple cities or states within short timeframes, particularly along known trafficking corridors (I-95 NE, I-10 South, I-75 Midwest). Impossible-travel patterns across merchant acceptance points.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '14-Time': {
    id: '14-Time',
    label: 'After-Hours Concentration',
    description: 'Merchant or cardholder transactions concentrated between 10 PM and 4 AM, inconsistent with declared business type or normal consumer behavior for that MCC.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '20-T2': {
    id: '20-T2',
    label: 'Front Company Proceeds — Typology 2',
    description: 'Trafficking proceeds laundered through seemingly legitimate businesses. Volume, ticket size, or chargeback profile inconsistent with declared business type — a front operation obscuring the true source of funds.',
    source: 'FIN-2020-A008, Typology 2',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
  },
  '20-T3': {
    id: '20-T3',
    label: 'Money Mule / Multi-Account Control — Typology 3',
    description: 'Multiple accounts controlled by a single individual or device, or funds rapidly transferred to a third party with no apparent relationship — mule account behavior used to layer trafficking proceeds.',
    source: 'FIN-2020-A008, Typology 3',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
  },
}

// ── MCC Reference ─────────────────────────────────────────────────────────────

export const TRAFFICKING_MCCS: Record<string, { label: string; riskLevel: 'high' | 'medium' | 'indicator' }> = {
  '7011': { label: 'Hotels & Motels',         riskLevel: 'high' },
  '4121': { label: 'Taxicabs & Rideshare',    riskLevel: 'high' },
  '6540': { label: 'Prepaid Card Reload',     riskLevel: 'high' },
  '6010': { label: 'ATM Cash Advance',        riskLevel: 'high' },
  '7297': { label: 'Massage Parlors',         riskLevel: 'high' },
  '7299': { label: 'Personal Services NEC',   riskLevel: 'high' },
  '5912': { label: 'Drug Stores/Pharmacies',  riskLevel: 'medium' },
  '5411': { label: 'Grocery Stores',          riskLevel: 'indicator' },
  '5661': { label: 'Shoe Stores',             riskLevel: 'indicator' },
  '4111': { label: 'Transit/Ground Transport',riskLevel: 'medium' },
  '5999': { label: 'Miscellaneous Retail',    riskLevel: 'indicator' },
  '7512': { label: 'Car Rental',              riskLevel: 'medium' },
}

// ── Pattern 1: Geographic Corridor Cases ─────────────────────────────────────

export interface CorridorStop {
  day: number
  city: string
  state: string
  transactions: {
    mcc: string
    mccLabel: string
    amount: number
    time: string
    source: 'capone' | 'discover'
    merchantId?: string
  }[]
}

export interface CorridorCase {
  id: string
  cardholderIdA: string    // Cap One
  cardholderIdB?: string   // Discover (same person)
  corridor: string
  corridorLabel: string
  riskScore: number
  flaggedCategories: string[]
  homeCityState: string
  stops: CorridorStop[]
  capOneSignal: string
  discoverSignal: string
  combinedInsight: string
}

export const CORRIDOR_CASES: CorridorCase[] = [
  {
    id: 'CORR-001',
    cardholderIdA: 'CAP-004821',
    cardholderIdB: 'DIS-002193',
    corridor: 'I95-NE',
    corridorLabel: 'I-95 Northeast',
    riskScore: 94,
    flaggedCategories: ['14-MCC', '14-Cash', '14-Geo'],
    homeCityState: 'Boston, MA',
    capOneSignal: 'Account shows 14 hotel charges across 6 cities in 18 days. ATM withdrawals totaling $3,200 — all in cash. Prepaid card reloads at each stop. No dining, grocery, or retail spend. Behavior score dropped 180 points in 30 days.',
    discoverSignal: 'Three Discover-network hotels on the I-95 corridor each show a spike in cross-issuer card volume on the same nights this cardholder checked in — 8 to 14 other cards from different issuer BINs transacting at the same property within the same 4-hour window.',
    combinedInsight: 'The Cap One cardholder is not alone. Discover\'s network view shows coordinated multi-card activity at each hotel stop — different issuer BINs, same merchants, same time windows. This is not a business traveler. This is a coordinated pattern across at least 9 cards at the same 5 properties.',
    stops: [
      { day: 1,  city: 'Boston',       state: 'MA', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 89,  time: '11:42 PM', source: 'capone', merchantId: 'MID-0000041' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 300, time: '11:58 PM', source: 'capone' }] },
      { day: 2,  city: 'Boston',       state: 'MA', transactions: [{ mcc: '4121', mccLabel: 'Rideshare',       amount: 34,  time: '09:15 PM', source: 'capone' }] },
      { day: 3,  city: 'Providence',   state: 'RI', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 79,  time: '10:33 PM', source: 'discover', merchantId: 'MID-0000187' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 400, time: '10:51 PM', source: 'capone' }] },
      { day: 5,  city: 'New York',     state: 'NY', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 129, time: '11:07 PM', source: 'discover', merchantId: 'MID-0000312' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:23 PM', source: 'capone' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 500, time: '11:44 PM', source: 'capone' }] },
      { day: 7,  city: 'New York',     state: 'NY', transactions: [{ mcc: '4121', mccLabel: 'Rideshare',       amount: 28,  time: '08:45 PM', source: 'capone' }] },
      { day: 8,  city: 'Philadelphia', state: 'PA', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 89,  time: '10:52 PM', source: 'discover', merchantId: 'MID-0000491' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 300, time: '11:09 PM', source: 'capone' }] },
      { day: 10, city: 'Baltimore',    state: 'MD', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 79,  time: '11:31 PM', source: 'discover', merchantId: 'MID-0000623' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:47 PM', source: 'capone' }] },
      { day: 12, city: 'Washington',   state: 'DC', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 99,  time: '10:18 PM', source: 'discover', merchantId: 'MID-0000744' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 400, time: '10:29 PM', source: 'capone' }, { mcc: '4121', mccLabel: 'Rideshare',       amount: 19,  time: '03:41 AM', source: 'capone' }] },
      { day: 14, city: 'Baltimore',    state: 'MD', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 79,  time: '11:02 PM', source: 'discover', merchantId: 'MID-0000623' }] },
      { day: 16, city: 'Philadelphia', state: 'PA', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 89,  time: '10:44 PM', source: 'discover', merchantId: 'MID-0000491' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 300, time: '11:01 PM', source: 'capone' }] },
      { day: 18, city: 'Boston',       state: 'MA', transactions: [{ mcc: '4121', mccLabel: 'Rideshare',       amount: 41,  time: '06:23 AM', source: 'capone' }] },
    ],
  },
  {
    id: 'CORR-002',
    cardholderIdA: 'CAP-007342',
    corridor: 'I10-S',
    corridorLabel: 'I-10 Southern',
    riskScore: 87,
    flaggedCategories: ['14-MCC', '14-Cash', '14-Geo'],
    homeCityState: 'Houston, TX',
    capOneSignal: 'Rapid city movement across 5 Texas/Louisiana cities in 10 days. $2,800 in ATM withdrawals. No recurring merchant relationships — each hotel is new. Account opened 34 days ago.',
    discoverSignal: 'Two truck-stop-adjacent hotels on I-10 show the same cardholder co-occurring with 6–11 other multi-issuer cards. One Beaumont, TX property has appeared in 3 separate multi-card events in 45 days.',
    combinedInsight: 'New account (34 days old) immediately enters a high-frequency corridor pattern. Discover\'s network identifies the Beaumont property as a repeat venue — third coordinated event at the same merchant in 45 days, each time with a different set of cards from different issuers. The property is a nexus, not a coincidence.',
    stops: [
      { day: 1,  city: 'Houston',      state: 'TX', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 69,  time: '10:55 PM', source: 'capone' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 400, time: '11:12 PM', source: 'capone' }] },
      { day: 3,  city: 'Beaumont',     state: 'TX', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 59,  time: '11:38 PM', source: 'discover', merchantId: 'MID-0001102' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:54 PM', source: 'capone' }] },
      { day: 5,  city: 'New Orleans',  state: 'LA', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 99,  time: '10:21 PM', source: 'discover', merchantId: 'MID-0001287' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 500, time: '10:44 PM', source: 'capone' }] },
      { day: 7,  city: 'Mobile',       state: 'AL', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 69,  time: '11:15 PM', source: 'discover', merchantId: 'MID-0001394' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 300, time: '11:33 PM', source: 'capone' }] },
      { day: 9,  city: 'Jacksonville', state: 'FL', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 79,  time: '10:49 PM', source: 'discover', merchantId: 'MID-0001521' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:07 PM', source: 'capone' }] },
      { day: 10, city: 'Houston',      state: 'TX', transactions: [{ mcc: '4121', mccLabel: 'Rideshare',       amount: 22,  time: '04:18 AM', source: 'capone' }] },
    ],
  },
]

// ── Pattern 2: Controller Network Cases ──────────────────────────────────────

export interface ControllerAccount {
  id: string
  institution: 'capone' | 'discover'
  holderName: string
  openedDaysAgo: number
  sharedSignals: string[]
  lastTransactionTime: string
  cashOutTotal: number
}

export interface ControllerMerchant {
  merchantId: string
  merchantName: string
  mcc: string
  mccLabel: string
  city: string
  state: string
  transactionCount: number
  timeWindow: string
}

export interface ControllerCase {
  id: string
  controllerFingerprint: string
  controllerIp: string
  riskScore: number
  flaggedCategories: string[]
  accounts: ControllerAccount[]
  sharedMerchants: ControllerMerchant[]
  capOneSignal: string
  discoverSignal: string
  combinedInsight: string
  totalCashOut: number
  daySpan: number
}

export const CONTROLLER_CASES: ControllerCase[] = [
  {
    id: 'CTRL-001',
    controllerFingerprint: 'FP-7a3c9d2e1b4f8a0c',
    controllerIp: '192.168.44.17',
    riskScore: 97,
    flaggedCategories: ['20-T3', '14-Cash'],
    totalCashOut: 28400,
    daySpan: 21,
    capOneSignal: 'Four Cap One accounts opened within 8 weeks of each other share the same device fingerprint across login sessions. All four show identical spend patterns: hotel check-in followed by ATM withdrawal within 20 minutes. Combined cash-out: $14,200 over 21 days.',
    discoverSignal: 'Five Discover cards (different BINs — Chase, Wells Fargo, US Bank, Citi, Cap One) all transact at the same 3 merchant IDs within overlapping 90-minute windows on 7 separate nights. The terminal IP at two of these merchants matches a Cap One session IP from the same time periods.',
    combinedInsight: 'The device fingerprint appearing in Cap One\'s session logs is the same IP address appearing at two Discover network terminals. One controller, nine cards from six different issuing banks. Neither institution could see this — Discover could see the multi-issuer convergence but not the controller; Cap One could see the shared device but not the network-level clustering.',
    accounts: [
      { id: 'CAP-001847', institution: 'capone',   holderName: 'Maria T.',   openedDaysAgo: 52, sharedSignals: ['device_fingerprint', 'ip_address'], lastTransactionTime: '2024-11-14 11:43 PM', cashOutTotal: 3800 },
      { id: 'CAP-003291', institution: 'capone',   holderName: 'Jennifer A.',openedDaysAgo: 61, sharedSignals: ['device_fingerprint', 'ip_address'], lastTransactionTime: '2024-11-14 11:51 PM', cashOutTotal: 4100 },
      { id: 'CAP-006782', institution: 'capone',   holderName: 'Sarah M.',   openedDaysAgo: 44, sharedSignals: ['device_fingerprint'],              lastTransactionTime: '2024-11-15 12:03 AM', cashOutTotal: 3200 },
      { id: 'CAP-009134', institution: 'capone',   holderName: 'Ashley R.',  openedDaysAgo: 38, sharedSignals: ['device_fingerprint', 'ip_address'], lastTransactionTime: '2024-11-13 11:28 PM', cashOutTotal: 3100 },
      { id: 'DIS-001923', institution: 'discover', holderName: 'Karen L.',   openedDaysAgo: 67, sharedSignals: ['merchant_co_occurrence', 'time_window'], lastTransactionTime: '2024-11-14 11:49 PM', cashOutTotal: 2900 },
      { id: 'EXT-CHASE',  institution: 'discover', holderName: '[Chase BIN 435544]', openedDaysAgo: 0, sharedSignals: ['merchant_co_occurrence', 'time_window'], lastTransactionTime: '2024-11-14 11:52 PM', cashOutTotal: 3400 },
      { id: 'EXT-WF',     institution: 'discover', holderName: '[Wells Fargo BIN 490303]', openedDaysAgo: 0, sharedSignals: ['merchant_co_occurrence'],              lastTransactionTime: '2024-11-13 11:31 PM', cashOutTotal: 2800 },
      { id: 'EXT-USB',    institution: 'discover', holderName: '[US Bank BIN 517805]',  openedDaysAgo: 0, sharedSignals: ['merchant_co_occurrence', 'time_window'], lastTransactionTime: '2024-11-15 12:09 AM', cashOutTotal: 2700 },
      { id: 'EXT-CITI',   institution: 'discover', holderName: '[Citibank BIN 540111]', openedDaysAgo: 0, sharedSignals: ['terminal_ip'],                           lastTransactionTime: '2024-11-14 11:47 PM', cashOutTotal: 2400 },
    ],
    sharedMerchants: [
      { merchantId: 'MID-0000041', merchantName: 'Northside Inn',       mcc: '7011', mccLabel: 'Hotel/Motel',      city: 'Atlanta',   state: 'GA', transactionCount: 47, timeWindow: '10 PM – 2 AM' },
      { merchantId: 'MID-0001872', merchantName: 'Budget Rest Stop',    mcc: '7011', mccLabel: 'Hotel/Motel',      city: 'Atlanta',   state: 'GA', transactionCount: 31, timeWindow: '11 PM – 3 AM' },
      { merchantId: 'MID-0002341', merchantName: 'QuickLoad Prepaid',   mcc: '6540', mccLabel: 'Prepaid Reload',   city: 'Atlanta',   state: 'GA', transactionCount: 28, timeWindow: '11 PM – 1 AM' },
    ],
  },
]

// ── Pattern 3: Front Business / Commercial Cover Cases ───────────────────────

export interface HourlyVolume {
  hour: number
  volume: number
  peerAvg: number
}

export interface FrontBusinessCase {
  id: string
  merchantId: string
  merchantName: string
  legalEntityName: string
  mcc: string
  mccLabel: string
  declaredBusiness: string
  city: string
  state: string
  monthlyVolume: number
  peerMonthlyVolume: number
  avgTicket: number
  peerAvgTicket: number
  chargebackRate: number
  peerChargebackRate: number
  cnpPct: number
  nightPct: number
  riskScore: number
  flaggedCategories: string[]
  commercialCounterpartyId: string | null
  commercialExposure: number | null
  hourlyVolume: HourlyVolume[]
  capOneSignal: string
  discoverSignal: string
  combinedInsight: string
  fincenRedFlags: { flag: string; detail: string }[]
}

export const FRONT_BUSINESS_CASES: FrontBusinessCase[] = [
  {
    id: 'FRONT-001',
    merchantId: 'MID-0003847',
    merchantName: 'Sunrise Relaxation Spa',
    legalEntityName: 'Sunrise Wellness Group LLC',
    mcc: '7297',
    mccLabel: 'Massage Parlors',
    declaredBusiness: 'Day spa and wellness center',
    city: 'Las Vegas',
    state: 'NV',
    monthlyVolume: 182000,
    peerMonthlyVolume: 28000,
    avgTicket: 118,
    peerAvgTicket: 72,
    chargebackRate: 0.0,
    peerChargebackRate: 0.018,
    cnpPct: 0.91,
    nightPct: 0.84,
    riskScore: 96,
    flaggedCategories: ['14-MCC', '14-Time', '20-T2'],
    commercialCounterpartyId: 'COMM-00312',
    commercialExposure: 750000,
    fincenRedFlags: [
      { flag: 'Zero chargeback rate', detail: 'FIN-2020-A008, Typology 2: Absence of chargebacks in a cash-equivalent personal services business is itself a red flag — it indicates pre-payment under duress or coercion.' },
      { flag: '84% after-hours (10 PM – 4 AM)', detail: 'FIN-2014-A008: Transaction concentration in late-night hours inconsistent with declared day spa business.' },
      { flag: '91% card-not-present', detail: 'FIN-2020-A008, Typology 2: CNP-dominant transaction mix for a declared in-person service business indicates online booking through intermediary platforms.' },
      { flag: '6.5× peer monthly volume', detail: 'FIN-2014-A008: Volume inconsistent with the physical capacity and staffing of the declared business type and location.' },
      { flag: 'Commercial credit facility ($750K)', detail: 'FIN-2020-A008, Typology 2: Cap One commercial credit facility extended to the same legal entity — credit exposure cross-referenced against network transaction behavior consistent with a front operation.' },
    ],
    hourlyVolume: [
      { hour: 0,  volume: 14200, peerAvg: 400  },
      { hour: 1,  volume: 18900, peerAvg: 200  },
      { hour: 2,  volume: 22100, peerAvg: 100  },
      { hour: 3,  volume: 19400, peerAvg: 80   },
      { hour: 4,  volume: 11200, peerAvg: 60   },
      { hour: 5,  volume: 3100,  peerAvg: 100  },
      { hour: 6,  volume: 800,   peerAvg: 200  },
      { hour: 7,  volume: 400,   peerAvg: 600  },
      { hour: 8,  volume: 600,   peerAvg: 1800 },
      { hour: 9,  volume: 1200,  peerAvg: 2800 },
      { hour: 10, volume: 2100,  peerAvg: 3200 },
      { hour: 11, volume: 2800,  peerAvg: 3400 },
      { hour: 12, volume: 3100,  peerAvg: 3200 },
      { hour: 13, volume: 2900,  peerAvg: 3000 },
      { hour: 14, volume: 2400,  peerAvg: 2800 },
      { hour: 15, volume: 1900,  peerAvg: 2600 },
      { hour: 16, volume: 1600,  peerAvg: 2400 },
      { hour: 17, volume: 2200,  peerAvg: 2200 },
      { hour: 18, volume: 4800,  peerAvg: 2000 },
      { hour: 19, volume: 7200,  peerAvg: 1800 },
      { hour: 20, volume: 9800,  peerAvg: 1600 },
      { hour: 21, volume: 12400, peerAvg: 1200 },
      { hour: 22, volume: 16800, peerAvg: 800  },
      { hour: 23, volume: 16300, peerAvg: 600  },
    ],
    capOneSignal: 'Cap One has a $750,000 commercial credit facility with "Sunrise Wellness Group LLC." Last credit review flagged covenant compliance as borderline. The beneficial owner (COMM-00312) has a second commercial account with $180K outstanding. Standard credit risk review — nothing unusual in isolation.',
    discoverSignal: 'MID-0003847 ("Sunrise Relaxation Spa") processes $182K/month on the Discover network. 91% CNP, 84% transactions between 10 PM and 4 AM. Zero chargebacks in 14 months. Volume is 6.5× the peer median for MCC 7297 in Las Vegas. Network fraud score: 0.04 (not flagged — the pattern is too clean to trigger velocity rules).',
    combinedInsight: 'The legal entity behind the merchant is the same as Cap One\'s commercial borrower. The network shows a business operating at 6.5× peer volume, almost entirely at night, entirely card-not-present, with zero chargebacks — a profile that is statistically impossible for a legitimate day spa. The credit facility provides capital that is likely being used to fund operations. Neither institution connected these entities before today.',
  },
  {
    id: 'FRONT-002',
    merchantId: 'MID-0005123',
    merchantName: 'Express Transportation LLC',
    legalEntityName: 'Express Transportation LLC',
    mcc: '4121',
    mccLabel: 'Taxicabs & Rideshare',
    declaredBusiness: 'Private car service',
    city: 'Miami',
    state: 'FL',
    monthlyVolume: 94000,
    peerMonthlyVolume: 31000,
    avgTicket: 43,
    peerAvgTicket: 18,
    chargebackRate: 0.002,
    peerChargebackRate: 0.031,
    cnpPct: 0.97,
    nightPct: 0.79,
    riskScore: 88,
    flaggedCategories: ['14-MCC', '14-Time', '20-T2'],
    commercialCounterpartyId: null,
    commercialExposure: null,
    fincenRedFlags: [
      { flag: 'Average ticket 2.4× peer ($43 vs $18)', detail: 'FIN-2014-A008: Ticket size inconsistent with standard rideshare fares suggests bundled payments or controlled account payments.' },
      { flag: '79% after-hours (10 PM – 5 AM)', detail: 'FIN-2014-A008: Night-dominant transport business concentrated in same hours as co-occurring hotel MCC cluster.' },
      { flag: '97% CNP — no in-car terminal usage', detail: 'FIN-2020-A008, Typology 2: A car service processing almost entirely CNP (online/app) with no physical terminal transactions is inconsistent with in-person transport.' },
      { flag: 'Geographically co-located with CORR-001 hotel cluster', detail: 'FIN-2014-A008: Terminal IP overlaps with hotels in the I-95 corridor pattern — same locations, same time windows.' },
    ],
    hourlyVolume: [
      { hour: 0,  volume: 8200,  peerAvg: 1800 },
      { hour: 1,  volume: 9100,  peerAvg: 1200 },
      { hour: 2,  volume: 8800,  peerAvg: 800  },
      { hour: 3,  volume: 7200,  peerAvg: 400  },
      { hour: 4,  volume: 4100,  peerAvg: 300  },
      { hour: 5,  volume: 1800,  peerAvg: 600  },
      { hour: 6,  volume: 900,   peerAvg: 1200 },
      { hour: 7,  volume: 700,   peerAvg: 2000 },
      { hour: 8,  volume: 600,   peerAvg: 2800 },
      { hour: 9,  volume: 500,   peerAvg: 2600 },
      { hour: 10, volume: 600,   peerAvg: 2400 },
      { hour: 11, volume: 800,   peerAvg: 2200 },
      { hour: 12, volume: 1100,  peerAvg: 2400 },
      { hour: 13, volume: 1000,  peerAvg: 2200 },
      { hour: 14, volume: 900,   peerAvg: 2000 },
      { hour: 15, volume: 1200,  peerAvg: 2200 },
      { hour: 16, volume: 1800,  peerAvg: 2600 },
      { hour: 17, volume: 2400,  peerAvg: 3200 },
      { hour: 18, volume: 3200,  peerAvg: 3400 },
      { hour: 19, volume: 4800,  peerAvg: 3000 },
      { hour: 20, volume: 6200,  peerAvg: 2600 },
      { hour: 21, volume: 7800,  peerAvg: 2200 },
      { hour: 22, volume: 9200,  peerAvg: 2000 },
      { hour: 23, volume: 9100,  peerAvg: 1900 },
    ],
    capOneSignal: 'No commercial relationship. Three Cap One cardholders have recurring charges to this merchant — all three also appear in the CORR-001 corridor pattern. The charges post as "EXPRESS TRANS* MIAMI FL" with amounts between $38 and $52.',
    discoverSignal: 'MID-0005123 shows 97% CNP transactions — a car service with no physical terminal. Average ticket is $43, more than double the MCC peer. Terminal IP address appears in the same subnet as two hotels in the CORR-001 corridor. Network fraud score: 0.11.',
    combinedInsight: 'Three Cap One cardholders who appear in the I-95 corridor trafficking pattern are also customers of this merchant. The terminal IP overlaps with corridor hotels. A transport business processing almost entirely at night, CNP-only, with 2.4× average ticket — likely functioning as a controlled transport service, not a legitimate rideshare operator.',
  },
]

// ── Summary Stats ─────────────────────────────────────────────────────────────

export const DARK_PATTERN_STATS = {
  corridorCases: 2,
  controllerCases: 1,
  frontBusinessCases: 2,
  totalEntitiesFlagged: 23,
  totalCardsInvolved: 14,
  totalIssuersAffected: 6,
  estimatedExposure: 284000,
  fincenCategoriesTriggered: 6,
  crossInstitutionSignals: 9,
}
