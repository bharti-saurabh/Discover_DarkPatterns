export type IconType =
  | 'receipt' | 'dollar' | 'map' | 'clock' | 'network'
  | 'fingerprint' | 'trending' | 'users' | 'shield' | 'zap' | 'eye'

export interface InfographicStat {
  value: string
  label: string
}

export interface InfographicSignal {
  title: string
  body: string
  icon: IconType
}

export interface RuleInfographic {
  categoryId: string
  summary: string
  stats: InfographicStat[]
  signals: InfographicSignal[]
}

export const RULE_INFOGRAPHICS: Record<string, RuleInfographic> = {
  '14-MCC': {
    categoryId: '14-MCC',
    summary: 'Hotels, massage parlors, rideshare, and adult entertainment venues are the primary trafficking-adjacent merchant categories. When spend is dominated by these MCCs — and ordinary consumer spend is absent — it is a core red flag under FIN-2014-A008.',
    stats: [
      { value: '> 70%', label: 'MCC ratio to flag' },
      { value: '< 4 hrs', label: 'Hotel → cash window' },
      { value: '≥ 8 BINs', label: 'Cluster threshold' },
      { value: '30 days', label: 'Rolling window' },
    ],
    signals: [
      { title: 'MCC Concentration', body: 'Spend ratio exceeds 70% in hotel, rideshare, ATM, massage, and personal services categories', icon: 'receipt' },
      { title: 'Hotel → Cash Sequence', body: 'ATM withdrawal or prepaid reload within 4 hours of hotel check-in, in the same city', icon: 'zap' },
      { title: 'Multi-Issuer BIN Cluster', body: '8 or more cards from different issuing banks transacting at the same merchant within a 4-hour window', icon: 'network' },
      { title: 'Absent Normal Spend', body: 'No dining, grocery, retail, or utility spend alongside high-concentration trafficking MCCs', icon: 'eye' },
    ],
  },

  '14-Cash': {
    categoryId: '14-Cash',
    summary: 'Frequent ATM withdrawals, prepaid card reloads, and transactions structured just below $10,000 are hallmarks of trafficking proceeds management. Cash velocity well above a cardholder\'s baseline is a primary FinCEN-identified red flag.',
    stats: [
      { value: '> 55%', label: 'Cash velocity threshold' },
      { value: '$10K', label: 'CTR trigger (avoided)' },
      { value: '7 days', label: 'Structuring window' },
      { value: '3+', label: 'Txns to flag pattern' },
    ],
    signals: [
      { title: 'ATM Cash Velocity', body: 'Cash advances and ATM withdrawals exceeding 55% of total spend in a 30-day window', icon: 'dollar' },
      { title: 'Prepaid Card Reloads', body: 'Repeated prepaid reload purchases (MCC 6540) at multiple locations along a corridor', icon: 'receipt' },
      { title: 'Structuring Pattern', body: 'Multiple cash transactions clustered below $10,000 designed to avoid Currency Transaction Report filing', icon: 'shield' },
      { title: 'No Spend Baseline', body: 'New account or sudden cash spike with zero historical cash activity to compare against', icon: 'trending' },
    ],
  },

  '14-Geo': {
    categoryId: '14-Geo',
    summary: 'Customers appearing in 4 or more cities within three weeks — transacting at trafficking-adjacent merchants at each stop — signal controlled corridor movement. The I-95, I-10, and I-5 routes are documented in FIN-2014-A008 as primary domestic trafficking corridors.',
    stats: [
      { value: '≥ 4 cities', label: 'Minimum stops to flag' },
      { value: '≤ 21 days', label: 'Movement window' },
      { value: '> 200 mi', label: 'Impossible travel threshold' },
      { value: '≥ 3×', label: 'Venue repeat events' },
    ],
    signals: [
      { title: 'Multi-City Corridor Movement', body: '4+ distinct cities in 21 days with trafficking-adjacent merchant spend at each stop', icon: 'map' },
      { title: 'Documented Route Match', body: 'City sequence matching the I-95, I-10, or I-5 corridors identified in the FinCEN advisory', icon: 'trending' },
      { title: 'Same-Day Impossible Travel', body: 'Transactions in cities more than 200 miles apart within the same calendar day', icon: 'zap' },
      { title: 'Venue Nexus Pattern', body: 'Same hotel or venue hosting distinct cardholder groups 3 or more times in 45 days', icon: 'network' },
    ],
  },

  '14-Time': {
    categoryId: '14-Time',
    summary: 'A merchant whose declared business hours are 9 AM–7 PM but whose transaction volume is concentrated 10 PM–4 AM is operating inconsistently with its stated purpose. FIN-2014-A008 identifies this timing anomaly — especially at 5× or more the peer benchmark — as a front business indicator.',
    stats: [
      { value: '10 PM', label: 'After-hours threshold' },
      { value: '> 2×', label: 'Peer benchmark trigger' },
      { value: '14 days', label: 'Consistent pattern window' },
      { value: '0%', label: 'Daytime activity (anomaly)' },
    ],
    signals: [
      { title: 'After-Hours Volume Spike', body: 'Transaction volume between 10 PM–4 AM exceeding 2× the MCC peer benchmark for the city', icon: 'clock' },
      { title: 'Declared Hours Mismatch', body: 'Zero transaction activity during the merchant\'s declared business hours on multiple days', icon: 'eye' },
      { title: 'Sustained Night Pattern', body: 'Identical after-hours concentration sustained across 14+ consecutive days — not anomalous, but systematic', icon: 'trending' },
    ],
  },

  '20-T1': {
    categoryId: '20-T1',
    summary: 'Front companies present as legitimate businesses while processing transactions inconsistent with their declared operations. A massage parlor processing $182K/month — 6.5× its peer median — with 91% card-not-present volume is statistically impossible as a legitimate in-person business.',
    stats: [
      { value: '> 2.5×', label: 'Volume vs MCC peer' },
      { value: '> 70%', label: 'CNP rate for in-person MCC' },
      { value: '< 0.2%', label: 'Chargeback rate (anomaly)' },
      { value: '14 mo', label: 'Min observation window' },
    ],
    signals: [
      { title: 'Volume vs Peer Anomaly', body: 'Monthly processing volume 2.5× or more above the MCC city-adjusted peer median', icon: 'trending' },
      { title: 'Card-Not-Present Rate', body: 'CNP rate above 70% for a declared in-person service — physically impossible without fraud', icon: 'eye' },
      { title: 'Zero Chargeback Rate', body: 'Chargeback rate below 0.2% over 6+ months — customers never dispute, which is anomalous', icon: 'shield' },
      { title: 'Commercial Entity Cross-Match', body: 'Legal entity simultaneously holds a commercial credit or lending facility at the same institution', icon: 'network' },
    ],
  },

  '20-T3': {
    categoryId: '20-T3',
    summary: 'Funnel accounts receive structured deposits below the $10,000 CTR threshold from multiple sources, then rapidly consolidate and disburse funds. A single device or IP operating across 4+ accounts is the key cross-institution signal under FIN-2020-A008.',
    stats: [
      { value: '< $10K', label: 'Per-deposit ceiling' },
      { value: '3+ accts', label: 'Cluster threshold' },
      { value: '24 hrs', label: 'Consolidation window' },
      { value: '6 banks', label: 'Max detected scope' },
    ],
    signals: [
      { title: 'Distributed Structured Deposits', body: 'Cash deposits spread across 3+ accounts, each below $10,000, to avoid Currency Transaction Report filing', icon: 'dollar' },
      { title: 'Shared Device or IP', body: 'Same device fingerprint or IP address controlling multiple accounts — definitive controller signal', icon: 'fingerprint' },
      { title: 'Rapid Fund Consolidation', body: 'Funds aggregated into a single account and wired out within 24 hours of receipt', icon: 'zap' },
      { title: 'Multi-Institution Scope', body: 'Same controller operating across Capital One, Discover, and external institution accounts simultaneously', icon: 'network' },
    ],
  },

  'PB-Crypto': {
    categoryId: 'PB-Crypto',
    summary: 'Pig butchering fraudsters spend weeks building victim trust before introducing a fake crypto investment platform. The financial signature is unmistakable: an account with no crypto history suddenly shows test deposits escalating geometrically, followed by large wires exhausting the credit line.',
    stats: [
      { value: '≥ 2×', label: 'Test deposit growth ratio' },
      { value: '> $5K', label: 'Wire velocity to flag' },
      { value: '+50pp', label: 'Credit util spike' },
      { value: '30 days', label: 'Detection window' },
    ],
    signals: [
      { title: 'First-Ever Crypto Deposit', body: 'MCC 6051 (crypto exchange) appearing for the first time on an account with no prior crypto history', icon: 'trending' },
      { title: 'Test Deposit Escalation', body: 'Geometric growth pattern: each crypto deposit is ≥ 2× the prior amount within 30 days', icon: 'zap' },
      { title: 'Wire Velocity Spike', body: 'Total wires to exchanges exceeding $5,000 within 30 days on an account with zero prior wire history', icon: 'dollar' },
      { title: 'Credit Line Exploitation', body: 'Credit utilization jumping +50 percentage points, followed immediately by a wire to a crypto exchange', icon: 'shield' },
      { title: 'Blacklisted Exchange', body: 'Destination exchange matching FinCEN\'s unregistered MSB list or a known scam wallet cluster registry', icon: 'eye' },
    ],
  },

  'EFE-Exploit': {
    categoryId: 'EFE-Exploit',
    summary: 'Elder financial exploitation is one of the fastest-growing financial crime categories, with $28.3 billion in annual US losses. Victims aged 60+ rarely self-report, making proactive monitoring by financial institutions the primary detection mechanism.',
    stats: [
      { value: '60+', label: 'Elder age threshold (years)' },
      { value: '> $3K', label: 'Cash cluster in 7 days' },
      { value: '30 days', label: 'Auth-user event window' },
      { value: '$28.3B', label: 'Annual US losses' },
    ],
    signals: [
      { title: 'Elder Age Overlay', body: 'Account holder aged 60+ with spend pattern changes exceeding 2× their 90-day baseline in any category', icon: 'users' },
      { title: 'Cash Withdrawal Cluster', body: '3 or more ATM withdrawals totaling over $3,000 in any 7-day window on a historically low-cash account', icon: 'dollar' },
      { title: 'New Authorized User', body: 'New joint holder or authorized user added, followed by a large withdrawal or wire within 30 days', icon: 'network' },
      { title: 'First-Ever Wire Transfer', body: 'First outbound wire to an unknown payee from a long-established elder account — cross-check against exploitation registries', icon: 'zap' },
      { title: 'Geographic Inconsistency', body: 'Transactions in locations inconsistent with the cardholder\'s established patterns — may indicate proxy access by an exploiter', icon: 'map' },
    ],
  },

  'DF-Identity': {
    categoryId: 'DF-Identity',
    summary: 'AI-generated deepfake videos and synthetic identity documents are defeating biometric KYC checks at account opening. A single threat actor can open accounts at six institutions in seven days using the same automated toolchain — detectable only through cross-institution device fingerprint sharing.',
    stats: [
      { value: '< 85%', label: 'Biometric confidence flag' },
      { value: '> $5K', label: 'Wire after device change' },
      { value: '72 hrs', label: 'Device-to-wire window' },
      { value: '7 days', label: 'Account farm detection' },
    ],
    signals: [
      { title: 'Low Biometric Confidence', body: 'Liveness detection score below 85% at account opening — consistent with deepfake video injection during KYC', icon: 'eye' },
      { title: 'Device Change → Wire', body: 'New device enrolled on an existing account, followed by an outbound wire over $5,000 within 72 hours', icon: 'fingerprint' },
      { title: 'Synthetic Identity Indicators', body: 'SSN issue date inconsistent with the applicant\'s stated age; no continuous credit file prior to 12 months', icon: 'shield' },
      { title: 'New Account Velocity', body: 'Account less than 30 days old receiving inbound deposits and immediately forwarding outbound transfers', icon: 'zap' },
      { title: 'Cross-Institution Device Farm', body: 'Same device fingerprint used to open or access accounts at 3+ institutions within a 7-day window', icon: 'network' },
    ],
  },
}
