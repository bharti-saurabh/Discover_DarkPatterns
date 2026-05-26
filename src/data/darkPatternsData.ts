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
    label: 'Geographic Movement Patterns',
    description: 'Customers frequently appearing to move through and transact from multiple cities or states within short timeframes — especially when combined with trafficking-adjacent MCC activity at each stop.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '14-Time': {
    id: '14-Time',
    label: 'After-Hours Concentration',
    description: 'Transactions concentrated outside normal business operating hours, inconsistent with the declared business type — e.g., a day spa or transportation service with activity predominantly at night.',
    source: 'FIN-2014-A008',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  '20-T1': {
    id: '20-T1',
    label: 'Front Companies — Typology 1',
    description: 'Licit or illicit businesses used as front companies to launder trafficking proceeds — including massage parlors, nail salons, bars, restaurants, and spas with transaction profiles inconsistent with their declared operations.',
    source: 'FIN-2020-A008, Typology 1',
    sourceUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
  },
  '20-T3': {
    id: '20-T3',
    label: 'Funnel Accounts — Typology 3',
    description: 'Multiple accounts receiving cash deposits below the CTR threshold from various sources and locations, followed by rapid consolidation and disbursement — consistent with layering trafficking proceeds across institutions.',
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

// ── Detection Trail ───────────────────────────────────────────────────────────

export interface DetectionStep {
  agent: string
  finding: string
  source: 'capone' | 'discover' | 'combined'
  confidence: number
  timestamp: string
  isAlert?: boolean
}

// ── SAR & Cross-Case ──────────────────────────────────────────────────────────

export interface SarStatus {
  status: 'monitoring' | 'sar-review' | 'escalated' | 'sar-filed'
  filingType: string
  deadline: string
  team: string
  notes: string
}

export interface CrossCaseRef {
  caseId: string
  tab: 'corridor' | 'controller' | 'front-business'
  relationship: string
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
  cardholderIdA: string
  cardholderIdB?: string
  corridor: string
  corridorLabel: string
  riskScore: number
  flaggedCategories: string[]
  homeCityState: string
  stops: CorridorStop[]
  capOneSignal: string
  discoverSignal: string
  combinedInsight: string
  detectionTrail: DetectionStep[]
  sarStatus: SarStatus
  crossCaseRefs: CrossCaseRef[]
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
    capOneSignal: 'Account shows 14 hotel charges across 6 cities in 18 days. $2,200 in ATM withdrawals and $1,000 in prepaid card reloads across 6 stops — all cash-equivalent. No dining, grocery, or retail spend at any point. Behavior score dropped 180 points in 30 days.',
    discoverSignal: 'Three Discover-network hotels on the I-95 corridor each show a spike in cross-issuer card volume on the same nights this cardholder checked in — 8 to 14 other cards from different issuer BINs transacting at the same property within the same 4-hour window.',
    combinedInsight: 'The Cap One cardholder is not alone. Discover\'s network view shows coordinated multi-card activity at each hotel stop — different issuer BINs, same merchants, same time windows. This is not a business traveler. This is a coordinated pattern across at least 9 cards at the same 5 properties.',
    detectionTrail: [
      { agent: 'Behavioral Velocity Analyzer', finding: '14 hotel charges across 6 cities in 18 days. Spend velocity score 0.94 — 99th percentile for this cardholder segment. No grocery, dining, or retail spend detected anywhere in the corridor.', source: 'capone', confidence: 94, timestamp: '2024-11-14 22:17:03' },
      { agent: 'MCC Sequence Detector', finding: 'Recurring sequence Hotel/Motel → ATM Cash → Prepaid Reload detected across 6 consecutive stops. Pattern matches known controlled-movement spend signature. $3,200 total cash-equivalent transactions ($2,200 ATM + $1,000 prepaid reloads).', source: 'capone', confidence: 91, timestamp: '2024-11-14 22:17:11' },
      { agent: 'Network Co-occurrence Engine', finding: '8–14 cross-issuer cards present at the same hotel merchant IDs within identical 4-hour windows on the same nights. Multi-BIN clustering at 5 properties along I-95 — not explainable by coincidence.', source: 'discover', confidence: 97, timestamp: '2024-11-14 22:17:28' },
      { agent: 'FinCEN Pattern Matcher', finding: 'Three advisory categories triggered: 14-MCC (hotel/rideshare MCC cluster), 14-Cash (structured ATM + prepaid reloads), 14-Geo (multi-city movement along I-95 corridor). FIN-2014-A008 trafficking indicators confirmed.', source: 'combined', confidence: 96, timestamp: '2024-11-14 22:17:34' },
      { agent: 'Alert Engine', finding: 'HIGH RISK — probable human trafficking corridor. Coordinated multi-card, multi-issuer movement pattern. Cap One cardholder CAP-004821 / Discover DIS-002193 identified as likely victim. Escalate for SAR filing review.', source: 'combined', confidence: 94, timestamp: '2024-11-14 22:17:35', isAlert: true },
    ],
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
    sarStatus: { status: 'sar-review', filingType: 'SAR-HT', deadline: '2024-12-07', team: 'BSA/AML Northeast', notes: 'Probable victim pattern. 30-day SAR clock started 2024-11-14. Coordinating with LE liaison for victim services referral.' },
    crossCaseRefs: [{ caseId: 'FRONT-002', tab: 'front-business', relationship: '3 corridor cardholders are recurring customers of this transport merchant — terminal IP overlaps with corridor hotel stops.' }],
  },
  {
    id: 'CORR-002',
    cardholderIdA: 'CAP-007342',
    corridor: 'I10-S',
    corridorLabel: 'I-10 Southern',
    riskScore: 87,
    flaggedCategories: ['14-MCC', '14-Cash', '14-Geo'],
    homeCityState: 'Houston, TX',
    capOneSignal: 'Rapid city movement across 5 Texas/Louisiana cities in 10 days. $1,200 in ATM withdrawals and $1,000 in prepaid card reloads — $2,200 total cash-equivalent. No recurring merchant relationships — each hotel is new. Account opened 34 days ago.',
    discoverSignal: 'Two truck-stop-adjacent hotels on I-10 show the same cardholder co-occurring with 6–11 other multi-issuer cards. One Beaumont, TX property has appeared in 3 separate multi-card events in 45 days.',
    combinedInsight: 'New account (34 days old) immediately enters a high-frequency corridor pattern. Discover\'s network identifies the Beaumont property as a repeat venue — third coordinated event at the same merchant in 45 days, each time with a different set of cards from different issuers. The property is a nexus, not a coincidence.',
    detectionTrail: [
      { agent: 'Account Vintage Detector', finding: 'Account opened 34 days ago. Immediately exhibits high-frequency multi-city corridor behavior — new account anomaly score 0.91. No account seasoning, no merchant relationship history prior to day 1.', source: 'capone', confidence: 88, timestamp: '2024-11-10 23:04:17' },
      { agent: 'Geographic Corridor Mapper', finding: 'Houston → Beaumont → New Orleans → Mobile → Jacksonville in 10 days. Route traces I-10 Southern corridor — a documented high-trafficking interstate. $2,200 total cash transactions ($1,200 ATM + $1,000 prepaid reloads).', source: 'capone', confidence: 87, timestamp: '2024-11-10 23:04:25' },
      { agent: 'Merchant Recurrence Engine', finding: 'Beaumont TX property MID-0001102 flagged as repeat nexus: this is the 3rd coordinated multi-card event at this merchant in 45 days, each with a completely different set of issuer BINs. The property is the constant — not the cardholders.', source: 'discover', confidence: 93, timestamp: '2024-11-10 23:04:41' },
      { agent: 'FinCEN Pattern Matcher', finding: 'Categories confirmed: 14-MCC, 14-Cash, 14-Geo. New-account corridor entry combined with merchant-level recurrence at MID-0001102 elevates this from individual flag to systemic trafficking venue indicator.', source: 'combined', confidence: 89, timestamp: '2024-11-10 23:04:47' },
      { agent: 'Alert Engine', finding: 'HIGH RISK — I-10 Southern corridor trafficking pattern. New account fast-tracked into movement. Merchant MID-0001102 (Beaumont, TX) flagged as probable trafficking venue — third coordinated event. Recommend venue-level investigation.', source: 'combined', confidence: 87, timestamp: '2024-11-10 23:04:48', isAlert: true },
    ],
    stops: [
      { day: 1,  city: 'Houston',      state: 'TX', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 69,  time: '10:55 PM', source: 'capone' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 400, time: '11:12 PM', source: 'capone' }] },
      { day: 3,  city: 'Beaumont',     state: 'TX', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 59,  time: '11:38 PM', source: 'discover', merchantId: 'MID-0001102' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:54 PM', source: 'capone' }] },
      { day: 5,  city: 'New Orleans',  state: 'LA', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 99,  time: '10:21 PM', source: 'discover', merchantId: 'MID-0001287' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 500, time: '10:44 PM', source: 'capone' }] },
      { day: 7,  city: 'Mobile',       state: 'AL', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 69,  time: '11:15 PM', source: 'discover', merchantId: 'MID-0001394' }, { mcc: '6010', mccLabel: 'ATM Cash',      amount: 300, time: '11:33 PM', source: 'capone' }] },
      { day: 9,  city: 'Jacksonville', state: 'FL', transactions: [{ mcc: '7011', mccLabel: 'Hotel',          amount: 79,  time: '10:49 PM', source: 'discover', merchantId: 'MID-0001521' }, { mcc: '6540', mccLabel: 'Prepaid Reload', amount: 500, time: '11:07 PM', source: 'capone' }] },
      { day: 10, city: 'Houston',      state: 'TX', transactions: [{ mcc: '4121', mccLabel: 'Rideshare',       amount: 22,  time: '04:18 AM', source: 'capone' }] },
    ],
    sarStatus: { status: 'monitoring', filingType: 'SAR-HT', deadline: '2024-12-12', team: 'BSA/AML South', notes: 'Merchant MID-0001102 (Beaumont, TX) flagged as repeat venue — third event in 45 days. Venue-level investigation requested from BSA South team.' },
    crossCaseRefs: [],
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
  detectionTrail: DetectionStep[]
  sarStatus: SarStatus
  crossCaseRefs: CrossCaseRef[]
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
    detectionTrail: [
      { agent: 'Device Fingerprint Analyzer', finding: '4 Cap One accounts share device fingerprint FP-7a3c9d2e1b4f8a0c across login sessions spanning 8 weeks. Probability of coincidental fingerprint match across 4 unrelated individuals: <0.001%. All 4 opened within the same 8-week window.', source: 'capone', confidence: 99, timestamp: '2024-11-15 00:31:14' },
      { agent: 'Session IP Correlator', finding: 'Controller IP 192.168.44.17 appears in authenticated session logs for 3 of the 4 flagged accounts. Login events cluster between 10:45 PM and 12:15 AM — consistent with single-operator session management of multiple accounts.', source: 'capone', confidence: 97, timestamp: '2024-11-15 00:31:22' },
      { agent: 'Terminal IP Cross-Mapper', finding: 'IP 192.168.44.17 resolved in Discover merchant terminal logs for MID-0001872 (Budget Rest Stop) and MID-0002341 (QuickLoad Prepaid). Controller IP appears on both Cap One session logs AND Discover POS terminals — definitive cross-network link.', source: 'discover', confidence: 98, timestamp: '2024-11-15 00:31:39' },
      { agent: 'Multi-Issuer Convergence Engine', finding: '9 cards from 6 different issuers (Cap One, Discover, Chase, Wells Fargo, US Bank, Citibank) converge at the same 3 merchant IDs in overlapping 90-minute windows across 7 separate nights. $28,400 combined cash-out. No legitimate explanation for cross-issuer clustering at this scale.', source: 'combined', confidence: 97, timestamp: '2024-11-15 00:31:51' },
      { agent: 'Alert Engine', finding: 'CRITICAL — 9-account controller network confirmed. One operator directing cards from 6 issuing banks. FIN-2020-A008 Typology 3 (multi-account controller / money mule network). $28,400 cash-out over 21 days. Immediate escalation recommended.', source: 'combined', confidence: 97, timestamp: '2024-11-15 00:31:52', isAlert: true },
    ],
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
    sarStatus: { status: 'sar-filed', filingType: 'SAR-HT + MM', deadline: '2024-11-29', team: 'Financial Intelligence Unit', notes: 'SAR filed 2024-11-15. Law enforcement referral submitted to FBI Financial Crimes Unit. Controller identity under active investigation.' },
    crossCaseRefs: [],
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
  detectionTrail: DetectionStep[]
  sarStatus: SarStatus
  crossCaseRefs: CrossCaseRef[]
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
    flaggedCategories: ['14-MCC', '14-Time', '20-T1'],
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
    detectionTrail: [
      { agent: 'Volume Outlier Detector', finding: 'Monthly volume $182,000 vs MCC 7297 peer median $28,000 — 6.5× outlier, >99.5th percentile for Las Vegas day spa category. Automated threshold breach triggered secondary analysis queue.', source: 'discover', confidence: 99, timestamp: '2024-11-12 03:22:08' },
      { agent: 'Temporal Anomaly Engine', finding: '84% of transactions fall between 10 PM and 4 AM. A licensed day spa operating primarily in this window is a physical impossibility. Zero transactions during declared business hours (9 AM–7 PM) on 6 of the last 14 days.', source: 'discover', confidence: 98, timestamp: '2024-11-12 03:22:19' },
      { agent: 'Commercial Credit Resolver', finding: 'Legal entity "Sunrise Wellness Group LLC" matched to Cap One commercial borrower COMM-00312. Active credit facility: $750,000. Cap One credit review noted borderline covenant compliance — not flagged as fraud. Cross-institution match not previously possible.', source: 'capone', confidence: 96, timestamp: '2024-11-12 03:22:31' },
      { agent: 'Front Business Pattern Analyzer', finding: 'Four simultaneous indicators: 91% CNP (impossible for in-person service), 0.00% chargeback rate (statistically impossible for 14 months), 6.5× peer volume, 84% after-hours. Combined profile probability for a legitimate business: <0.0001%.', source: 'combined', confidence: 99, timestamp: '2024-11-12 03:22:44' },
      { agent: 'Alert Engine', finding: 'CRITICAL — probable trafficking front operation laundering proceeds. Cross-institution match: Cap One holds $750K commercial exposure to the same entity Discover sees processing anomalous MCC 7297 volume. Neither institution had visibility into the other. Immediate escalation recommended.', source: 'combined', confidence: 96, timestamp: '2024-11-12 03:22:45', isAlert: true },
    ],
    sarStatus: { status: 'escalated', filingType: 'SAR-HT', deadline: '2024-12-06', team: 'Commercial Risk + FIU', notes: 'Escalated to joint Commercial Risk and FIU review. $750K credit facility placed on administrative hold pending legal review. Regulatory referral to FinCEN under assessment.' },
    crossCaseRefs: [],
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
    flaggedCategories: ['14-MCC', '14-Time', '20-T1'],
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
    detectionTrail: [
      { agent: 'Transport MCC Anomaly Detector', finding: '97% of transactions are card-not-present for a declared in-person car service. No physical terminal usage detected in 9 months of operation. Average ticket $43 vs MCC 4121 peer $18 — 2.4× premium inconsistent with individual rides.', source: 'discover', confidence: 91, timestamp: '2024-11-14 01:14:52' },
      { agent: 'Cardholder Cross-Reference Engine', finding: '3 Cap One cardholders with recurring charges to MID-0005123 also appear in active CORR-001 (I-95 corridor) investigation. Cross-case linkage confirmed — same individuals using this transport service AND appearing in multi-hotel trafficking corridor.', source: 'capone', confidence: 94, timestamp: '2024-11-14 01:14:59' },
      { agent: 'Geographic IP Correlator', finding: 'Terminal IP subnet for MID-0005123 overlaps with hotel merchant terminal IPs from CORR-001 stops in Providence, Philadelphia, and Baltimore. Transport service and corridor hotels share network infrastructure — operational coordination implied.', source: 'combined', confidence: 89, timestamp: '2024-11-14 01:15:11' },
      { agent: 'FinCEN Pattern Matcher', finding: 'Categories confirmed: 14-MCC (rideshare co-occurring with hotel MCC cluster), 14-Time (79% after-hours), 20-T1 (front business indicators). Cross-case link to active CORR-001 corridor pattern elevates priority.', source: 'combined', confidence: 90, timestamp: '2024-11-14 01:15:18' },
      { agent: 'Alert Engine', finding: 'HIGH RISK — controlled transport service linked to I-95 corridor trafficking network (CORR-001). Terminal IP overlap with corridor hotels. 3 cardholder cross-references confirmed. Likely functioning as dedicated transport for controlled movement operation.', source: 'combined', confidence: 88, timestamp: '2024-11-14 01:15:19', isAlert: true },
    ],
    sarStatus: { status: 'sar-review', filingType: 'SAR-HT', deadline: '2024-11-28', team: 'BSA/AML Northeast', notes: 'Cross-referenced to CORR-001 SAR filing. SAR will be filed jointly covering both cases to capture the transport-corridor connection. 8 days remaining on filing clock.' },
    crossCaseRefs: [{ caseId: 'CORR-001', tab: 'corridor', relationship: '3 cardholders in the I-95 corridor pattern are recurring customers. Terminal IP subnet overlaps with corridor hotel stops.' }],
  },
]

// ── Summary Stats ─────────────────────────────────────────────────────────────

export const DARK_PATTERN_STATS = {
  corridorCases: 2,
  controllerCases: 1,
  frontBusinessCases: 2,
  // 3 corridor cardholders + 9 CTRL-001 accounts + 2 merchant entities = 14
  totalEntitiesFlagged: 14,
  // CORR-001: 2 cards, CORR-002: 1 card, CTRL-001: 9 accounts (4 Cap One + 5 other-issuer BINs)
  totalCardsInvolved: 12,
  totalIssuersAffected: 6,
  // FRONT-001 $182K + FRONT-002 $94K + CTRL-001 $28.4K + CORR-001 ~$4K + CORR-002 ~$2.6K
  estimatedExposure: 311000,
  fincenCategoriesTriggered: 6,
  crossInstitutionSignals: 9,
}
