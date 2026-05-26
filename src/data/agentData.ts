export interface AgentDef {
  id: string
  name: string
  htRule: string
  description: string
  scanCount: string
  scanLabel: string
  appliesTo: ('cardholder' | 'merchant' | 'cluster')[]
}

export interface CoTStep {
  text: string
  metric?: string
  threshold?: string
  triggered: boolean
}

export interface AgentFinding {
  agentId: string
  caseId: string
  steps: CoTStep[]
  finding: string
  confidence: number
  verdict: 'FLAGGED' | 'REVIEW' | 'PASS'
}

export const AGENTS: AgentDef[] = [
  {
    id: 'mcc',
    name: 'MCC Analyst',
    htRule: 'HT-1',
    description: 'Trafficking MCC ratios, hotel→cash sequences, multi-issuer BIN clustering',
    scanCount: '47,823',
    scanLabel: 'cardholders',
    appliesTo: ['cardholder', 'cluster'],
  },
  {
    id: 'cash',
    name: 'Cash Flow Analyst',
    htRule: 'HT-2',
    description: 'ATM velocity, prepaid reload patterns, structuring below CTR threshold',
    scanCount: '47,823',
    scanLabel: 'cardholders',
    appliesTo: ['cardholder', 'cluster'],
  },
  {
    id: 'movement',
    name: 'Movement Analyst',
    htRule: 'HT-3',
    description: 'Corridor route matching, impossible-travel, venue nexus detection',
    scanCount: '47,823',
    scanLabel: 'cardholders',
    appliesTo: ['cardholder'],
  },
  {
    id: 'timing',
    name: 'Timing Analyst',
    htRule: 'HT-4',
    description: 'After-hours transaction ratio vs MCC peer benchmark',
    scanCount: '8,412',
    scanLabel: 'merchants',
    appliesTo: ['merchant'],
  },
  {
    id: 'entity',
    name: 'Entity Analyst',
    htRule: 'HT-5',
    description: 'Front-business scoring: volume, CNP rate, chargeback absence, commercial match',
    scanCount: '8,412',
    scanLabel: 'merchants',
    appliesTo: ['merchant'],
  },
  {
    id: 'network',
    name: 'Network Analyst',
    htRule: 'HT-6',
    description: 'Device fingerprint clustering, session IP × terminal IP cross-match',
    scanCount: '12,941',
    scanLabel: 'accounts',
    appliesTo: ['cluster'],
  },
  {
    id: 'strategist',
    name: 'Case Strategist',
    htRule: 'All',
    description: 'Synthesizes all agent signals → final risk verdict and SAR recommendation',
    scanCount: '5',
    scanLabel: 'active cases',
    appliesTo: ['cardholder', 'merchant', 'cluster'],
  },
]

export const AGENT_FINDINGS: AgentFinding[] = [
  // ── CORR-001 ──────────────────────────────────────────────────────────────────
  {
    agentId: 'mcc', caseId: 'CORR-001',
    steps: [
      { text: 'Compute trafficking MCC ratio over rolling 30 days', metric: '85% in HT MCCs', threshold: '> 70%', triggered: true },
      { text: 'Scan for hotel → ATM/prepaid sequences within 4-hr city windows', metric: '6 sequences detected', threshold: '≥ 2', triggered: true },
      { text: 'Check cross-issuer BIN clustering at shared merchant IDs', metric: '8–14 BINs at 5 properties', threshold: '≥ 8 BINs', triggered: true },
    ],
    finding: 'MCC ratio 85% with 6 hotel→ATM sequences. Cross-issuer BIN clustering confirmed at all 5 hotel stops.',
    confidence: 94, verdict: 'FLAGGED',
  },
  {
    agentId: 'cash', caseId: 'CORR-001',
    steps: [
      { text: 'Aggregate ATM cash advances (MCC 6010) + prepaid reloads (MCC 6540)', metric: '$3,200 total cash-equivalent', threshold: 'Cash velocity ≥ 55%', triggered: true },
      { text: 'Compute cash velocity ratio over 30-day window', metric: '64% cash-equivalent spend', threshold: '≥ 55%', triggered: true },
      { text: 'Check for structuring — 3+ cash txns $3K–$9.9K within 7 days', metric: 'Distributed — no single txn > $3K', threshold: 'Pattern check', triggered: false },
    ],
    finding: 'Cash velocity 64% across 6 corridor stops. $3,200 ATM + prepaid reload distributed at each hotel stop.',
    confidence: 91, verdict: 'FLAGGED',
  },
  {
    agentId: 'movement', caseId: 'CORR-001',
    steps: [
      { text: 'Build movement timeline from merchant city/state per transaction', metric: '6 cities in 18 days', threshold: '≥ 4 cities in ≤ 14 days', triggered: true },
      { text: 'Match city sequence against documented corridor routes', metric: 'Boston→Providence→NYC→Philadelphia→Baltimore→DC = I-95 match', threshold: 'Route segment match', triggered: true },
      { text: 'Check for impossible-travel events (same-day, >200 miles)', metric: 'Sequential stops — no impossible travel', threshold: '0 events', triggered: false },
      { text: 'Venue nexus — same merchant hosting distinct cardholder groups', metric: '5 hotel properties flagged as repeat venues', threshold: '≥ 3 events in 45 days', triggered: true },
    ],
    finding: '6 cities in 18 days on the I-95 corridor. All 5 hotel stops are confirmed repeat multi-issuer venues.',
    confidence: 96, verdict: 'FLAGGED',
  },
  {
    agentId: 'network', caseId: 'CORR-001',
    steps: [
      { text: 'Check device fingerprint sharing across CAP-004821 session logs', metric: 'No shared device FP on primary cardholder', threshold: 'Cluster ≥ 3 accounts', triggered: false },
      { text: 'Verify multi-BIN convergence at hotel terminals (90-min windows)', metric: '8–14 distinct issuer BINs per hotel per night', threshold: '≥ 6 issuers', triggered: true },
    ],
    finding: 'Multi-BIN convergence at all 5 hotel stops. No device fingerprint cluster on primary cardholder — corridor is the signal.',
    confidence: 87, verdict: 'REVIEW',
  },
  {
    agentId: 'strategist', caseId: 'CORR-001',
    steps: [
      { text: 'Aggregate agent verdicts: MCC ● Cash ● Movement FLAGGED · Network REVIEW', metric: '3 FLAGGED, 1 REVIEW', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Cross-reference open cases for shared cardholders or merchants', metric: 'FRONT-002 cross-reference: 3 cardholders + terminal IP overlap', threshold: 'Any active cross-case link', triggered: true },
      { text: 'Count FinCEN categories triggered: 14-MCC + 14-Cash + 14-Geo', metric: '3 of 6 FinCEN categories confirmed', threshold: '≥ 2 categories', triggered: true },
      { text: 'Determine SAR type and priority', metric: 'SAR-HT — 30-day filing clock started 2024-11-14', threshold: 'Escalate', triggered: true },
    ],
    finding: 'Probable human trafficking corridor. Coordinated multi-card, multi-issuer movement. SAR-HT filing recommended.',
    confidence: 94, verdict: 'FLAGGED',
  },

  // ── CORR-002 ──────────────────────────────────────────────────────────────────
  {
    agentId: 'mcc', caseId: 'CORR-002',
    steps: [
      { text: 'Compute trafficking MCC ratio over rolling 30 days', metric: '80% in HT MCCs', threshold: '> 70%', triggered: true },
      { text: 'Scan for hotel → ATM/prepaid sequences within 4-hr windows', metric: '4 sequences detected', threshold: '≥ 2', triggered: true },
      { text: 'Cross-issuer BIN clustering at shared merchants', metric: '6–11 BINs at 2 properties', threshold: '≥ 8 BINs', triggered: false },
    ],
    finding: 'MCC ratio 80% with 4 hotel→ATM sequences. BIN clustering present but below peak threshold at 2 merchants.',
    confidence: 87, verdict: 'FLAGGED',
  },
  {
    agentId: 'cash', caseId: 'CORR-002',
    steps: [
      { text: 'Aggregate ATM + prepaid reloads over 30-day window', metric: '$2,200 ($1,200 ATM + $1,000 prepaid)', threshold: 'Cash velocity ≥ 55%', triggered: true },
      { text: 'Compute cash velocity ratio', metric: '63% cash-equivalent spend', threshold: '≥ 55%', triggered: true },
      { text: 'Account vintage check — new account, no spend baseline', metric: 'Account opened 34 days ago', threshold: 'New-account corridor entry', triggered: true },
    ],
    finding: 'Cash velocity 63%. New account (34 days) entering corridor pattern immediately — no legitimate spend baseline.',
    confidence: 88, verdict: 'FLAGGED',
  },
  {
    agentId: 'movement', caseId: 'CORR-002',
    steps: [
      { text: 'Build movement timeline from merchant location data', metric: '5 cities in 10 days', threshold: '≥ 4 cities in ≤ 14 days', triggered: true },
      { text: 'Match city sequence to documented trafficking corridor routes', metric: 'Houston→Beaumont→New Orleans→Mobile→Jacksonville = I-10 Southern', threshold: 'Route segment match', triggered: true },
      { text: 'Check Beaumont property MID-0001102 for repeat venue events', metric: '3rd distinct cardholder group at same merchant in 45 days', threshold: '≥ 3 events in 45 days', triggered: true },
    ],
    finding: '5 cities in 10 days on I-10 Southern. Beaumont property confirmed as 3rd repeat trafficking venue event in 45 days.',
    confidence: 93, verdict: 'FLAGGED',
  },
  {
    agentId: 'strategist', caseId: 'CORR-002',
    steps: [
      { text: 'Aggregate agent verdicts: MCC ● Cash ● Movement FLAGGED', metric: '3 FLAGGED', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Apply new-account amplifier — no spend seasoning entering corridor', metric: 'Account age 34 days + full corridor pattern', triggered: true },
      { text: 'Venue nexus: MID-0001102 (Beaumont) flagged as systemic trafficking venue', metric: '3rd distinct group — venue-level investigation recommended', triggered: true },
    ],
    finding: 'I-10 Southern corridor. New account fast-tracked into controlled movement. Venue-level SAR recommended for Beaumont property.',
    confidence: 87, verdict: 'FLAGGED',
  },

  // ── CTRL-001 ──────────────────────────────────────────────────────────────────
  {
    agentId: 'mcc', caseId: 'CTRL-001',
    steps: [
      { text: 'Compute MCC ratio across all 4 accounts in the device fingerprint cluster', metric: 'All 4 accounts: > 75% hotel + ATM MCCs', threshold: '> 70%', triggered: true },
      { text: 'Detect hotel → ATM sequences across cluster accounts', metric: 'Each account: hotel→ATM within 20 minutes', threshold: '≥ 2 per account', triggered: true },
    ],
    finding: 'All 4 cluster accounts show identical MCC concentration and hotel→ATM sequences — coordinated controller behavior.',
    confidence: 97, verdict: 'FLAGGED',
  },
  {
    agentId: 'cash', caseId: 'CTRL-001',
    steps: [
      { text: 'Aggregate cash-out across device-clustered accounts', metric: '$14,200 combined (4 Cap One accounts, 21 days)', threshold: 'Controller network threshold', triggered: true },
      { text: 'Check for distributed structuring across linked accounts', metric: 'Each account $2,700–$4,100 — distributed to avoid per-account CTR', threshold: 'Cross-account structuring', triggered: true },
    ],
    finding: '$14,200 combined cash-out. Amounts distributed across 4 accounts to stay below CTR threshold per account.',
    confidence: 95, verdict: 'FLAGGED',
  },
  {
    agentId: 'network', caseId: 'CTRL-001',
    steps: [
      { text: 'Cluster accounts by device fingerprint similarity (DBSCAN, 95% threshold)', metric: 'FP-7a3c9d2e1b4f8a0c shared by 4 accounts — p < 0.001%', threshold: '≥ 3 accounts in cluster', triggered: true },
      { text: 'Extract session IPs from authenticated login events for cluster accounts', metric: 'IP 192.168.44.17 across 3 accounts, 10:45 PM–12:15 AM', threshold: 'Same IP, multiple accounts', triggered: true },
      { text: 'Cross-match session IP against Discover merchant terminal registry', metric: 'IP 192.168.44.17 at MID-0001872 + MID-0002341 terminals', threshold: 'Session IP = terminal IP', triggered: true },
      { text: 'Compute multi-BIN convergence at shared merchants (90-min windows, 7 nights)', metric: '6 distinct issuers across 9 cards at 3 merchants', threshold: '≥ 6 distinct issuers', triggered: true },
    ],
    finding: 'One controller (IP 192.168.44.17) operating 9 accounts from 6 banks. Device FP + terminal IP cross-match definitively confirmed.',
    confidence: 98, verdict: 'FLAGGED',
  },
  {
    agentId: 'strategist', caseId: 'CTRL-001',
    steps: [
      { text: 'Aggregate: MCC ● Cash ● Network all FLAGGED', metric: '3 FLAGGED agents', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Confirm multi-institution scope', metric: '6 issuers: Cap One, Discover, Chase, WF, US Bank, Citi', triggered: true },
      { text: 'Classify typology: FIN-2020-A008 Typology 3 (Funnel Accounts)', metric: '$28,400 total cash-out, 21 days, 9 accounts', triggered: true },
    ],
    finding: 'CRITICAL — 9-account controller network confirmed. One operator, 6 banks, $28,400. SAR-HT + Money Mule filing.',
    confidence: 97, verdict: 'FLAGGED',
  },

  // ── FRONT-001 ─────────────────────────────────────────────────────────────────
  {
    agentId: 'timing', caseId: 'FRONT-001',
    steps: [
      { text: 'Compute hourly transaction distribution over 30-day window', metric: '84% of $182K volume between 10 PM–4 AM', threshold: 'Night ratio vs MCC peer', triggered: true },
      { text: 'Compare against MCC 7297 peer benchmark (Las Vegas)', metric: '5.6× peer night ratio (84% vs 15% peer avg)', threshold: '≥ 2× peer', triggered: true },
      { text: 'Check consistency with declared business hours (9 AM–7 PM)', metric: 'Zero activity during declared hours on 6 of 14 days', threshold: 'Consistency check', triggered: true },
    ],
    finding: '84% of volume after 10 PM — 5.6× MCC peer. Zero daytime activity on 6 of 14 days.',
    confidence: 98, verdict: 'FLAGGED',
  },
  {
    agentId: 'entity', caseId: 'FRONT-001',
    steps: [
      { text: 'Compare monthly volume against MCC 7297 city-adjusted peer median', metric: '$182K vs $28K peer (6.5×)', threshold: '> 2.5× peer', triggered: true },
      { text: 'Compute card-not-present rate for declared in-person MCC', metric: '91% CNP for a declared day spa', threshold: '> 70% CNP for in-person MCC', triggered: true },
      { text: 'Check chargeback absence over 6+ month window', metric: '0.00% chargeback rate over 14 months', threshold: '< 0.2% = anomaly', triggered: true },
      { text: 'Cross-reference legal entity against commercial borrower registry', metric: 'Sunrise Wellness Group LLC → $750K credit facility (COMM-00312)', threshold: 'Any commercial match', triggered: true },
    ],
    finding: '4/4 front-business flags triggered. $750K commercial exposure cross-matched to anomalous merchant entity.',
    confidence: 99, verdict: 'FLAGGED',
  },
  {
    agentId: 'strategist', caseId: 'FRONT-001',
    steps: [
      { text: 'Aggregate: Timing ● Entity both FLAGGED', metric: '2 FLAGGED agents, 4/4 front-business sub-flags', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Confirm cross-institution exposure', metric: 'Same legal entity: $750K credit (Cap One) + $182K/month processing (Discover network)', triggered: true },
      { text: 'Classify: FIN-2020-A008 Typology 1 (Front Company)', metric: 'Front-business score 4/4 — immediate escalation', triggered: true },
    ],
    finding: 'Probable front operation. $750K credit exposure linked to same entity Discover flags as statistically impossible legitimate business.',
    confidence: 96, verdict: 'FLAGGED',
  },

  // ── FRONT-002 ─────────────────────────────────────────────────────────────────
  {
    agentId: 'timing', caseId: 'FRONT-002',
    steps: [
      { text: 'Compute after-hours ratio for MCC 4121 (taxicab/rideshare)', metric: '79% of $94K volume between 10 PM–5 AM', threshold: '≥ 2× MCC peer', triggered: true },
      { text: 'Compare against MCC 4121 peer night-hour benchmark', metric: '4.4× peer (79% vs 18% peer avg)', threshold: '≥ 2× peer', triggered: true },
    ],
    finding: '79% of volume concentrated after 10 PM — 4.4× MCC peer benchmark for rideshare.',
    confidence: 91, verdict: 'FLAGGED',
  },
  {
    agentId: 'entity', caseId: 'FRONT-002',
    steps: [
      { text: 'Compare monthly volume vs MCC 4121 city-adjusted peer median', metric: '$94K vs $31K peer (3.0×)', threshold: '> 2.5× peer', triggered: true },
      { text: 'Compute CNP rate for declared in-person car service', metric: '97% CNP — no physical terminal usage in 9 months', threshold: '> 70% for in-person MCC', triggered: true },
      { text: 'Check chargeback rate over 6+ months', metric: '0.20% — marginal, not triggered', threshold: '< 0.2%', triggered: false },
      { text: 'Cross-reference cardholder roster against active SARs', metric: '3 cardholders also in active CORR-001 corridor case', threshold: 'Active SAR cross-match', triggered: true },
    ],
    finding: '3/4 front-business flags. 3 cardholders cross-reference to CORR-001 corridor case.',
    confidence: 90, verdict: 'FLAGGED',
  },
  {
    agentId: 'strategist', caseId: 'FRONT-002',
    steps: [
      { text: 'Aggregate: Timing ● Entity both FLAGGED', metric: '2 FLAGGED agents, 3/4 front-business sub-flags', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Cross-case cardholder link to CORR-001 corridor pattern confirmed', metric: '3 shared cardholders + terminal IP subnet overlap with corridor hotels', triggered: true },
      { text: 'Classify: FIN-2020-A008 Typology 1 + cross-case transport link', metric: 'SAR-HT joint filing with CORR-001 recommended', triggered: true },
    ],
    finding: 'Controlled transport service linked to I-95 corridor trafficking network. Joint SAR-HT with CORR-001.',
    confidence: 88, verdict: 'FLAGGED',
  },
]

// Derived helpers
export function findingsForCase(caseId: string): AgentFinding[] {
  return AGENT_FINDINGS.filter(f => f.caseId === caseId)
}

export function hitCasesForAgent(agentId: string): string[] {
  return [...new Set(AGENT_FINDINGS.filter(f => f.agentId === agentId).map(f => f.caseId))]
}
