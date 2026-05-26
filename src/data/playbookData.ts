// ── Detection Playbook ────────────────────────────────────────────────────────
// Maps FinCEN advisory guidance → computational detection rule → data requirements
// → per-institution capability and combined insight

export interface DataField {
  name: string
  type: 'transaction' | 'merchant' | 'device' | 'geographic' | 'temporal'
  source: 'capone' | 'discover' | 'both'
  description: string
}

export interface PlaybookRule {
  categoryId: string
  advisoryRef: string
  advisoryUrl: string
  advisoryGuidance: string
  detectionObjective: string
  computationalSteps: string[]
  dataFields: DataField[]
  caponeAlone: { capability: string; limitation: string }
  discoverAlone: { capability: string; limitation: string }
  combined: { capability: string; uniqueInsight: string }
  triggeredCases: string[]
}

export const PLAYBOOK_RULES: PlaybookRule[] = [
  {
    categoryId: '14-MCC',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryGuidance:
      'Financial institutions should identify transactions at hotels, motels, massage parlors, escort services, rideshare providers, and adult entertainment venues — especially when multiple indicators cluster at the same merchant or geographic area over a concentrated time period. Absence of ordinary consumer spending (grocery, dining, retail) alongside trafficking-adjacent MCC concentration is itself a red flag.',
    detectionObjective:
      'Identify cardholders whose spend is dominated by trafficking-adjacent MCCs and detect clustering of multiple cards from different issuers at the same merchant locations.',
    computationalSteps: [
      'Filter transactions by high-risk MCC set: 7011 (Hotels), 4121 (Rideshare), 6540 (Prepaid Reload), 6010 (ATM Cash), 7297 (Massage), 7299 (Personal Services)',
      'Compute per-cardholder "trafficking MCC ratio": high-risk MCC spend ÷ total spend in rolling 30-day window',
      'Detect recurring sequences: Hotel(7011) → ATM(6010) or Prepaid(6540) within same city within 4 hours',
      'Identify merchant-level clustering: count distinct issuer BINs transacting at same merchant within ±4-hour windows across days',
      'Flag when: MCC ratio > 0.70 AND sequence count ≥ 2, OR any merchant shows BIN clustering ≥ 8 distinct issuers',
    ],
    dataFields: [
      { name: 'MCC Code', type: 'transaction', source: 'both', description: 'Merchant Category Code on each authorization — primary input for trafficking MCC scoring' },
      { name: 'Merchant ID', type: 'merchant', source: 'both', description: 'Unique merchant identifier enabling multi-card clustering analysis at specific locations' },
      { name: 'Authorization Timestamp', type: 'temporal', source: 'both', description: 'Exact time of each transaction for sequence detection and time-window clustering' },
      { name: 'Issuer BIN', type: 'transaction', source: 'discover', description: 'First 6 digits of card number — identifies issuing bank, enables multi-issuer clustering at Discover-network merchants' },
      { name: '90-Day Spend History', type: 'transaction', source: 'capone', description: 'Full spend category breakdown per cardholder — establishes baseline to detect absence of ordinary spend categories' },
    ],
    caponeAlone: {
      capability: 'Detect MCC concentration within Cap One cardholders. Identify individuals spending >70% in trafficking MCCs. Flag Hotel→ATM→Prepaid sequences within a single named cardholder.',
      limitation: 'Cannot see whether other cardholders from different issuers are co-occurring at the same merchants. In CTRL-001, sees only 4 of 9 accounts — misses 5 Discover/external-issuer accounts in the same controller network.',
    },
    discoverAlone: {
      capability: 'Detect multi-BIN clustering at Discover-network merchants — identify when 8+ cards from different issuer banks transact at the same hotel or personal services merchant within the same time window.',
      limitation: 'Cannot link merchant-level clustering back to specific cardholder identities or movement histories. Sees the coordinated demand side (multiple cards at the same place) but not who those cardholders are or where they came from.',
    },
    combined: {
      capability: 'Named cardholder MCC sequences (Cap One) cross-referenced with merchant-level multi-issuer clustering (Discover). Confirms that the cardholder is part of a larger coordinated group — not an individual traveler.',
      uniqueInsight: 'CORR-001: Cap One identified CAP-004821 as a solo corridor case. Discover confirmed 8–14 other cross-issuer cards at the identical hotel properties on the same nights. The cardholder is one participant in a coordinated multi-card operation — only visible when both datasets combine.',
    },
    triggeredCases: ['CORR-001', 'CORR-002', 'FRONT-001', 'FRONT-002'],
  },

  {
    categoryId: '14-Cash',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryGuidance:
      'Frequent purchase or reload of prepaid cards, money orders, or repeated ATM cash advances — particularly when amounts appear structured to avoid $10,000 reporting thresholds and when combined with trafficking-adjacent MCC activity — are consistent with methods used to move and layer trafficking proceeds.',
    detectionObjective:
      'Identify cardholders with high cash-equivalent velocity (ATM withdrawals + prepaid reloads) correlated with geographic corridor stops, and detect structuring patterns below CTR thresholds.',
    computationalSteps: [
      'Aggregate ATM cash advances (MCC 6010) and prepaid card reloads (MCC 6540) per cardholder in rolling 30-day window',
      'Compute cash-velocity ratio: (ATM total + prepaid total) ÷ total spend. Flag ratio ≥ 0.55',
      'Detect structuring: flag when 3+ cash transactions fall between $3,000–$9,900 within a 7-day window',
      'Correlate cash events with geographic corridor activity — same-city ATM + prepaid within same stop amplifies risk score',
      'Combine signals: cash-velocity ≥ 0.55 AND MCC ratio ≥ 0.60 → high-confidence trafficking cash pattern',
    ],
    dataFields: [
      { name: 'ATM Amount', type: 'transaction', source: 'capone', description: 'Dollar amount of each ATM cash advance (MCC 6010) — primary cash velocity input' },
      { name: 'Prepaid Reload Amount', type: 'transaction', source: 'both', description: 'Dollar amount of prepaid card reloads (MCC 6540) — may appear on either network' },
      { name: 'Transaction Frequency', type: 'temporal', source: 'both', description: 'Daily and weekly count of cash-equivalent transactions for velocity and structuring detection' },
      { name: 'Geographic Stop Sequence', type: 'geographic', source: 'both', description: 'City-state at each cash event — correlated with corridor route match to confirm controlled movement' },
    ],
    caponeAlone: {
      capability: 'Full visibility into ATM withdrawals and prepaid reloads on Cap One-issued cards. Computes cash velocity, detects structuring below $10K, and correlates cash events with geographic stops for named cardholders.',
      limitation: 'Cannot see cash behavior on non-Cap One cards. Sees only the named cardholder\'s transactions — misses co-occurring cardholders extracting cash at the same stops from other issuers.',
    },
    discoverAlone: {
      capability: 'Sees prepaid reload volume at Discover-network merchants (MCC 6540). Detects when a single merchant location experiences unusually high prepaid reload frequency across multiple cards.',
      limitation: 'Cannot observe ATM withdrawals (bank-direct transactions, not on Discover network). Cannot link prepaid reload patterns to a specific named cardholder\'s movement corridor.',
    },
    combined: {
      capability: 'Complete cash-equivalent picture per stop: Cap One cardholder ATM behavior + Discover-network prepaid reload volume at the same merchant locations in the same time windows.',
      uniqueInsight: 'CORR-001 and CORR-002: Combined data reveals the complete cash extraction cycle — ATM withdrawal (Cap One) followed by prepaid card reload (Discover-network) at each corridor stop. Neither institution alone saw the full $3,200 per-stop cash pattern in CORR-001.',
    },
    triggeredCases: ['CORR-001', 'CORR-002', 'CTRL-001'],
  },

  {
    categoryId: '14-Geo',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryGuidance:
      'Transactions in multiple cities or states within short timeframes, particularly along known high-trafficking corridors (I-95 Northeast, I-10 Southern, I-75 Midwest), suggest controlled geographic movement when combined with trafficking-adjacent MCC activity. Repeat appearances at the same merchant by different cardholder groups indicate a venue may be a trafficking nexus.',
    detectionObjective:
      'Map cardholder movement sequences to known trafficking corridors, detect multi-city patterns inconsistent with ordinary travel, and identify merchants that repeatedly host different cardholder groups.',
    computationalSteps: [
      'Extract city-state from merchant location on each transaction; build per-cardholder movement timeline sorted by date',
      'Compute distinct city-count and state-count in rolling 21-day window. Flag cardholders visiting ≥ 4 cities in ≤ 14 days',
      'Match movement sequences against known corridor segments: I-95 (Boston→Baltimore), I-10 (Houston→Jacksonville), I-75 (Atlanta→Detroit)',
      'Detect impossible-travel: same-day transactions in locations >200 miles apart (flags shared-account or multi-card operation)',
      'Merchant nexus detection: flag any merchant visited by 3+ distinct cardholder groups within 45-day rolling window',
    ],
    dataFields: [
      { name: 'Merchant City / State', type: 'geographic', source: 'both', description: 'Physical location of each merchant — primary input for movement timeline construction' },
      { name: 'Transaction Date', type: 'temporal', source: 'both', description: 'Date of each transaction to compute travel velocity and detect impossible-travel scenarios' },
      { name: 'Merchant ID History', type: 'merchant', source: 'discover', description: 'Discover-network merchant IDs to detect venue-level recurrence across distinct cardholder groups over time' },
      { name: 'Cardholder Home City', type: 'geographic', source: 'capone', description: 'Billing address city — distinguishes corridor departures from home-city routine activity' },
      { name: 'Corridor Route Database', type: 'geographic', source: 'both', description: 'Reference dataset of documented high-trafficking interstate corridor city-state sequences' },
    ],
    caponeAlone: {
      capability: 'Full movement trace for named Cap One cardholders. Computes corridor route match, travel velocity, and multi-city anomaly score. Knows cardholder home city from billing address to establish baseline.',
      limitation: 'Only sees merchants where Cap One cards are accepted. Misses corridor hotel stops made on non-Cap One cards. Cannot detect that the same merchant location is hosting multiple distinct cardholder groups.',
    },
    discoverAlone: {
      capability: 'Sees hotel and merchant occupancy across the Discover network. Identifies when the same merchant repeatedly hosts different cardholder groups in sequential events — venue-level nexus detection (e.g., Beaumont TX property flagged as 3rd event in 45 days).',
      limitation: 'Cannot link hotel stays to a specific cardholder\'s movement trajectory or home city. Sees the merchant pattern (who is visited) but not the named individual pattern (who is traveling and where they came from).',
    },
    combined: {
      capability: 'Named cardholder movement trace (Cap One) matched to Discover-network merchant occupancy spikes at the same locations. Confirms that the cardholder is part of a larger coordinated movement pattern across multiple issuers.',
      uniqueInsight: 'CORR-002: Discover identified Beaumont TX property MID-0001102 as a repeat trafficking nexus. Cap One identified CAP-007342 as a participant in that specific event. Combined: the venue is a confirmed nexus AND we have a named individual to investigate — neither view is complete alone.',
    },
    triggeredCases: ['CORR-001', 'CORR-002'],
  },

  {
    categoryId: '14-Time',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryGuidance:
      'Transaction concentration between 10:00 PM and 4:00 AM that is inconsistent with the declared business type or normal consumer spending behavior for that merchant category is a red flag for exploitation activity. A day spa, massage parlor, or transportation service operating primarily in late-night hours is inconsistent with its declared business model.',
    detectionObjective:
      'Identify merchants with after-hours transaction profiles that are statistically inconsistent with their declared MCC peer group, and identify cardholders whose spending is systematically concentrated in late-night hours at trafficking-adjacent merchants.',
    computationalSteps: [
      'Compute hourly transaction distribution for each merchant and cardholder in rolling 30-day window',
      'Calculate "night-hour ratio": transactions between 22:00–04:00 ÷ total transactions for the entity',
      'Compare against MCC-city-dayofweek peer benchmark. Flag merchants at ≥ 2× peer night-hour ratio',
      'For cardholders: flag when night-hour ratio > 0.60 AND > 50% of spend occurs at trafficking-adjacent MCCs',
      'Double-confirm: merchant with elevated night ratio AND a cardholder arriving at that merchant after-hours = compounded signal',
    ],
    dataFields: [
      { name: 'Authorization Timestamp (hour)', type: 'temporal', source: 'both', description: 'Hour of day for each transaction — primary input for after-hours ratio computation' },
      { name: 'MCC Peer Time Benchmark', type: 'merchant', source: 'both', description: 'Statistical distribution of transaction timing by MCC, city, and day-of-week — used for peer comparison' },
      { name: 'Monthly Merchant Volume', type: 'merchant', source: 'discover', description: 'Total monthly volume weights the significance of after-hours concentration at merchant level' },
      { name: 'Declared Business Hours', type: 'merchant', source: 'both', description: 'Merchant\'s stated operating hours from onboarding — enables direct consistency check' },
    ],
    caponeAlone: {
      capability: 'Compute after-hours ratio for Cap One cardholders. Identify individuals whose spend consistently occurs in late-night hours across trafficking-adjacent MCCs. Flag cardholders with >60% after-hours activity.',
      limitation: 'Limited merchant-level visibility — can only compute timing stats for merchants where Cap One cards transact. Cannot see merchant-wide timing distribution across all issuers.',
    },
    discoverAlone: {
      capability: 'Full merchant network timing visibility. Compute after-hours ratio for any Discover-network merchant against the full MCC peer population. Identifies FRONT-001 (84% after-hours) and FRONT-002 (79% after-hours) as statistical impossibilities for their declared business types.',
      limitation: 'Cannot link merchant after-hours activity back to specific cardholder identities. Sees the merchant side of the time anomaly but not which individual cardholders are driving it or whether they appear in other cases.',
    },
    combined: {
      capability: 'Cardholder after-hours behavior (Cap One) cross-referenced against the specific merchants they visit after-hours (Discover). Confirms that named cardholders from corridor cases are the same individuals driving specific merchant after-hours anomalies.',
      uniqueInsight: 'FRONT-001 and FRONT-002: Discover identified both merchants as extreme after-hours outliers. Cap One confirmed that cardholders linked through CORR-001 also transact at these merchants in the same late-night windows — the trafficking network uses both the venues and the transport service at night.',
    },
    triggeredCases: ['FRONT-001', 'FRONT-002'],
  },

  {
    categoryId: '20-T2',
    advisoryRef: 'FIN-2020-A008, Typology 2',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
    advisoryGuidance:
      'Typology 2 describes trafficking proceeds laundered through seemingly legitimate businesses — entities whose transaction volume, ticket size, card-not-present rate, or chargeback profile is inconsistent with their declared business type. Zero chargebacks over extended periods for personal services businesses, and CNP-dominant transaction profiles for declared in-person service businesses, are specific red flags. Cross-referencing the legal entity behind a flagged merchant against commercial credit databases is critical.',
    detectionObjective:
      'Identify merchant accounts where multiple anomaly indicators simultaneously point to a front business, and cross-reference the merchant\'s legal entity against commercial credit relationships at other institutions.',
    computationalSteps: [
      'Compute monthly volume vs MCC-city-adjusted peer median. Flag merchants at > 2.5× peer median for secondary analysis queue',
      'Compute card-not-present (CNP) % per merchant. Flag CNP > 70% for declared in-person service MCCs (7297, 4121, 7011)',
      'Compute chargeback rate. Flag personal services merchants with CB rate < 0.2% over ≥ 6 months (absence is an anomaly)',
      'Score front-business probability: weight simultaneous anomaly flags — volume outlier (1pt) + CNP (1pt) + low CB (1pt) + timing (1pt). Score ≥ 3 triggers escalation',
      'Commercial cross-reference: match merchant legal entity name against Cap One commercial borrower registry — any match triggers immediate joint review',
    ],
    dataFields: [
      { name: 'Monthly Transaction Volume', type: 'merchant', source: 'discover', description: 'Total card volume processed monthly — compared against MCC-city peer median' },
      { name: 'CNP Flag per Authorization', type: 'transaction', source: 'discover', description: 'Card-not-present indicator set by merchant terminal — inconsistency with declared in-person business model' },
      { name: 'Chargeback Count & Rate', type: 'merchant', source: 'discover', description: 'Monthly chargebacks — zero chargebacks for personal services over 6+ months is statistically impossible for a legitimate business' },
      { name: 'Commercial Borrower Registry', type: 'merchant', source: 'capone', description: 'Cap One\'s internal database of commercial credit relationships — legal entity names, beneficial owners, outstanding balances' },
      { name: 'MCC Peer Benchmarks', type: 'merchant', source: 'both', description: 'Volume, CNP, chargeback, and timing norms segmented by MCC and city — required for all peer comparisons' },
    ],
    caponeAlone: {
      capability: 'Sees commercial credit relationships in full — legal entity names, beneficial ownership, credit facility terms, covenant compliance history. Flags commercial accounts with anomalous credit behavior.',
      limitation: 'Has no visibility into how much the commercial borrower is processing on the Discover network. Cap One\'s credit review of "Sunrise Wellness Group LLC" found nothing actionable — the transactional red flags are entirely on the Discover side.',
    },
    discoverAlone: {
      capability: 'Full merchant transaction intelligence: monthly volume vs peer, CNP rate, chargeback rate, timing distribution. Identifies FRONT-001 as 6.5× peer volume + 91% CNP + 0% chargebacks + 84% after-hours — a statistically impossible legitimate business profile.',
      limitation: 'Cannot link the anomalous merchant to commercial credit exposure or beneficial ownership at another institution. Identifies the fraud signal but cannot determine who owns the legal entity or what credit risk it carries.',
    },
    combined: {
      capability: 'Legal entity match: the merchant flagged by Discover\'s transaction anomaly is the same legal entity Cap One extended $750K commercial credit to. Credit exposure quantified. Beneficial owner identified. Both institutions\' risk confirmed in a single alert.',
      uniqueInsight: 'FRONT-001: Discover identified the transaction impossibility. Cap One identified $750K commercial exposure to the same entity. Neither institution knew the other had a relationship with "Sunrise Wellness Group LLC." Combined: front business confirmed + credit facility risk quantified in one joint alert.',
    },
    triggeredCases: ['FRONT-001', 'FRONT-002'],
  },

  {
    categoryId: '20-T3',
    advisoryRef: 'FIN-2020-A008, Typology 3',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
    advisoryGuidance:
      'Typology 3 describes multi-account controllers and money mule networks — a single individual managing multiple accounts across institutions, or funds rapidly transferred to third parties with no apparent relationship. Shared device fingerprints across accounts from different named customers, and multiple cards from different issuing banks converging at the same merchant within narrow time windows, are specific red flags for a controller operating a mule network.',
    detectionObjective:
      'Identify single controllers operating multiple card accounts across institutions via shared device or IP signals, and detect multi-issuer card convergence at specific merchants consistent with coordinated mule network cashout.',
    computationalSteps: [
      'Extract device fingerprints from all mobile app and web session metadata across authenticated login events',
      'Cluster accounts by shared device fingerprint using DBSCAN (similarity threshold 0.95). Flag clusters of ≥ 3 distinct named accounts',
      'Extract session IP addresses from authentication logs. Cross-reference against Discover merchant terminal IP registry for the same time periods',
      'Compute multi-BIN convergence per merchant: count distinct issuer BINs transacting within rolling 90-minute windows over 7+ separate nights',
      'Controller confirmation: shared device cluster (Cap One) + terminal IP cross-match (Discover) + multi-BIN convergence ≥ 6 issuers → controller network alert',
    ],
    dataFields: [
      { name: 'Device Fingerprint', type: 'device', source: 'capone', description: 'Composite device signature from mobile app or browser (OS, screen resolution, fonts, plugins, sensors) — persists across sessions' },
      { name: 'Session IP Address', type: 'device', source: 'capone', description: 'IP address of each authenticated session — compared against Discover merchant terminal IPs for cross-institution controller match' },
      { name: 'Merchant Terminal IP', type: 'device', source: 'discover', description: 'IP address registered by Discover-network POS terminals — cross-matched against Cap One session IPs to identify controller presence' },
      { name: 'Issuer BIN per Transaction', type: 'transaction', source: 'discover', description: 'First 6 digits of card number — identifies issuing bank, enabling multi-issuer convergence detection at specific merchant locations' },
      { name: 'Account Open Date', type: 'transaction', source: 'capone', description: 'Account vintage — recently opened accounts within a shared-device cluster significantly amplify the controller risk score' },
    ],
    caponeAlone: {
      capability: 'Detect shared device fingerprints across Cap One accounts. Identify the 4-account Cap One cluster sharing FP-7a3c9d2e1b4f8a0c. Flag controller session IP (192.168.44.17) appearing across multiple authenticated sessions.',
      limitation: 'Sees only the Cap One portion of the network — 4 of 9 accounts. Cannot verify whether the same IP appears at merchant terminals. Has no view of the 5 Discover/external-issuer accounts in the controller network, so the full scope of $28,400 cashout is invisible.',
    },
    discoverAlone: {
      capability: 'Detect multi-BIN card convergence at Discover-network merchants — confirm that 9 cards from 6 different issuers are co-occurring at MID-0000041, MID-0001872, and MID-0002341 in overlapping 90-minute windows across 7 separate nights.',
      limitation: 'Sees the coordinated convergence but cannot identify who is controlling it. Knows the cards are coordinated but lacks device fingerprint or authenticated session data to attribute the behavior to a single operator.',
    },
    combined: {
      capability: 'Definitive controller attribution: session IP 192.168.44.17 appears in Cap One authentication logs AND in Discover merchant terminal logs for two of the three shared merchants simultaneously. One IP, one person, nine cards, six banks.',
      uniqueInsight: 'CTRL-001: Cap One had the device/IP signal (4 accounts, 1 controller). Discover had the multi-issuer convergence signal (9 accounts, 3 merchants). The terminal IP cross-match is the bridge — the same IP address appears in two completely separate data systems from two institutions, confirming a single controller is operating all nine accounts.',
    },
    triggeredCases: ['CTRL-001'],
  },
]
