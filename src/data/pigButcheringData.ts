// Pig Butchering / Crypto Investment Scam — case data and agent definitions

export interface PBAgent {
  id: string
  name: string
  rule: string
  description: string
  scanCount: string
  scanLabel: string
}

export interface PBCoTStep {
  text: string
  metric?: string
  threshold?: string
  triggered: boolean
}

export interface PBFinding {
  agentId: string
  caseId: string
  steps: PBCoTStep[]
  finding: string
  confidence: number
  verdict: 'FLAGGED' | 'REVIEW' | 'PASS'
}

export interface PBEvent {
  day: number
  phase: 'grooming' | 'attack'
  type: 'contact' | 'test-deposit' | 'wire' | 'credit-advance' | 'blocked' | 'fraud-report'
  label: string
  detail: string
  amount?: number
}

export interface PBCase {
  id: string
  cardholderLabel: string
  cardholderAge: number
  occupation: string
  startDate: string
  groomingPlatform: string
  groomingPersona: string
  groomingDays: number
  firstAttackDay: number
  totalLost: number
  totalBlocked: number
  riskScore: number
  cardType: string
  cardVintage: string
  creditLimit: number
  avgMonthlySpend: number
  creditUtilBefore: number
  creditUtilPeak: number
  flaggedCategories: string[]
  crossCaseLinks: string[]
  events: PBEvent[]
}

export const PB_FINCEN: Record<string, { label: string; url: string }> = {
  'FIN-2023-Alert001': {
    label: 'FinCEN Alert on Pig Butchering / Crypto Investment Scams',
    url: 'https://www.fincen.gov/sites/default/files/2023-09/FinCEN%20Alert%20FIN-2023-Alert001.pdf',
  },
  'FIN-2022-A001': {
    label: 'FinCEN Advisory on Romance Scams and Money Mules',
    url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2022-a001',
  },
}

export const PB_AGENTS: PBAgent[] = [
  {
    id: 'pb-crypto',
    name: 'Crypto Signal Analyst',
    rule: 'PB-1',
    description: 'First-ever MCC 6051 appearance, test deposit escalation, baseline disruption detection',
    scanCount: '47,823',
    scanLabel: 'cardholders',
  },
  {
    id: 'pb-velocity',
    name: 'Transfer Velocity Analyst',
    rule: 'PB-2',
    description: 'Wire velocity vs history, credit utilization spike, credit-advance-to-wire sequence',
    scanCount: '47,823',
    scanLabel: 'cardholders',
  },
  {
    id: 'pb-network',
    name: 'Exchange Network Analyst',
    rule: 'PB-3',
    description: 'Cross-victim wallet convergence, unregistered MSB detection, scam exchange blacklist matching',
    scanCount: '47,823',
    scanLabel: 'cardholders',
  },
  {
    id: 'pb-strategist',
    name: 'Case Strategist',
    rule: 'All',
    description: 'Synthesizes all PB signals, elder overlay, cross-case network, SAR-PB recommendation',
    scanCount: '2',
    scanLabel: 'active cases',
  },
]

export const PB_CASES: PBCase[] = [
  {
    id: 'PB-001',
    cardholderLabel: 'CAP-007214',
    cardholderAge: 44,
    occupation: 'Secondary School Teacher',
    startDate: '2026-01-15',
    groomingPlatform: 'LinkedIn',
    groomingPersona: '"James Wei" — FX/Crypto Portfolio Manager, Hong Kong',
    groomingDays: 68,
    firstAttackDay: 69,
    totalLost: 47200,
    totalBlocked: 12000,
    riskScore: 96,
    cardType: 'Platinum Rewards Visa',
    cardVintage: '6 years, 4 months',
    creditLimit: 28000,
    avgMonthlySpend: 2100,
    creditUtilBefore: 0.14,
    creditUtilPeak: 0.97,
    flaggedCategories: ['FIN-2023-Alert001', 'FIN-2022-A001'],
    crossCaseLinks: ['PB-002'],
    events: [
      { day: 1,  phase: 'grooming', type: 'contact',       label: 'First contact',    detail: 'LinkedIn connection request from "James Wei", FX Portfolio Manager. Pivots immediately to WhatsApp — claims LinkedIn DMs are "monitored by compliance."', },
      { day: 45, phase: 'grooming', type: 'test-deposit',  label: 'Test deposit ×1',  detail: 'First crypto exchange deposit to CoinTrack. "Opening your portfolio — just a small amount to start." Victim shown fabricated +31% return within days.', amount: 150 },
      { day: 58, phase: 'grooming', type: 'test-deposit',  label: 'Test deposit ×2',  detail: 'Second CoinTrack deposit. Victim shown fabricated portfolio value of $521. Scammer introduces "CryptoVault Pro" — a higher-yield proprietary platform.', amount: 350 },
      { day: 65, phase: 'grooming', type: 'test-deposit',  label: 'Test deposit ×3',  detail: 'Third deposit to CoinTrack. Victim now sees fabricated $2,180 "balance." Scammer recommends moving funds to CryptoVault Pro for 22% monthly yield.', amount: 950 },
      { day: 69, phase: 'attack',   type: 'wire',          label: '1st wire',         detail: 'Wire transfer to CryptoVault Pro (unregistered MSB). Platform shows fabricated $11,200 "portfolio value" within 4 days to build confidence.', amount: 8000 },
      { day: 75, phase: 'attack',   type: 'wire',          label: '2nd wire',         detail: 'Victim sends more after scammer warns of a "limited-time compound rate." Platform dashboard now shows $32,400 in fabricated returns.', amount: 15200 },
      { day: 81, phase: 'attack',   type: 'credit-advance',label: 'Credit advance',   detail: 'Victim takes $24K cash advance (97% utilization) after scammer says "withdrawal window closes in 48 hours — reinvest now to lock gains."', amount: 24000 },
      { day: 81, phase: 'attack',   type: 'wire',          label: '3rd wire',         detail: 'Same-day wire using credit advance proceeds to CryptoVault Pro. Platform now shows fabricated $89,000 "portfolio value."', amount: 24000 },
      { day: 86, phase: 'attack',   type: 'blocked',       label: 'Transfer blocked', detail: 'Capital One flagged and blocked $12,000 attempted wire. Scammer instructs victim to call the bank and dispute the hold as "a mistake."', amount: 12000 },
      { day: 89, phase: 'attack',   type: 'fraud-report',  label: 'Fraud report',     detail: 'Victim discovers scam when attempting to withdraw from CryptoVault Pro — platform demands a 15% "tax payment" before release. Files fraud report.' },
    ],
  },
  {
    id: 'PB-002',
    cardholderLabel: 'CAP-011847',
    cardholderAge: 62,
    occupation: 'Retired',
    startDate: '2026-02-03',
    groomingPlatform: 'Facebook Dating',
    groomingPersona: '"Dr. Sarah Chen" — Petroleum Engineer, Dubai',
    groomingDays: 52,
    firstAttackDay: 48,
    totalLost: 23400,
    totalBlocked: 0,
    riskScore: 88,
    cardType: 'Cash Back Mastercard',
    cardVintage: '11 years, 2 months',
    creditLimit: 22000,
    avgMonthlySpend: 1800,
    creditUtilBefore: 0.31,
    creditUtilPeak: 0.88,
    flaggedCategories: ['FIN-2023-Alert001', 'FIN-2022-A001'],
    crossCaseLinks: ['PB-001'],
    events: [
      { day: 1,  phase: 'grooming', type: 'contact',      label: 'First contact',   detail: 'Facebook Dating match with "Dr. Sarah Chen", offshore petroleum engineer. Emotional relationship develops rapidly. Moves to WhatsApp video calls.' },
      { day: 38, phase: 'grooming', type: 'test-deposit', label: 'Test deposit ×1', detail: '"Sarah" teaches victim to open a TrustFinance account. Small deposit to "learn the system together." Victim shown fabricated 28% return.', amount: 200 },
      { day: 44, phase: 'grooming', type: 'test-deposit', label: 'Test deposit ×2', detail: 'Victim adds to position. TrustFinance shows $768 balance on $600 invested. Scammer encourages investing more "before the quarterly window closes."', amount: 400 },
      { day: 48, phase: 'attack',   type: 'wire',         label: '1st wire',        detail: 'Wire to TrustFinance (same wallet cluster as PB-001 CryptoVault Pro). Scammer reassures victim this is "their future together."', amount: 6200 },
      { day: 54, phase: 'attack',   type: 'wire',         label: '2nd wire',        detail: 'Final wire — victim exhausts remaining credit headroom. Scammer warns "market closes tonight." $0 credit available post-transfer.', amount: 16600 },
      { day: 57, phase: 'attack',   type: 'fraud-report', label: 'Fraud report',    detail: 'TrustFinance demands a $4,700 "insurance fee" before allowing withdrawal. Victim contacts their bank. Funds are untraceable. "Dr. Sarah Chen" disappears.' },
    ],
  },
]

export const PB_FINDINGS: PBFinding[] = [
  // ── PB-001 ───────────────────────────────────────────────────────────────────────
  {
    agentId: 'pb-crypto', caseId: 'PB-001',
    steps: [
      { text: 'Detect first-ever MCC 6051 (crypto exchange) appearance on account history', metric: 'Day 45 — first crypto txn in 76-month account history', threshold: 'First MCC 6051 occurrence', triggered: true },
      { text: 'Check test deposit escalation: geometric growth across ≥ 2 deposits', metric: '3 deposits: $150 → $350 → $950 (6.3× growth in 20 days)', threshold: '≥ 2 deposits, growth ratio ≥ 2×', triggered: true },
      { text: 'Flag baseline disruption vs peer cohort (MCC 6051 frequency)', metric: '0 crypto txns in 76mo → 3 in 20 days (peer: 0.2/mo avg)', threshold: 'Disruption Z-score ≥ 3σ', triggered: true },
    ],
    finding: 'First-ever crypto exchange activity after 76 months of clean spend. Test deposit escalation ($150 → $950, 6.3×) matches documented pig butchering grooming sequence in FIN-2023-Alert001.',
    confidence: 89, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-velocity', caseId: 'PB-001',
    steps: [
      { text: 'Compute wire transfer velocity vs 6-month historical baseline', metric: '$47,200 wired in 17 days vs $0 prior wire history', threshold: 'Wire > $5K within 30 days', triggered: true },
      { text: 'Check credit utilization spike over attack window', metric: '14% → 97% credit utilization (+83pp in 12 days)', threshold: '≥ 50pp spike in 30 days', triggered: true },
      { text: 'Detect cash advance → same-day wire transfer sequence', metric: 'Day 81: $24K credit advance → $24K wire (same day)', threshold: 'Cash advance → wire within 24hrs', triggered: true },
      { text: 'Screen for structuring below CTR threshold ($10,000)', metric: 'Wires: $8K, $15.2K, $24K — no structuring pattern detected', threshold: '< $10K clustering check', triggered: false },
    ],
    finding: '$47,200 wired in 17 days from account with zero wire history in 76 months. 97% credit utilization reached. Cash advance-to-wire sequence on Day 81 confirms coerced fund extraction.',
    confidence: 95, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-network', caseId: 'PB-001',
    steps: [
      { text: 'Resolve destination exchange to known scam wallet cluster', metric: 'CryptoVault Pro → Wallet cluster 0x7f3a…c42d — FinCEN blacklist match', threshold: 'Blacklisted exchange registry', triggered: true },
      { text: 'Cross-reference receiving wallet vs active PB cases in portfolio', metric: 'PB-002 (CAP-011847) wired to same wallet cluster via TrustFinance', threshold: '≥ 2 victims, same exchange infrastructure', triggered: true },
      { text: 'Verify exchange FinCEN MSB registration status', metric: 'CryptoVault Pro — unregistered Money Services Business', threshold: 'MSB registration required for crypto transfers ≥ $1K', triggered: true },
    ],
    finding: 'CryptoVault Pro resolves to blacklisted scam wallet cluster 0x7f3a…c42d. PB-002 used same infrastructure via a different brand name (TrustFinance). Confirmed cross-victim pig butchering network. Exchange is unregistered MSB.',
    confidence: 97, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-strategist', caseId: 'PB-001',
    steps: [
      { text: 'Aggregate: Crypto Signal ● Velocity ● Exchange Network — all FLAGGED', metric: '3 of 3 detection agents FLAGGED', threshold: '≥ 2 agents FLAGGED', triggered: true },
      { text: 'Verify FIN-2023-Alert001 pig butchering pattern indicators', metric: '4 of 4 FinCEN alert indicators confirmed', threshold: '≥ 3 indicators', triggered: true },
      { text: 'Cross-case link: PB-001 ↔ PB-002 share wallet cluster — same scam network', metric: 'Joint SAR-PB filing recommended with PB-002', threshold: 'Any shared scam infrastructure', triggered: true },
      { text: 'Elder financial exploitation overlay (victim age check)', metric: 'Age 44 — below EFE threshold; victim advocacy referral still recommended', threshold: 'Age ≥ 60 for EFE overlay', triggered: false },
    ],
    finding: 'Confirmed pig butchering. $47,200 victim loss ($12K transfer blocked). Cross-case exchange network confirmed with PB-002. SAR-PB + FinCEN MSB referral recommended. Victim advocacy services notified.',
    confidence: 96, verdict: 'FLAGGED',
  },

  // ── PB-002 ───────────────────────────────────────────────────────────────────────
  {
    agentId: 'pb-crypto', caseId: 'PB-002',
    steps: [
      { text: 'Detect first-ever MCC 6051 on account history', metric: 'Day 38 — first crypto txn in 134-month (11yr) account history', threshold: 'First MCC 6051 occurrence', triggered: true },
      { text: 'Check test deposit escalation across crypto deposits', metric: '2 deposits: $200 → $400 (2× growth in 6 days)', threshold: '≥ 2 deposits, growth ratio ≥ 2×', triggered: true },
      { text: 'Flag baseline disruption vs peer cohort', metric: '0 crypto txns in 134mo → 2 in 6 days (peer: 0.1/mo avg)', threshold: 'Disruption Z-score ≥ 3σ', triggered: true },
    ],
    finding: 'First crypto activity in 11-year account. Rapid 6-day test deposit sequence consistent with pig butchering grooming. Victim age 62 triggers elder financial exploitation cross-screen.',
    confidence: 84, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-velocity', caseId: 'PB-002',
    steps: [
      { text: 'Compute wire transfer velocity vs 6-month baseline', metric: '$22,800 wired in 6 days vs $0 prior wire history', threshold: 'Wire > $5K within 30 days', triggered: true },
      { text: 'Check credit utilization spike over attack window', metric: '31% → 88% utilization (+57pp in 6 days)', threshold: '≥ 50pp spike in 30 days', triggered: true },
      { text: 'Detect limit-exhausting wire pattern', metric: 'Day 54: $16.6K wire consumed all remaining available credit', threshold: 'Credit-limit wire', triggered: true },
      { text: 'Screen for structuring', metric: 'Wires $6.2K and $16.6K — no structuring pattern', threshold: '< $10K clustering check', triggered: false },
    ],
    finding: '$22,800 wired in 6 days with zero wire history in 134 months. 88% peak utilization. Final wire exhausted remaining credit headroom entirely. Coerced extraction pattern confirmed.',
    confidence: 91, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-network', caseId: 'PB-002',
    steps: [
      { text: 'Resolve destination exchange to known scam wallet cluster', metric: 'TrustFinance → same wallet cluster 0x7f3a…c42d as PB-001 CryptoVault Pro', threshold: 'Blacklisted exchange registry', triggered: true },
      { text: 'Cross-reference receiving wallet vs active PB cases', metric: 'PB-001 (CAP-007214) is co-victim — same scam operation, different brand name', threshold: '≥ 2 victims, same exchange infrastructure', triggered: true },
      { text: 'Verify exchange MSB registration', metric: 'TrustFinance Platform — unregistered, no FinCEN registration found', threshold: 'MSB registration required', triggered: true },
    ],
    finding: 'TrustFinance routes to same blacklisted wallet cluster (0x7f3a…c42d) as PB-001 CryptoVault Pro. Two victims, same scam network using different brand names. Unregistered MSB confirmed.',
    confidence: 96, verdict: 'FLAGGED',
  },
  {
    agentId: 'pb-strategist', caseId: 'PB-002',
    steps: [
      { text: 'Aggregate: Crypto Signal ● Velocity ● Exchange Network — all FLAGGED', metric: '3 of 3 agents FLAGGED', threshold: '≥ 2 FLAGGED', triggered: true },
      { text: 'Verify FIN-2023-Alert001 indicators', metric: '4 of 4 FinCEN alert indicators triggered', threshold: '≥ 3 indicators', triggered: true },
      { text: 'Elder financial exploitation overlay — victim age 62', metric: 'Age ≥ 60 confirmed — dual SAR-PB + SAR-EFE consideration triggered', threshold: 'Age ≥ 60', triggered: true },
    ],
    finding: 'Confirmed pig butchering. $23,400 victim loss (no funds recovered). Victim age 62 triggers EFE overlay — dual SAR-PB + SAR-EFE filing recommended. Joint filing with PB-001.',
    confidence: 91, verdict: 'FLAGGED',
  },
]

export function pbFindingsForCase(caseId: string): PBFinding[] {
  return PB_FINDINGS.filter(f => f.caseId === caseId)
}
