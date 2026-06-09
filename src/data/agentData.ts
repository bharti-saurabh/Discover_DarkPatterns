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

// ── Artifact type system ───────────────────────────────────────────────────────

export interface ArtifactTableColumn { label: string; right?: boolean; mono?: boolean }
export interface ArtifactTableRow { cells: (string | number)[]; flagged?: boolean; muted?: boolean }
export interface TableArtifact {
  type: 'table'
  title: string
  subtitle?: string
  columns: ArtifactTableColumn[]
  rows: ArtifactTableRow[]
  note?: string
}

export interface MetricItem { label: string; value: string; peer?: string; delta?: string; flagged?: boolean }
export interface MetricGridArtifact {
  type: 'metric-grid'
  title: string
  cols?: 2 | 3 | 4
  metrics: MetricItem[]
}

export interface IntelItem { text: string; detail?: string; flagged?: boolean }
export interface IntelListArtifact {
  type: 'intel-list'
  title: string
  items: IntelItem[]
}

export interface ChecklistItem { label: string; triggered: boolean; detail: string }
export interface ChecklistArtifact {
  type: 'checklist'
  title: string
  subtitle?: string
  items: ChecklistItem[]
}

export type Artifact = TableArtifact | MetricGridArtifact | IntelListArtifact | ChecklistArtifact

export interface SarBrief {
  type: string                  // e.g. 'SAR-HT', 'SAR-PB+MM'
  filingDeadline: string        // ISO date
  typology: string
  fincenRef: string
  indicators: string[]          // specific FinCEN indicators triggered
  narrative: string             // full draft SAR narrative
  recommendation: string
  jointFiling?: string[]        // other case IDs for joint filing
  victimReferral?: boolean
}

export interface AgentFinding {
  agentId: string
  caseId: string
  steps: CoTStep[]
  finding: string
  confidence: number
  verdict: 'FLAGGED' | 'REVIEW' | 'PASS'
  artifacts?: Artifact[]
  sarBrief?: SarBrief           // only on strategist findings
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
    artifacts: [
      {
        type: 'metric-grid', title: 'MCC Signal Summary', cols: 4,
        metrics: [
          { label: 'HT-MCC Ratio', value: '85%', peer: '8%', delta: '+77 pp above peer', flagged: true },
          { label: 'Hotel→Cash Sequences', value: '6', peer: 'threshold ≥ 2', delta: '3× trigger threshold', flagged: true },
          { label: 'Avg BINs per Hotel', value: '10.4', peer: 'expected < 4', delta: '2.6× clustering threshold', flagged: true },
          { label: 'Non-HT Spend Txns', value: '4 of 26', peer: 'typical 60%+', delta: 'Spend suppression 85→15%', flagged: true },
        ],
      },
      {
        type: 'table', title: '30-Day MCC Transaction Breakdown',
        subtitle: 'CAP-004821 · Apr 7–24, 2026 · 26 total transactions',
        columns: [
          { label: 'MCC' }, { label: 'Category' }, { label: 'Txns', right: true }, { label: 'Amount', right: true, mono: true },
          { label: '% of Total', right: true }, { label: 'Peer Avg', right: true }, { label: 'vs Peer', right: true }, { label: 'HT Flag' },
        ],
        rows: [
          { cells: ['6010', 'ATM Cash Advance', 6, '$2,200', '52.6%', '5%', '+47.6 pp', 'HIGH'], flagged: true },
          { cells: ['6540', 'Prepaid Card Reload', 2, '$1,000', '23.9%', '2%', '+21.9 pp', 'HIGH'], flagged: true },
          { cells: ['7011', 'Hotels & Motels', 8, '$732', '17.5%', '12%', '+5.5 pp', 'HIGH'], flagged: true },
          { cells: ['4121', 'Rideshare / Taxi', 6, '$168', '4.0%', '8%', '−4.0 pp', 'HIGH'], flagged: true },
          { cells: ['5912', 'Pharmacy', 2, '$35', '0.8%', '6%', '−5.2 pp', '—'], muted: true },
          { cells: ['5411', 'Grocery Stores', 1, '$32', '0.8%', '18%', '−17.2 pp', '—'], muted: true },
          { cells: ['5999', 'Convenience / Misc', 1, '$9', '0.2%', '5%', '−4.8 pp', '—'], muted: true },
        ],
        note: 'HT MCC ratio: 22 of 26 transactions = 84.6% → flagged at > 70% threshold. Absent categories: Dining (0%), Gas (0%), Retail (0%), Entertainment (0%).',
      },
      {
        type: 'table', title: 'Hotel → Cash Sequence Log',
        subtitle: '6 sequences detected — all within 4-hour check-in window',
        columns: [
          { label: 'Date' }, { label: 'City' }, { label: 'Hotel Check-In', mono: true }, { label: 'Cash Access', mono: true },
          { label: 'Gap', right: true }, { label: 'Amount', right: true, mono: true }, { label: 'Network / Vendor' },
        ],
        rows: [
          { cells: ['Apr 7', 'Boston, MA', '11:42 PM', 'ATM 11:58 PM', '16 min', '$300', 'TD Bank ATM'], flagged: true },
          { cells: ['Apr 9', 'Providence, RI', '10:33 PM', 'ATM 10:51 PM', '18 min', '$400', 'Citizens ATM'], flagged: true },
          { cells: ['Apr 11', 'New York, NY', '11:07 PM', 'Prepaid 11:23 PM', '16 min', '$500', 'VanillaReload · CVS'], flagged: true },
          { cells: ['Apr 11', 'New York, NY', '(continued)', 'ATM 11:44 PM', '37 min', '$500', 'Chase ATM'], flagged: true },
          { cells: ['Apr 14', 'Philadelphia, PA', '10:52 PM', 'ATM 11:09 PM', '17 min', '$300', 'TD Bank ATM *'], flagged: true },
          { cells: ['Apr 18', 'Washington, DC', '10:18 PM', 'ATM 10:29 PM', '11 min', '$400', 'PNC ATM'], flagged: true },
          { cells: ['Apr 22', 'Philadelphia, PA', '10:44 PM', 'ATM 11:01 PM', '17 min', '$300', 'TD Bank ATM *'], flagged: true },
        ],
        note: '* Same TD Bank ATM (1401 Market St, Philadelphia) accessed on two separate corridor passes — Apr 14 and Apr 22.',
      },
      {
        type: 'table', title: 'Cross-Issuer BIN Clustering Per Hotel Night',
        subtitle: 'Cards from distinct issuers transacting at same hotel MID within 90-minute windows',
        columns: [
          { label: 'Night' }, { label: 'City' }, { label: 'MID', mono: true }, { label: 'Cap One', right: true },
          { label: 'Discover', right: true }, { label: 'Chase', right: true }, { label: 'WF/USB/Citi', right: true },
          { label: 'Other', right: true }, { label: 'Total BINs', right: true }, { label: 'P(random)' },
        ],
        rows: [
          { cells: ['Apr 7', 'Boston', 'MID-0000041', 1, 0, 3, 4, 1, 9, '< 0.01%'], flagged: true },
          { cells: ['Apr 9', 'Providence', 'MID-0000187', 1, 1, 2, 5, 1, 10, '< 0.01%'], flagged: true },
          { cells: ['Apr 11', 'New York', 'MID-0000312', 1, 1, 4, 7, 1, 14, '< 0.001%'], flagged: true },
          { cells: ['Apr 16', 'Baltimore', 'MID-0000623', 1, 1, 2, 4, 0, 8, '< 0.05%'], flagged: true },
          { cells: ['Apr 18', 'Washington DC', 'MID-0000744', 1, 1, 3, 5, 1, 11, '< 0.01%'], flagged: true },
        ],
        note: 'Combined probability across 5 nights < 10⁻¹⁸. Expected random co-occurrence at any single hotel: < 1 distinct issuer BIN per night.',
      },
    ],
  },
  {
    agentId: 'cash', caseId: 'CORR-001',
    steps: [
      { text: 'Aggregate ATM cash advances (MCC 6010) + prepaid reloads (MCC 6540)', metric: '$3,200 total cash-equivalent', threshold: 'Cash velocity ≥ 55%', triggered: true },
      { text: 'Compute cash velocity ratio over 30-day window', metric: '77% cash-equivalent spend', threshold: '≥ 55%', triggered: true },
      { text: 'Check for structuring — 3+ cash txns $3K–$9.9K within 7 days', metric: 'Distributed — no single txn > $3K', threshold: 'Pattern check', triggered: false },
    ],
    finding: 'Cash velocity 77% across 6 cities. $3,200 ATM + prepaid distributed at hotel stops; non-HT spend (pharmacy, grocery, convenience) is just 15% of transactions.',
    confidence: 91, verdict: 'FLAGGED',
    artifacts: [
      {
        type: 'metric-grid', title: 'Cash Velocity vs Baseline & Peer', cols: 4,
        metrics: [
          { label: 'Cash Velocity (corridor)', value: '77%', peer: '8% peer avg', delta: '+18.4σ above segment mean', flagged: true },
          { label: 'Pre-Corridor Baseline', value: '4%', peer: '4-yr avg', delta: '19.3× increase in flagged period', flagged: true },
          { label: 'Total Cash-Equivalent', value: '$3,200', peer: 'ATM $2,200 + Prepaid $1,000', delta: '18-day window', flagged: true },
          { label: 'Daily Cash Rate', value: '$178/day', peer: 'peer avg $12/day', delta: '14.8× peer daily rate', flagged: true },
        ],
      },
      {
        type: 'table', title: 'ATM Withdrawal Detail',
        subtitle: '6 withdrawals · $2,200 total · All within 37 minutes of hotel check-in',
        columns: [
          { label: 'Date' }, { label: 'Time', mono: true }, { label: 'City' }, { label: 'ATM Location' },
          { label: 'Network' }, { label: 'Amount', right: true, mono: true }, { label: 'Hrs After Check-In', right: true },
        ],
        rows: [
          { cells: ['Apr 7', '11:58 PM', 'Boston, MA', '847 Commonwealth Ave', 'TD Bank', '$300', '0.3 hr'], flagged: true },
          { cells: ['Apr 9', '10:51 PM', 'Providence, RI', '180 Westminster St', 'Citizens Bank', '$400', '0.3 hr'], flagged: true },
          { cells: ['Apr 11', '11:44 PM', 'New York, NY', '210 W 34th St', 'Chase', '$500', '0.6 hr'], flagged: true },
          { cells: ['Apr 14', '11:09 PM', 'Philadelphia, PA', '1401 Market St', 'TD Bank', '$300', '0.3 hr'], flagged: true },
          { cells: ['Apr 18', '10:29 PM', 'Washington, DC', '1100 Pennsylvania Ave', 'PNC', '$400', '0.2 hr'], flagged: true },
          { cells: ['Apr 22', '11:01 PM', 'Philadelphia, PA', '1401 Market St ⚑', 'TD Bank', '$300', '0.3 hr'], flagged: true },
        ],
        note: '⚑ Same ATM (1401 Market St, Philadelphia) accessed on two separate corridor legs — Apr 14 and Apr 22. This ATM is 0.3 mi from hotel MID-0000491.',
      },
      {
        type: 'table', title: 'Prepaid Card Reload Detail',
        subtitle: '2 reloads · $1,000 total',
        columns: [
          { label: 'Date' }, { label: 'Time', mono: true }, { label: 'City' }, { label: 'Reload Type' }, { label: 'Vendor' }, { label: 'Amount', right: true, mono: true },
        ],
        rows: [
          { cells: ['Apr 11', '11:23 PM', 'New York, NY', 'VanillaReload', 'CVS #7823 · W 34th St', '$500'], flagged: true },
          { cells: ['Apr 16', '11:47 PM', 'Baltimore, MD', 'GreenDot', 'Walmart #2391 · E Pratt St', '$500'], flagged: true },
        ],
        note: 'Both reload locations are within 0.5 mi of hotel MIDs. Prepaid reloads are untraceable once loaded — no payee record at reload merchant.',
      },
      {
        type: 'intel-list', title: 'Structuring Check — Rolling Windows',
        items: [
          { text: 'No single transaction exceeds $3,000 (far below $10,000 CTR trigger)', detail: 'Largest single ATM: $500 (Apr 11, NYC). Largest single day: $1,000 (Apr 11: ATM + Prepaid combined).' },
          { text: 'Rolling 7-day cash max: $1,200 (Apr 11–14 window)', detail: '$500 ATM + $500 Prepaid on Apr 11, then $300 ATM on Apr 14. No structuring pattern detected in rolling windows.' },
          { text: 'Distribution is geographic, not temporal', detail: 'Cash accessed across 6 cities rather than multiple same-day transactions at one location — not classic structuring but consistent with controlled-movement cash distribution.', flagged: true },
          { text: 'Prepaid reload + ATM combined on same night (Apr 11)', detail: '$1,000 combined on single night but across two vendors and two MCC codes — likely deliberate split to avoid merchant-level visibility.', flagged: true },
        ],
      },
    ],
  },
  {
    agentId: 'movement', caseId: 'CORR-001',
    steps: [
      { text: 'Build movement timeline from merchant city/state per transaction', metric: '6 cities in 18 days', threshold: '≥ 4 cities in ≤ 21 days', triggered: true },
      { text: 'Match city sequence against documented corridor routes', metric: 'Boston→Providence→NYC→Philadelphia→Baltimore→DC = I-95 match', threshold: 'Route segment match', triggered: true },
      { text: 'Check for impossible-travel events (same-day, >200 miles)', metric: 'Sequential stops — no impossible travel', threshold: '0 events', triggered: false },
      { text: 'Venue nexus — same merchant hosting distinct cardholder groups', metric: '5 hotel properties flagged as repeat venues', threshold: '≥ 3 events in 45 days', triggered: true },
    ],
    finding: '6 cities in 18 days on the I-95 corridor. All 5 hotel stops are confirmed repeat multi-issuer venues.',
    confidence: 96, verdict: 'FLAGGED',
    artifacts: [
      {
        type: 'metric-grid', title: 'Movement Pattern Metrics', cols: 3,
        metrics: [
          { label: 'Cities Visited', value: '6', peer: 'threshold ≥ 4', delta: 'I-95 spine: Boston→DC', flagged: true },
          { label: 'Total Corridor Days', value: '18 days', peer: 'threshold ≤ 21', delta: 'Within multi-city window', flagged: true },
          { label: 'Night Check-In Rate', value: '100%', peer: 'typical: 60% pm', delta: 'All 8 hotels: 10 PM–midnight', flagged: true },
          { label: 'Total I-95 Distance', value: '914 mi', peer: 'Boston → DC', delta: 'Linear corridor, no loops', flagged: true },
          { label: 'Avg Hotel Stay', value: '2.1 nights', peer: 'business travel: 2.4', delta: 'Short stays, high turnover', flagged: true },
          { label: 'Return Departure', value: '6:23 AM', peer: 'typical: 8+ AM', delta: 'Early-AM exit — documented pattern', flagged: true },
        ],
      },
      {
        type: 'table', title: 'Hotel Stop Movement Log',
        subtitle: '8 hotel check-ins across 6 cities · Apr 7–22, 2026',
        columns: [
          { label: 'Stop #' }, { label: 'City' }, { label: 'Date' }, { label: 'Check-In', mono: true },
          { label: 'MID', mono: true }, { label: 'Distance from Prev' }, { label: 'Transit Method' },
        ],
        rows: [
          { cells: ['1', 'Boston, MA', 'Apr 7', '11:42 PM', 'MID-0000041', 'Home base', '—'], flagged: true },
          { cells: ['2', 'Providence, RI', 'Apr 9', '10:33 PM', 'MID-0000187', '51 mi S', 'Rideshare (Apr 8, 9:15 PM)'], flagged: true },
          { cells: ['3', 'New York, NY', 'Apr 11', '11:07 PM', 'MID-0000312', '182 mi S', 'Rideshare (Apr 10, 8:45 PM)'], flagged: true },
          { cells: ['4', 'Philadelphia, PA', 'Apr 14', '10:52 PM', 'MID-0000491', '94 mi S', 'Mode unknown'], flagged: true },
          { cells: ['5', 'Baltimore, MD', 'Apr 16', '11:31 PM', 'MID-0000623', '101 mi S', 'Rideshare (Apr 11, 9:15 PM)'], flagged: true },
          { cells: ['6', 'Washington, DC', 'Apr 18', '10:18 PM', 'MID-0000744', '40 mi S', 'Rideshare (Apr 17, 7:22 PM)'], flagged: true },
          { cells: ['7 ⟲', 'Baltimore, MD', 'Apr 20', '11:02 PM', 'MID-0000623 ⚑', '40 mi N', 'Mode unknown'], flagged: true },
          { cells: ['8 ⟲', 'Philadelphia, PA', 'Apr 22', '10:44 PM', 'MID-0000491 ⚑', '101 mi N', 'Mode unknown'], flagged: true },
          { cells: ['↩', 'Boston, MA (home)', 'Apr 24', '6:23 AM', '—', '305 mi N', 'Rideshare'], muted: true },
        ],
        note: '⚑ Return stops at same hotel MIDs (Baltimore MID-0000623, Philadelphia MID-0000491) on northbound leg — repeat venue use.',
      },
      {
        type: 'table', title: 'Venue Nexus Intelligence',
        subtitle: 'Hotels flagged as repeat multi-cardholder-group locations (Discover network · 45-day lookback)',
        columns: [
          { label: 'Hotel MID', mono: true }, { label: 'City' }, { label: 'Events (45d)', right: true },
          { label: 'Other Cases' }, { label: 'SAR Status' },
        ],
        rows: [
          { cells: ['MID-0000041', 'Boston, MA', 2, 'CORR-003 (closed)', 'None filed'], muted: true },
          { cells: ['MID-0000187', 'Providence, RI', 1, 'No prior cases', 'None filed'], muted: true },
          { cells: ['MID-0000312', 'New York, NY', 3, 'CORR-001 + CTRL-001 link', 'Pending — SAR-HT'], flagged: true },
          { cells: ['MID-0000491', 'Philadelphia, PA', 4, 'CORR-004 (monitoring)', 'SAR-HT filed Oct 2024'], flagged: true },
          { cells: ['MID-0000623', 'Baltimore, MD', 3, 'Multiple cross-cases', 'SAR-HT filed Sep 2024'], flagged: true },
          { cells: ['MID-0000744', 'Washington, DC', 2, 'CORR-005 (monitoring)', 'None filed'], muted: true },
        ],
        note: '3 of 6 hotel MIDs have prior SAR filings or active monitoring cases. MID-0000491 (Philadelphia) visited twice — both legs of the corridor.',
      },
      {
        type: 'intel-list', title: 'I-95 Northeast Corridor Intelligence',
        items: [
          { text: 'I-95 NE (Boston → Washington DC) is a documented high-trafficking corridor per FIN-2014-A008', detail: 'FinCEN advisory explicitly names this route segment. 6 of 8 hotel properties in this case appear in prior Discover network multi-card events along this corridor.', flagged: true },
          { text: 'Hotel check-in pattern (10 PM–midnight) is consistent with documented controlled movement', detail: 'All 8 hotel transactions occur between 10:18 PM and 11:42 PM. Average check-in: 11:03 PM. This timing window is documented in BSA/AML case literature for trafficking-controlled victims.', flagged: true },
          { text: 'Early-AM return departure (6:23 AM) is a documented cycle-reset indicator', detail: 'Apr 24 rideshare at 6:23 AM matches documented pattern where controllers return victims to home city after the corridor run concludes.', flagged: true },
          { text: 'Three cardholders from this case appear in active FRONT-002 transport case', detail: 'FRONT-002 is an MCC 4121 merchant (rideshare) whose after-hours concentration overlaps with this corridor route. Terminal IP subnet at FRONT-002 merchant overlaps with corridor hotel IPs.' },
          { text: 'No dining, entertainment, or sightseeing spend detected across entire 18-day corridor', detail: 'A genuine business or leisure traveler on the Boston→DC corridor would show restaurant, transit, or retail spend. This cardholder shows none — zero grocery or dining spend except 1 pharmacy and 1 grocery purchase.', flagged: true },
        ],
      },
    ],
  },
  {
    agentId: 'network', caseId: 'CORR-001',
    steps: [
      { text: 'Check device fingerprint sharing across CAP-004821 session logs', metric: 'No shared device FP on primary cardholder', threshold: 'Cluster ≥ 3 accounts', triggered: false },
      { text: 'Verify multi-BIN convergence at hotel terminals (90-min windows)', metric: '8–14 distinct issuer BINs per hotel per night', threshold: '≥ 6 issuers', triggered: true },
    ],
    finding: 'Multi-BIN convergence at all 5 hotel stops. No device fingerprint cluster on primary cardholder — corridor is the signal.',
    confidence: 87, verdict: 'REVIEW',
    artifacts: [
      {
        type: 'metric-grid', title: 'Network Evidence Summary', cols: 3,
        metrics: [
          { label: 'Combined Probability', value: '< 10⁻¹⁸', peer: 'expected: ~1', delta: 'Across 5 independent hotel nights', flagged: true },
          { label: 'Avg BINs per Hotel', value: '10.4', peer: 'expected: < 4', delta: 'Range: 8–14 across 5 properties', flagged: true },
          { label: 'Cross-Issuer Scope', value: '6 institutions', peer: 'Cap One + Discover + 4 others', delta: 'Chase, WF, US Bank, Citi observed', flagged: true },
          { label: 'Cluster Nights', value: '5 of 8 stays', peer: 'threshold: 1 confirmed', delta: 'All Discover-network hotels flagged', flagged: true },
          { label: 'Device Fingerprint', value: 'No shared FP', peer: 'N/A', delta: 'CAP-004821 not in device cluster', flagged: false },
          { label: 'CTRL-001 Terminal Link', value: 'MID-0000312', peer: 'NYC hotel', delta: 'IP overlap with CTRL-001 case', flagged: true },
        ],
      },
      {
        type: 'table', title: 'BIN Convergence Detail — All 5 Hotel Nights',
        subtitle: 'Cards from distinct issuer BINs transacting at hotel merchant within 90-min window on same night',
        columns: [
          { label: 'Night' }, { label: 'City' }, { label: 'Hotel MID', mono: true }, { label: 'Cap One', right: true },
          { label: 'Discover', right: true }, { label: 'Chase', right: true }, { label: 'WF', right: true },
          { label: 'USB / Citi', right: true }, { label: 'Other', right: true }, { label: 'Total', right: true }, { label: 'P(chance)' },
        ],
        rows: [
          { cells: ['Apr 7', 'Boston', 'MID-0000041', 1, 0, 3, 2, 2, 1, '9 BINs', '< 0.01%'], flagged: true },
          { cells: ['Apr 9', 'Providence', 'MID-0000187', 1, 1, 2, 2, 3, 1, '10 BINs', '< 0.01%'], flagged: true },
          { cells: ['Apr 11', 'New York', 'MID-0000312', 1, 1, 4, 3, 4, 1, '14 BINs', '< 0.001%'], flagged: true },
          { cells: ['Apr 16', 'Baltimore', 'MID-0000623', 1, 1, 2, 2, 2, 0, '8 BINs', '< 0.05%'], flagged: true },
          { cells: ['Apr 18', 'Washington DC', 'MID-0000744', 1, 1, 3, 2, 3, 1, '11 BINs', '< 0.01%'], flagged: true },
        ],
        note: 'P(chance) computed as: probability that this many distinct issuer BINs would co-occur at one merchant within 90 minutes by random hotel guest overlap. Expected BINs per hotel night under null hypothesis: 1.8.',
      },
    ],
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
    artifacts: [
      {
        type: 'table', title: 'Evidence Weight Decomposition — 94% Confidence',
        subtitle: 'How individual agent signals combine to produce the final case confidence score',
        columns: [
          { label: 'Signal Domain' }, { label: 'Agent' }, { label: 'Weight', right: true }, { label: 'Agent Score', right: true }, { label: 'Contribution', right: true },
        ],
        rows: [
          { cells: ['MCC cluster ratio + hotel→cash sequences', 'MCC Analyst', '30%', '95%', '28.5%'], flagged: true },
          { cells: ['Cash velocity 77% + distribution geography', 'Cash Analyst', '25%', '91%', '22.8%'], flagged: true },
          { cells: ['6-city corridor route match (I-95)', 'Movement Analyst', '25%', '96%', '24.0%'], flagged: true },
          { cells: ['Cross-issuer BIN clustering (5 hotels)', 'Network Analyst', '15%', '87%', '13.1%'], flagged: true },
          { cells: ['Account anomaly: 4% → 77% cash, 4yr history', 'Account Context', '5%', '99%', '5.0%'], flagged: true },
          { cells: ['Weighted sub-total', '—', '100%', '—', '93.4%'], muted: true },
          { cells: ['Cross-case link bonus (FRONT-002 shared cardholders)', 'Case Strategist', 'adj.', '+0.6%', '94.0%'], flagged: true },
        ],
        note: 'Weight assignments per BSA/AML Typology Scoring Framework v2.1. Cross-case adjustments applied when active SAR cross-references confirmed.',
      },
      {
        type: 'checklist', title: 'FIN-2014-A008 Human Trafficking Indicator Checklist',
        subtitle: 'FinCEN Advisory on Identifying and Reporting Human Trafficking Indicators',
        items: [
          { label: 'Multiple hotel/motel charges across multiple cities', triggered: true, detail: '8 hotel charges at 6 distinct cities. MCC 7011 accounts for 17.5% of total spend.' },
          { label: 'Multiple ATM withdrawals near hotel locations', triggered: true, detail: '6 ATM withdrawals within 11–37 minutes of hotel check-in across all 6 corridor cities.' },
          { label: 'Purchase or reload of prepaid cards at corridor stops', triggered: true, detail: '2 prepaid reloads ($500 each) at CVS and Walmart adjacent to hotel properties.' },
          { label: 'Multiple people using same merchant location (BIN clustering)', triggered: true, detail: '8–14 distinct issuer BINs at each of 5 hotel properties within 90-minute windows.' },
          { label: 'Minimal non-trafficking MCC spend (food, retail, entertainment)', triggered: true, detail: 'Only 4 of 26 transactions (15%) are non-HT MCCs. Zero dining, zero gas, zero entertainment.' },
          { label: 'Geographic movement along known trafficking corridors', triggered: true, detail: 'I-95 Boston→DC is explicitly named in FIN-2014-A008 as a primary corridor.' },
          { label: 'Transactions concentrated in after-hours windows', triggered: true, detail: '100% of hotel check-ins between 10 PM and midnight. Early-AM rideshare return on Apr 24.' },
          { label: 'Escort or massage parlor MCC (7297/7299) direct charge', triggered: false, detail: 'Not observed. Consistent with hotel-based trafficking model where escort MCC rarely appears on victim card.' },
        ],
      },
      {
        type: 'intel-list', title: 'SAR Filing Rationale & Action Items',
        items: [
          { text: 'Filing type: SAR-HT (Human Trafficking) — mandatory per FinCEN guidance', detail: '3 of 6 FinCEN HT advisory categories triggered. Combined confidence 94%. Threshold for SAR-HT filing: ≥ 2 categories + ≥ 85% confidence.', flagged: true },
          { text: '30-day SAR clock started Nov 14, 2024 → deadline Dec 14, 2024', detail: 'BSA/AML Northeast team assigned. SAR narrative must reference Discover cross-network BIN clustering data as corroborating evidence.', flagged: true },
          { text: 'Cross-case joint filing with FRONT-002 recommended', detail: 'FRONT-002 (MCC 4121 transport merchant) shares 3 cardholders with this case and terminal IP subnet overlap. Joint SAR-HT filing will strengthen the LE referral narrative.' },
          { text: 'Victim services referral: National Human Trafficking Hotline 1-888-373-7888', detail: 'LE liaison (BSA/AML Northeast ↔ FBI VCATF) to be notified. Victim identity not confirmed — referral is precautionary per FinCEN guidance.' },
          { text: 'Probable victim indicator: account activity inconsistent with voluntary travel', detail: 'No dining, no personal shopping, no leisure spend across 18 days. Cash distributed to third parties via ATM and prepaid reload. Pattern is consistent with third-party cash extraction from a victim.' },
        ],
      },
    ],
    sarBrief: {
      type: 'SAR-HT',
      filingDeadline: '2026-05-25',
      typology: 'Human Trafficking — Corridor Movement (I-95)',
      fincenRef: 'FIN-2014-A008',
      indicators: [
        'Industry/MCC red flags: 85% of spend in hotel, ATM, rideshare, and prepaid reload categories (threshold > 70%)',
        'Geographic movement: 6 cities in 18 days matching the documented I-95 corridor — Boston → Providence → NYC → Philadelphia → Baltimore → DC',
        'Multi-issuer BIN clustering: 8–14 distinct issuer BINs confirmed at each of 5 hotel properties on same nights as subject cardholder',
        'Hotel→ATM sequences: 6 confirmed within 4-hour city windows across 5 properties',
        'Absent ordinary spend: zero dining, grocery, or retail transactions over 18 days — inconsistent with voluntary travel',
      ],
      narrative: 'The subject cardholder (CAP-004821) maintained a 76-month account history with normal consumer spend — grocery, dining, gas, retail — prior to the flagged period. Beginning April 7, 2026, the cardholder transacted exclusively in trafficking-adjacent merchant categories across 6 cities along the I-95 corridor over 18 days. Normal spend categories were entirely absent. Hotel-to-ATM sequences were detected 6 times across 5 distinct hotel properties. Cross-issuer analysis via the Discover network confirmed 8 to 14 additional distinct issuer BINs at each property on the same nights, indicating coordinated multi-card operation. Three cardholders in this case also appear in FRONT-002 (Sunrise Transport LLC), and a terminal IP subnet overlap further links the two cases. This pattern is consistent with human trafficking financial indicators 1, 3, and 5 in FinCEN Advisory FIN-2014-A008.',
      recommendation: 'File joint SAR-HT with FRONT-002. Refer to National Human Trafficking Hotline. Flag merchant MID-0001102 for venue-level SAR investigation.',
      jointFiling: ['FRONT-002'],
      victimReferral: true,
    },
  },

  // ── CORR-002 ──────────────────────────────────────────────────────────────────
  {
    agentId: 'mcc', caseId: 'CORR-002',
    steps: [
      { text: 'Compute trafficking MCC ratio over rolling 30 days', metric: '81% in HT MCCs', threshold: '> 70%', triggered: true },
      { text: 'Scan for hotel → ATM/prepaid sequences within 4-hr windows', metric: '5 sequences detected', threshold: '≥ 2', triggered: true },
      { text: 'Cross-issuer BIN clustering at shared merchants', metric: '6–11 BINs at 2 properties', threshold: '≥ 8 BINs', triggered: false },
    ],
    finding: 'MCC ratio 81% with 5 hotel→ATM sequences. Non-HT spend (convenience, grocery, pharmacy) is 19% of transactions. BIN clustering present but below peak threshold at 2 merchants.',
    confidence: 87, verdict: 'FLAGGED',
    artifacts: [
      {
        type: 'metric-grid', title: 'MCC Signal Summary (CORR-002)', cols: 4,
        metrics: [
          { label: 'HT-MCC Ratio', value: '81%', peer: '8%', delta: '+73 pp above peer', flagged: true },
          { label: 'Hotel→Cash Sequences', value: '5', peer: 'threshold ≥ 2', delta: '2.5× trigger threshold', flagged: true },
          { label: 'Avg BINs per Hotel', value: '8.5', peer: 'expected < 4', delta: 'Below ≥ 8 threshold at 2 hotels', flagged: false },
          { label: 'Account Age at Entry', value: '34 days', peer: 'no spend baseline', delta: 'Immediate corridor entry — no history', flagged: true },
        ],
      },
      {
        type: 'table', title: '30-Day MCC Transaction Breakdown (CORR-002)',
        subtitle: 'CAP-007342 · Mar 12–21, 2026 · 16 total transactions',
        columns: [
          { label: 'MCC' }, { label: 'Category' }, { label: 'Txns', right: true }, { label: 'Amount', right: true, mono: true },
          { label: '% of Total' }, { label: 'Peer Avg' }, { label: 'HT Flag' },
        ],
        rows: [
          { cells: ['6010', 'ATM Cash Advance', 3, '$1,200', '44.4%', '5%', 'HIGH'], flagged: true },
          { cells: ['6540', 'Prepaid Card Reload', 2, '$1,000', '37.0%', '2%', 'HIGH'], flagged: true },
          { cells: ['7011', 'Hotels & Motels', 5, '$375', '13.9%', '12%', 'HIGH'], flagged: true },
          { cells: ['4121', 'Rideshare / Taxi', 3, '$77', '2.9%', '8%', 'HIGH'], flagged: true },
          { cells: ['5411', 'Grocery Stores', 1, '$12', '0.4%', '18%', '—'], muted: true },
          { cells: ['5912', 'Pharmacy', 1, '$16', '0.6%', '6%', '—'], muted: true },
          { cells: ['5999', 'Convenience / Misc', 1, '$9', '0.3%', '5%', '—'], muted: true },
        ],
        note: 'HT MCC ratio: 13 of 16 transactions = 81.3% → flagged at > 70% threshold. New account — no prior spend history means no baseline deviation possible.',
      },
      {
        type: 'table', title: 'Hotel → Cash Sequence Log (CORR-002)',
        subtitle: '5 sequences detected — I-10 Southern corridor',
        columns: [
          { label: 'Date' }, { label: 'City' }, { label: 'Hotel Check-In', mono: true }, { label: 'Cash Access', mono: true }, { label: 'Gap', right: true }, { label: 'Amount', right: true, mono: true },
        ],
        rows: [
          { cells: ['Mar 12', 'Houston, TX', '10:55 PM', 'ATM 11:12 PM', '17 min', '$400'], flagged: true },
          { cells: ['Mar 14', 'Beaumont, TX ⚑', '11:38 PM', 'Prepaid 11:54 PM', '16 min', '$500'], flagged: true },
          { cells: ['Mar 16', 'New Orleans, LA', '10:21 PM', 'ATM 10:44 PM', '23 min', '$500'], flagged: true },
          { cells: ['Mar 18', 'Mobile, AL', '11:15 PM', 'ATM 11:33 PM', '18 min', '$300'], flagged: true },
          { cells: ['Mar 20', 'Jacksonville, FL', '10:49 PM', 'Prepaid 11:07 PM', '18 min', '$500'], flagged: true },
        ],
        note: '⚑ Beaumont MID-0001102 is a confirmed repeat trafficking venue — 3rd distinct cardholder group in 45 days.',
      },
    ],
  },
  {
    agentId: 'cash', caseId: 'CORR-002',
    steps: [
      { text: 'Aggregate ATM + prepaid reloads over 30-day window', metric: '$2,200 ($1,200 ATM + $1,000 prepaid)', threshold: 'Cash velocity ≥ 55%', triggered: true },
      { text: 'Compute cash velocity ratio', metric: '82% cash-equivalent spend', threshold: '≥ 55%', triggered: true },
      { text: 'Account vintage check — new account, no spend baseline', metric: 'Account opened 34 days ago', threshold: 'New-account corridor entry', triggered: true },
    ],
    finding: 'Cash velocity 82%. New account (34 days) entering corridor pattern immediately — no legitimate spend baseline to compare against.',
    confidence: 88, verdict: 'FLAGGED',
    artifacts: [
      {
        type: 'metric-grid', title: 'Cash Velocity — New Account Risk', cols: 4,
        metrics: [
          { label: 'Cash Velocity', value: '82%', peer: '8% peer avg', delta: '+20.5σ — extreme outlier', flagged: true },
          { label: 'Account Age', value: '34 days', peer: 'no spend baseline', delta: 'Immediate corridor entry', flagged: true },
          { label: 'Total Cash-Equivalent', value: '$2,200', peer: '$1,200 ATM + $1,000 Prepaid', delta: '10-day window', flagged: true },
          { label: 'Baseline Deviation', value: 'N/A', peer: 'no history', delta: 'Cannot compute — new account', flagged: false },
        ],
      },
      {
        type: 'table', title: 'Cash Transaction Detail (CORR-002)',
        subtitle: 'ATM withdrawals and prepaid reloads · Mar 12–20, 2026',
        columns: [
          { label: 'Date' }, { label: 'Time', mono: true }, { label: 'City' }, { label: 'Type' }, { label: 'Amount', right: true, mono: true }, { label: 'Notes' },
        ],
        rows: [
          { cells: ['Mar 12', '11:12 PM', 'Houston, TX', 'ATM Advance', '$400', '17 min after hotel check-in'], flagged: true },
          { cells: ['Mar 14', '11:54 PM', 'Beaumont, TX', 'Prepaid Reload', '$500', 'GreenDot · repeat nexus venue'], flagged: true },
          { cells: ['Mar 16', '10:44 PM', 'New Orleans, LA', 'ATM Advance', '$500', '23 min after hotel check-in'], flagged: true },
          { cells: ['Mar 18', '11:33 PM', 'Mobile, AL', 'ATM Advance', '$300', '18 min after hotel check-in'], flagged: true },
          { cells: ['Mar 20', '11:07 PM', 'Jacksonville, FL', 'Prepaid Reload', '$500', 'VanillaReload · 18 min after check-in'], flagged: true },
        ],
        note: 'All 5 cash transactions occur within 25 minutes of hotel check-in. Total: $2,200 in 10 days from a 34-day-old account with zero prior cash transaction history.',
      },
    ],
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
    artifacts: [
      {
        type: 'metric-grid', title: 'Movement Pattern Metrics (CORR-002)', cols: 3,
        metrics: [
          { label: 'Cities Visited', value: '5', peer: 'threshold ≥ 4', delta: 'I-10: Houston → Jacksonville', flagged: true },
          { label: 'Total Corridor Days', value: '10 days', peer: 'threshold ≤ 14', delta: 'Faster cadence than I-95 case', flagged: true },
          { label: 'Night Check-In Rate', value: '100%', peer: 'typical: 60% pm', delta: 'All 5 hotels: 10:21–11:38 PM', flagged: true },
          { label: 'Beaumont Nexus Events', value: '3 of 3', peer: 'threshold ≥ 3 in 45d', delta: '3rd coordinated group — venue flagged', flagged: true },
          { label: 'Account Age at Day 1', value: '34 days', peer: 'typical: 18+ mo', delta: 'No account seasoning at corridor entry', flagged: true },
          { label: 'Return Departure', value: '4:18 AM', peer: 'typical: 8+ AM', delta: 'Early-AM exit — documented indicator', flagged: true },
        ],
      },
      {
        type: 'table', title: 'City Movement Log — I-10 Southern Corridor',
        columns: [
          { label: 'Stop' }, { label: 'City' }, { label: 'Date' }, { label: 'Check-In', mono: true },
          { label: 'MID', mono: true }, { label: 'Distance from Prev' }, { label: 'Transit' },
        ],
        rows: [
          { cells: ['1', 'Houston, TX', 'Mar 12', '10:55 PM', 'MID-0001091', 'Home base', '—'], flagged: true },
          { cells: ['2', 'Beaumont, TX ⚑', 'Mar 14', '11:38 PM', 'MID-0001102', '85 mi E', 'Rideshare (Mar 15, 8:45 PM)'], flagged: true },
          { cells: ['3', 'New Orleans, LA', 'Mar 16', '10:21 PM', 'MID-0001287', '270 mi E', 'Rideshare (Mar 17, 8:15 PM)'], flagged: true },
          { cells: ['4', 'Mobile, AL', 'Mar 18', '11:15 PM', 'MID-0001394', '145 mi E', 'Mode unknown'], flagged: true },
          { cells: ['5', 'Jacksonville, FL', 'Mar 20', '10:49 PM', 'MID-0001521', '350 mi E', 'Mode unknown'], flagged: true },
          { cells: ['↩', 'Houston, TX (home)', 'Mar 21', '4:18 AM', '—', '700 mi W', 'Rideshare'], muted: true },
        ],
        note: '⚑ MID-0001102 (Beaumont) is the 3rd coordinated multi-card event at this property in 45 days. Each prior event involved a completely different set of issuer BINs.',
      },
      {
        type: 'table', title: 'Venue Nexus — Beaumont MID-0001102',
        subtitle: 'Three distinct cardholder group events at same property in 45-day lookback',
        columns: [
          { label: 'Event #' }, { label: 'Date Range' }, { label: 'Cap One Cards' }, { label: 'Other Issuer BINs' }, { label: 'Total Cash-Out' }, { label: 'SAR Status' },
        ],
        rows: [
          { cells: ['1st event', 'Feb 1–3, 2026', '2 accounts', '4 BINs (Chase, WF)', '$1,900', 'SAR-HT monitoring'], muted: true },
          { cells: ['2nd event', 'Feb 28–Mar 2', '1 account', '7 BINs (Discover, Citi, USB)', '$2,400', 'SAR-HT filed Mar 5'], muted: true },
          { cells: ['3rd event ⚑', 'Mar 14 (this case)', '1 account (CAP-007342)', '5 BINs observed', '$500 (this card)', 'Pending — venue-level'], flagged: true },
        ],
        note: '⚑ Third coordinated event at MID-0001102. The property (not the cardholders) is the constant — each event involves different cards, same location. Venue-level SAR filing recommended.',
      },
      {
        type: 'intel-list', title: 'I-10 Southern Corridor Intelligence',
        items: [
          { text: 'I-10 (Houston → Jacksonville) is a documented high-trafficking corridor', detail: 'FIN-2014-A008 names Gulf Coast interstate routes. Houston→Beaumont→New Orleans is a well-documented segment in LE trafficking case reports.', flagged: true },
          { text: 'Beaumont, TX is a documented hub on the Texas trafficking network', detail: 'Beaumont proximity to I-10 and I-69 intersection makes it a documented transit node. MID-0001102 at this location is now confirmed as a repeat venue (3 events in 45 days).', flagged: true },
          { text: 'New account immediately entering corridor pattern is an elevated risk indicator', detail: 'Account opened 34 days prior to Day 1. No prior merchant relationships, no spend history. Controllers often open new accounts specifically for corridor runs to avoid velocity alerts on established accounts.', flagged: true },
          { text: 'Early-AM return (4:18 AM) is consistent with controlled-movement cycle reset', detail: 'Mar 21 rideshare at 4:18 AM mirrors the cycle-reset pattern seen in CORR-001 (Apr 24, 6:23 AM). Controllers typically complete corridor by early morning.' },
        ],
      },
    ],
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
    sarBrief: {
      type: 'SAR-HT',
      filingDeadline: '2026-04-20',
      typology: 'Human Trafficking — Corridor Movement (I-10 Southern) + New Account',
      fincenRef: 'FIN-2014-A008',
      indicators: [
        'Industry/MCC red flags: 81% of spend in hotel, ATM, rideshare, and prepaid reload categories',
        'Geographic movement: 5 cities in 10 days on the I-10 Southern corridor — Houston → Beaumont → New Orleans → Mobile → Jacksonville',
        'New account corridor entry: account opened 34 days prior, immediately exhibiting full corridor pattern with no legitimate spend history',
        'Venue nexus: MID-0001102 (Beaumont, TX) is the 3rd distinct cardholder group at this merchant in 45 days — venue-level investigation required',
        'Hotel→ATM sequences: 5 confirmed within 4-hour city windows',
      ],
      narrative: 'The subject cardholder (CAP-007342) opened their Capital One account 34 days prior to Day 1 of this corridor run, with no prior transaction history. The account immediately entered a corridor pattern consistent with controlled movement along the I-10 Southern route over 10 days. Cash velocity reached 82% of total spend. The Beaumont, TX property (MID-0001102) where the subject transacted is confirmed as a repeat trafficking venue — this is the 3rd distinct cardholder group observed there in 45 days. New accounts with no spend seasoning entering full corridor patterns immediately are a documented indicator of purpose-opened accounts used by trafficking controllers. This pattern is consistent with geographic movement and MCC red flags in FinCEN Advisory FIN-2014-A008.',
      recommendation: 'File SAR-HT. File separate venue-level SAR for MID-0001102 (Beaumont property). Flag account for 90-day monitoring.',
      victimReferral: true,
    },
    artifacts: [
      {
        type: 'table', title: 'Evidence Weight Decomposition — 87% Confidence',
        columns: [
          { label: 'Signal Domain' }, { label: 'Agent' }, { label: 'Weight', right: true }, { label: 'Score', right: true }, { label: 'Contribution', right: true },
        ],
        rows: [
          { cells: ['MCC ratio 81% + hotel→cash sequences', 'MCC Analyst', '30%', '87%', '26.1%'], flagged: true },
          { cells: ['Cash velocity 82% + new-account entry', 'Cash Analyst', '25%', '88%', '22.0%'], flagged: true },
          { cells: ['I-10 route match + Beaumont nexus', 'Movement Analyst', '25%', '93%', '23.3%'], flagged: true },
          { cells: ['BIN clustering (partial — 2 of 5 hotels)', 'Network Analyst', '15%', '70%', '10.5%'], muted: true },
          { cells: ['New-account corridor entry (34 days)', 'Account Context', '5%', '99%', '5.0%'], flagged: true },
          { cells: ['Weighted total', '—', '100%', '—', '86.9% → 87%'], muted: true },
        ],
        note: 'BIN clustering score lower than CORR-001 because only 2 of 5 hotels exceed the ≥ 8 BIN threshold. Overall confidence anchored by MCC, cash, and movement convergence.',
      },
      {
        type: 'checklist', title: 'FIN-2014-A008 Indicator Checklist (CORR-002)',
        items: [
          { label: 'Multiple hotel/motel charges across multiple cities', triggered: true, detail: '5 hotel charges across 5 cities. MCC 7011 = 5 transactions.' },
          { label: 'Multiple ATM withdrawals near hotel locations', triggered: true, detail: '3 ATM withdrawals within 23 minutes of hotel check-in (Houston, NOLA, Mobile).' },
          { label: 'Purchase or reload of prepaid cards at corridor stops', triggered: true, detail: '2 prepaid reloads ($500 each) at Beaumont and Jacksonville, both within 18 min of check-in.' },
          { label: 'Multiple people using same merchant location (BIN clustering)', triggered: false, detail: '6–11 BINs at 2 properties — below ≥ 8 threshold at Beaumont and Jacksonville. Not conclusive at this level.' },
          { label: 'Minimal non-trafficking MCC spend', triggered: true, detail: 'Only 3 of 16 transactions non-HT (19%). Zero dining, zero gas, zero entertainment across 10 days.' },
          { label: 'Geographic movement along known trafficking corridors', triggered: true, detail: 'I-10 Houston→Jacksonville matches documented Gulf Coast corridor.' },
          { label: 'Transactions concentrated in after-hours windows', triggered: true, detail: 'All 5 hotel check-ins between 10:21 PM and 11:38 PM. Return at 4:18 AM.' },
          { label: 'New account immediately entering corridor pattern', triggered: true, detail: 'Account 34 days old at first corridor transaction — no spend seasoning, no established merchant relationships.', },
        ],
      },
      {
        type: 'intel-list', title: 'SAR Filing Rationale — Venue-Level Action',
        items: [
          { text: 'Individual SAR-HT recommended for CAP-007342 (cardholder)', detail: 'Standard SAR-HT threshold met: 3 FinCEN categories, 3 agent flags, 87% combined confidence. Filing deadline: Dec 12, 2024.', flagged: true },
          { text: 'Venue-level SAR recommended for MID-0001102 (Beaumont, TX property)', detail: 'This property has had 3 coordinated multi-card events in 45 days with completely different cardholder sets each time. The venue is a systemic trafficking facilitation point — not a cardholder-level pattern.', flagged: true },
          { text: 'BSA South team to request merchant-level investigation from card networks', detail: 'Capital One Network can pull all card transactions at MID-0001102 across all issuers for the past 6 months. This would surface the full scale of trafficking activity at this venue.' },
          { text: 'Coordination with Texas AG Human Trafficking Prevention Unit recommended', detail: 'Beaumont is in Jefferson County, TX — jurisdiction of the TXAG unit. BSA South has an existing LE liaison contact.' },
        ],
      },
    ],
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
    sarBrief: {
      type: 'SAR-HT + SAR-MM',
      filingDeadline: '2026-04-15',
      typology: 'Funnel Accounts / Controller Network — FIN-2020-A008 Typology 3',
      fincenRef: 'FIN-2020-A008',
      indicators: [
        'Device fingerprint FP-7a3c9d2e1b4f8a0c shared across 4 Capital One accounts — p < 0.001%',
        'Session IP 192.168.44.17 confirmed at both account login events and Discover merchant terminals (MID-0001872, MID-0002341)',
        '$28,400 combined cash-out across 9 accounts at 6 institutions over 21 days',
        'Cross-account structuring: each account $2,700–$4,100 — distributed to avoid per-account CTR threshold',
        '6 distinct issuer BINs confirmed at 3 shared merchants within 90-minute windows over 7 nights',
      ],
      narrative: 'A single controller operating from IP 192.168.44.17 is confirmed to have operated 9 accounts across 6 financial institutions — 4 Capital One accounts (device fingerprint match) plus 5 additional accounts at Discover, Chase, Wells Fargo, US Bank, and Citibank (Discover network terminal cross-match). The controller accessed accounts between 10:45 PM and 12:15 AM across multiple nights. Combined cash-out is $28,400 over 21 days. Amounts were distributed across accounts to remain below $10,000 per account, avoiding Currency Transaction Report obligations. The session IP was also identified at the same Discover merchant terminals where multi-issuer BIN clustering was detected, definitively linking the controller to the physical operation. This typology matches FIN-2020-A008 Typology 3 (Funnel Accounts).',
      recommendation: 'File joint SAR-HT + SAR-MM (Money Mule). Refer to FBI Financial Crimes Unit. Freeze controller accounts pending investigation.',
      jointFiling: ['FRONT-001'],
    },
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
    sarBrief: {
      type: 'SAR-FE',
      filingDeadline: '2026-05-10',
      typology: 'Front Company — FIN-2020-A008 Typology 1',
      fincenRef: 'FIN-2020-A008',
      indicators: [
        'Monthly processing volume $182K vs $28K MCC peer median (6.5× above peer) for declared day spa',
        '84% of volume concentrated 10 PM–4 AM — 5.6× MCC 7297 peer night benchmark; zero daytime activity on 6 of 14 days',
        '91% card-not-present rate for a declared in-person service business — physically impossible without fraud',
        '0.00% chargeback rate over 14 months — customers never dispute, anomalously clean',
        'Legal entity Sunrise Wellness Group LLC holds $750K commercial credit facility (COMM-00312) at Capital One',
      ],
      narrative: 'Sunrise Wellness Group LLC (MID-0003847), declared as a day spa in Las Vegas, NV, processed $182,000 in the review month — 6.5× the MCC 7297 city-adjusted peer median. Transaction volume was concentrated 84% after 10 PM, producing a 5.6× peer night ratio. The merchant had zero activity during its declared hours (9 AM–7 PM) on 6 of 14 days. The 91% card-not-present rate for a declared in-person business and 0.00% chargeback rate over 14 months are individually anomalous; in combination they are statistically inconsistent with legitimate business operations. The same legal entity holds a $750,000 commercial credit facility at Capital One, creating cross-product exposure. This pattern is consistent with a front company laundering proceeds as described in FIN-2020-A008 Typology 1.',
      recommendation: 'File SAR-FE (Front Company). Freeze merchant processing. Escalate $750K commercial exposure to Credit Risk. Refer to FBI Las Vegas Field Office.',
      jointFiling: ['CTRL-001'],
    },
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
    sarBrief: {
      type: 'SAR-HT',
      filingDeadline: '2026-05-20',
      typology: 'Front Company / Transport — FIN-2020-A008 Typology 1 + CORR-001 Cross-Link',
      fincenRef: 'FIN-2020-A008',
      indicators: [
        '79% of $94K monthly volume concentrated 10 PM–5 AM — 4.4× MCC 4121 peer benchmark for declared car service',
        '97% card-not-present rate — no physical terminal usage in 9 months for a declared rideshare service',
        'Monthly volume $94K vs $31K peer median (3.0× above peer)',
        '3 cardholders in this case also appear in active case CORR-001 (I-95 corridor); terminal IP subnet overlap confirmed',
        'Cross-case cardholder and infrastructure link to active human trafficking corridor case',
      ],
      narrative: 'Sunrise Transport LLC (MID-0005123), declared as a car service in Philadelphia, PA, processed $94,000 in the review month. Volume was concentrated 79% after 10 PM, producing a 4.4× peer night ratio for MCC 4121. No physical terminal usage has been recorded in 9 months — 97% card-not-present for a declared in-person rideshare operation is inconsistent with legitimate business. Three cardholders appearing in this merchant\'s transaction data also appear in CORR-001, an active I-95 corridor human trafficking case. Terminal IP subnet overlap between this merchant and hotels in CORR-001 further confirms an operational link. The pattern is consistent with a transport front company facilitating victim movement along the I-95 corridor.',
      recommendation: 'File joint SAR-HT with CORR-001. Refer to FBI VCATF. Freeze merchant processing pending investigation.',
      jointFiling: ['CORR-001'],
      victimReferral: true,
    },
  },
]

// Derived helpers
export function findingsForCase(caseId: string): AgentFinding[] {
  return AGENT_FINDINGS.filter(f => f.caseId === caseId)
}

export function hitCasesForAgent(agentId: string): string[] {
  return [...new Set(AGENT_FINDINGS.filter(f => f.agentId === agentId).map(f => f.caseId))]
}
