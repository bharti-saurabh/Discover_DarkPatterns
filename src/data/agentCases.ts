// ── Investigation Cases ────────────────────────────────────────────────────────

export interface AgentCase {
  id: string
  title: string
  type: 'bust-out' | 'synthetic-identity' | 'refund-fraud' | 'structuring'
  typeLabel: string
  riskLevel: 'critical' | 'high'
  summary: string
  entities: { accounts: number; merchants: number; devices: number; estimatedExposure: number }
  caponeContext: string
  discoverContext: string
}

export const AGENT_CASES: AgentCase[] = [
  {
    id: 'CASE-001',
    title: 'Operation Maxout',
    type: 'bust-out',
    typeLabel: 'Bust-Out Fraud Ring',
    riskLevel: 'critical',
    summary: '7 Capital One accounts opened within 45 days, all conducted 90 days of credit-building behavior before simultaneously maxing out in a coordinated 72-hour window. Discover network data reveals the same cardholders coordinated at two electronics merchants — then returned the merchandise — in the week before the bust-out.',
    entities: { accounts: 7, merchants: 2, devices: 1, estimatedExposure: 77255 },
    caponeContext: `FLAGGED ACCOUNTS — 7 accounts, opened 2024-06-15 to 2024-07-29
Account      Opened       CreditLimit   Balance    Utilization   Status
CAP-044821   2024-06-15   $12,000       $11,847    98.7%         DELINQUENT-30
CAP-049302   2024-06-19   $8,500        $8,391     98.7%         DELINQUENT-30
CAP-051847   2024-07-02   $15,000       $14,882    99.2%         DELINQUENT-30
CAP-053291   2024-07-08   $10,000       $9,934     99.3%         DELINQUENT-30
CAP-056782   2024-07-14   $12,500       $12,388    99.1%         DELINQUENT-30
CAP-059134   2024-07-22   $9,000        $8,912     99.0%         DELINQUENT-30
CAP-061203   2024-07-29   $11,000       $10,901    99.1%         DELINQUENT-30

SHARED SIGNALS:
- All 7 share device fingerprint FP-3b8e2a1c across login events
- 5/7 share IP range 104.21.x.x (Cloudflare residential proxy)
- All listed same employer: "Apex Staffing Solutions" (EIN: unverifiable)
- All made minimum payments for 60–90 days, then went silent

BUST-OUT WINDOW: 2024-09-14 to 2024-09-16 (72 hours)
Total credit consumed: $77,255
Merchant categories: Electronics 34%, Jewelry 28%, Gift Cards 21%, Cash Advance 17%
All purchases: card-not-present, different merchant IDs, no geographic clustering`,

    discoverContext: `CARDHOLDER OVERLAP — 5 of 7 Cap One accounts matched to Discover cardholders via SSN-last4 + DOB:
CAP-044821 ↔ DIS-091234    CAP-049302 ↔ DIS-098471    CAP-051847 ↔ DIS-102938
CAP-056782 ↔ DIS-119384    CAP-061203 ↔ DIS-128847

PRE-BUST COORDINATED ACTIVITY (2024-09-07 to 2024-09-13):
All 5 linked Discover cardholders visited the same 2 merchants in the same week:
  MID-2291 "TechZone Electronics" (MCC 5732): 5 cardholders, 12 txns, avg ticket $847
  MID-3847 "Premier Jewelers" (MCC 5944): 4 cardholders, 8 txns, avg ticket $1,240
→ ALL purchases at both merchants were RETURNED and fully refunded 2 days before the Cap One bust-out

ADDITIONAL NETWORK SIGNALS:
- All 5 Discover cards were dormant 30+ days prior to the coordinated pre-bust visits
- Merchant MID-2291 has appeared in 3 prior multi-issuer fraud events in Discover's fraud database
- Return transactions processed by same employee ID at both merchants (E-9912, night shift)
- Refunds were credited to Discover cards; replacement merchandise never confirmed shipped`,
  },

  {
    id: 'CASE-002',
    title: 'Project Ghost',
    type: 'synthetic-identity',
    typeLabel: 'Synthetic Identity Cluster',
    riskLevel: 'critical',
    summary: '12 synthetic identities built over 18 months across Capital One and Discover. Cap One\'s ML model flagged shared device fingerprints and duplicate SSN fragments. Discover\'s terminal data reveals 4 identity pairs conducting card-present transactions in cities hundreds of miles apart within 30-minute windows — physically impossible if they were real, distinct people.',
    entities: { accounts: 12, merchants: 6, devices: 3, estimatedExposure: 141000 },
    caponeContext: `SYNTHETIC IDENTITY CLUSTER — 12 accounts, ML fraud score 0.94
Shared device fingerprint FP-9c4d7a2b across 9/12 accounts
Shared IP cluster: 10/12 accounts originated from same /24 subnet (residential proxy network)

IDENTITY ANOMALIES (selected):
Name                  SSN-Last4   DOB          SSN-Issue    Claimed Credit Age   Actual File Age
"Marcus Johnson"      3847        1988-03-15   2019-11-02   12 years             4 years
"Marcus D. Johnson"   3847        1988-03-15   2019-11-02   11 years             4 years   ← DUPE SSN
"Antoine Williams"    9284        1991-07-22   2020-03-14   9 years              3 years
"A. M. Williams"      9284        1991-07-22   2020-03-14   9 years              3 years   ← DUPE SSN
"Priya Nair"          6631        1994-11-08   2020-08-19   8 years              3 years
"P. K. Nair"          6631        1994-11-08   2020-08-19   8 years              3 years   ← DUPE SSN
[+6 more with same pattern — each real SSN used by 2 slightly different name variants]

FUNDING PATTERN:
All 12 accounts funded via 3 external ACH routing numbers (all fintech prepaid accounts)
Payments posted on 1st of each month across all 12 — same-day automated timing
Average account seasoning: 16.4 months (consistent with synthetic identity maturation window)
Total credit exposure: $141,000 across 12 accounts`,

    discoverContext: `PHYSICAL CO-LOCATION IMPOSSIBILITIES — 4 confirmed pairs:

Pair 1: "Marcus Johnson" (DIS-034821) vs "Marcus D. Johnson" (DIS-034956):
  2024-08-14  2:14 PM — Whole Foods, Chicago IL (terminal TRM-04821, card-present)
  2024-08-14  2:41 PM — Shell Gas, Detroit MI (terminal TRM-08934, card-present)
  Chicago → Detroit: 4h 30min drive, 1h flight. Gap: 27 minutes. IMPOSSIBLE.

Pair 2: "Antoine Williams" (DIS-041928) vs "A. M. Williams" (DIS-042103):
  2024-09-03  11:23 AM — CVS Pharmacy, Dallas TX (terminal TRM-12847, card-present)
  2024-09-03  11:51 AM — Walgreens, Houston TX (terminal TRM-19203, card-present)
  Dallas → Houston: 3h 45min drive. Gap: 28 minutes. IMPOSSIBLE.

Pair 3: "Priya Nair" — 22-minute gap between Austin TX and San Antonio TX card-present txns.
Pair 4: Sixth matched pair — 31-minute gap between Newark NJ and Philadelphia PA.

DISCOVER ACCOUNT BEHAVIOR:
- 6 of 12 identities have Discover cards; all show same payment cadence as Cap One accounts
- Payments originate from same 3 ACH routing numbers as Cap One accounts
- All 6 Discover cards applied for within same 2-week window as paired Cap One accounts`,
  },

  {
    id: 'CASE-003',
    title: 'Flip Circuit',
    type: 'refund-fraud',
    typeLabel: 'Merchant–Cardholder Refund Fraud',
    riskLevel: 'high',
    summary: 'CircuitPlex Electronics, a Discover-network merchant in Miami, processed $2.1M in refunds against only $1.84M in sales over 6 months — a 114.5% refund ratio. 59% of refunds flowed to 23 Capital One accounts that have zero purchase history at the merchant. A single shift-lead employee processed 89% of all refunds after hours.',
    entities: { accounts: 23, merchants: 1, devices: 4, estimatedExposure: 1247000 },
    caponeContext: `RECEIVING ACCOUNTS — 23 Cap One accounts receiving credits from MID-9912 (CircuitPlex Electronics)

CRITICAL ANOMALY: 0 of 23 accounts have any PURCHASE history at this merchant.
All 23 received ONLY credits (return refunds), never any debits.

ACCOUNT CHARACTERISTICS:
Average account age: 8.3 months
19/23 accounts share 4 phone numbers (rotating across accounts — each phone linked to 4–6 accounts)
17/23 accounts use 3 email domains: @fastmail-x.com, @protonx.io, @tempinbox.net
All 23 opened in Miami-Dade or Broward County

REFUND AMOUNTS RECEIVED:
Total received from MID-9912: $1,247,000   Average per account: $54,217
Largest single credit: $4,983 (just below merchant's $5,000 manager-approval threshold)
All refunds posted between 9 PM and 2 AM

FUND DISPOSITION AFTER RECEIPT (within 48 hours):
78% → Zelle transfers to external accounts (unrecoverable)
14% → ATM cash withdrawals
8%  → Applied to reduce other Cap One balances`,

    discoverContext: `MERCHANT: MID-9912 "CircuitPlex Electronics" — Miami FL (MCC 5732)
Onboarded: 2023-09-18  |  Monthly volume avg: $340,000  |  Network fraud score: 0.02 (not flagged)

REFUND ANOMALIES (2024-01-01 to 2024-06-30):
Total sales processed:    $1,840,000
Total refunds processed:  $2,107,000   ← Refunds EXCEED gross sales
Refund ratio:             114.5%        ← Peer average for MCC 5732: 2.8%

EMPLOYEE PATTERN:
Employee E-0047 (T. Ramirez, shift lead):
  Processes 89% of all refunds (industry norm <25% for one employee)
  92% of his refund transactions occur 9 PM – 2 AM
  Override authority: up to $4,999 with no manager approval required
  Hire date: 2023-09-22 — 4 days after merchant was onboarded on Discover network

REFUND RECIPIENT BREAKDOWN BY ISSUER BIN:
Capital One BINs:  $1,247,000  (59.2%)
Chase BINs:          $412,000  (19.6%)
Other issuers:       $448,000  (21.2%)

MERCHANT FINANCIAL PROFILE:
Card revenue implied by processing volume: $340K/month
But merchant's bank account (not Cap One) shows $28,000/month in legitimate supplier invoices
Disconnect between processing volume and actual business operations is unexplained`,
  },

  {
    id: 'CASE-004',
    title: 'Café Blanco',
    type: 'structuring',
    typeLabel: 'Currency Structuring Network',
    riskLevel: 'high',
    summary: 'A restaurant group operated through 5 separate LLCs under a single beneficial owner deposits exclusively cash into 5 Capital One business accounts — each deposit carefully kept between $9,000 and $9,800, below the $10,000 CTR threshold. Discover\'s merchant processing data for the same 5 locations shows total card volume that implies a maximum cash business of ~$400K/month. The Cap One accounts receive $1.4M/month in cash deposits — a $1M/month gap with no explainable source.',
    entities: { accounts: 5, merchants: 5, devices: 0, estimatedExposure: 16765200 },
    caponeContext: `BUSINESS ACCOUNTS — Beneficial Owner: Hector R. Medina (DOB: 1971-04-18, EIN verified)
5 LLCs, all sole-owned by Medina, all banking exclusively with Capital One Business

Account      LLC Name                     Avg Daily Deposit   Deposit Range       Monthly Total
BIZ-091847   Café Blanco LLC              $9,340              $9,100 – $9,800     $280,200
BIZ-094201   White Cup Hospitality LLC    $9,280              $9,050 – $9,750     $278,400
BIZ-097834   Medina Dining Group LLC      $9,410              $9,200 – $9,850     $282,300
BIZ-102948   Sunrise Café Partners LLC    $9,190              $9,000 – $9,720     $275,700
BIZ-108371   HC Restaurant Holdings LLC   $9,350              $9,150 – $9,800     $280,500

Combined monthly deposits: $1,397,100
Annualized: $16,765,200

CTR HISTORY: 0 Currency Transaction Reports filed in 18 months of operation
Largest single deposit ever recorded: $9,847 (one dollar below $10,000 threshold)
Structuring pattern confidence (ML model): 0.97

ALL INFLOWS ARE CASH. No ACH, wire, card settlement, or third-party transfers on any account.
Outflows: payroll ($68K/month combined), food supplier invoices ($94K/month), rent ($41K/month)
Net monthly excess cash deposited but not explained by outflows: ~$1,194,100`,

    discoverContext: `MERCHANT PROCESSING — Same 5 restaurant locations on Discover network

Merchant           MID       Card Vol/Month   Card % of Total   Implied Cash Vol
Café Blanco        MID-4481   $38,200          13.6%             $242,000 (est.)
White Cup          MID-4892   $31,400          11.3%             $246,000 (est.)
Medina Dining      MID-5103   $29,800          10.6%             $252,500 (est.)
Sunrise Café       MID-5287   $35,100          12.8%             $239,700 (est.)
HC Restaurant      MID-5491   $33,600          12.0%             $246,900 (est.)

Total Discover card vol: $168,100/month
Estimated Visa/MC/Amex at same card penetration rate: ~$112,000/month
Total estimated card revenue: ~$280,000/month

INDUSTRY BENCHMARK: Full-service restaurants in this segment average 65-70% card, 30-35% cash
At 65% card penetration → implied TOTAL revenue: ~$430,000/month across all 5 locations

RECONCILIATION FAILURE:
Implied total revenue (card + cash):  ~$430,000/month
Cash deposits at Cap One:           $1,397,100/month
Unexplained excess:                   $967,100/month  ← 2.25× what the restaurants could generate

The 5 locations cannot produce enough revenue to explain the cash deposits.
Source of excess $967K/month in cash is unknown.`,
  },
]

// ── Agent Definitions ──────────────────────────────────────────────────────────

export interface AgentConfig {
  id: 'evidence' | 'patterns' | 'network' | 'strategy'
  title: string
  role: string
  phase: 1 | 2
  color: { bg: string; border: string; header: string; badge: string; text: string }
  systemPrompt: string
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'evidence',
    title: 'Evidence Collector',
    role: 'Extracts concrete facts from both datasets',
    phase: 1,
    color: {
      bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-700', text: 'text-blue-900',
    },
    systemPrompt: `You are an Evidence Collector agent at a joint Capital One / Discover financial crimes unit.
You have access to combined data from both institutions. Your task: produce a numbered list of every specific, verifiable fact from the provided data that is material to this investigation.
Rules: cite exact account IDs, dollar amounts, percentages, dates, merchant IDs, and employee IDs. No interpretation — facts only. Use two sections: CAPITAL ONE EVIDENCE and DISCOVER EVIDENCE.
Be thorough but concise. Plain text only, no markdown headers or bullets — use numbered lists within each section.`,
  },
  {
    id: 'patterns',
    title: 'Pattern Analyst',
    role: 'Identifies cross-network behavioral signals',
    phase: 1,
    color: {
      bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-600',
      badge: 'bg-violet-100 text-violet-700', text: 'text-violet-900',
    },
    systemPrompt: `You are a Pattern Analysis agent specializing in cross-institutional financial crime detection.
Structure your response in exactly three sections:
CAPITAL ONE SIGNAL (ALONE): What suspicious patterns are visible using only Cap One data?
DISCOVER SIGNAL (ALONE): What suspicious patterns are visible using only Discover data?
COMBINED SIGNAL: What new, materially different pattern emerges ONLY when both datasets are merged? This is the most important section — explain what was invisible to each institution independently.
Reference applicable FinCEN advisory typologies (FIN-2014-A008, FIN-2020-A008) where relevant. Be specific and direct.`,
  },
  {
    id: 'network',
    title: 'Network Mapper',
    role: 'Maps entity relationships and fund flows',
    phase: 1,
    color: {
      bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-600',
      badge: 'bg-amber-100 text-amber-700', text: 'text-amber-900',
    },
    systemPrompt: `You are a Network Mapping agent specializing in entity relationship analysis for financial investigations.
Identify and map every entity in the case: accounts, individuals, devices, merchants, and funds. Structure your response as:
HUB ENTITY: Who or what is at the center of this network?
NODE MAP: List each entity, what institution they appear in, and their role (controller / mule / facilitator / recipient)
FUND FLOW: Trace the path of money from origin to destination in numbered steps
CROSS-INSTITUTION BRIDGES: Which specific entities or signals appear in BOTH datasets and link the two sides?
Be precise — use the actual IDs from the data.`,
  },
  {
    id: 'strategy',
    title: 'Case Strategist',
    role: 'Synthesizes findings into an actionable brief',
    phase: 2,
    color: {
      bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-red-700',
      badge: 'bg-rose-100 text-rose-700', text: 'text-rose-900',
    },
    systemPrompt: `You are a senior BSA/AML investigator and Case Strategy agent at a major financial institution.
You will receive findings from three specialist agents. Synthesize them into a structured Investigation Brief:
RISK RATING: Critical / High / Medium — one sentence justification
ESTIMATED EXPOSURE: Dollar amount at risk across both institutions
IMMEDIATE ACTIONS: Exactly 4 specific, numbered actions to take in the next 48 hours
SAR RECOMMENDATION: File / Do Not File / Escalate to FinCEN or law enforcement — cite the specific basis (31 CFR 1020.320 or equivalent)
COMBINED DATA ADVANTAGE: In 2-3 sentences, articulate what this case proves about the value of merged Capital One + Discover data that neither institution could see alone. Make this compelling — it is the core of the strategic argument.
Be authoritative, specific, and direct. No hedging.`,
  },
]

// ── Prompt Builders ────────────────────────────────────────────────────────────

export function buildPhase1Prompt(agent: AgentConfig, c: AgentCase): string {
  return `INVESTIGATION CASE: ${c.id} — ${c.title}
Type: ${c.typeLabel}  |  Risk Level: ${c.riskLevel.toUpperCase()}

CASE SUMMARY:
${c.summary}

CAPITAL ONE DATA EXCERPT:
${c.caponeContext}

DISCOVER DATA EXCERPT:
${c.discoverContext}

Your task: ${agent.role}. Apply your specialist role to the above data.`
}

export function buildStrategistPrompt(c: AgentCase, findings: Record<string, string>): string {
  return `INVESTIGATION CASE: ${c.id} — ${c.title}  (${c.typeLabel})

CASE SUMMARY:
${c.summary}

EVIDENCE COLLECTED:
${findings['evidence'] ?? '(unavailable)'}

PATTERN ANALYSIS:
${findings['patterns'] ?? '(unavailable)'}

NETWORK MAP:
${findings['network'] ?? '(unavailable)'}

Now produce the Investigation Brief as instructed.`
}
