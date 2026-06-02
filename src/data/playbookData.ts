// ── Detection Playbook ────────────────────────────────────────────────────────
// Maps FinCEN advisory guidance → computational detection rule → data requirements
// → per-institution capability and combined insight

export interface DataField {
  name: string
  type: 'transaction' | 'merchant' | 'device' | 'geographic' | 'temporal'
  source: 'capone' | 'discover' | 'both'
  description: string
}

export interface EvidenceMetric {
  label: string
  observed: string
  threshold: string
  triggered: boolean
}

export interface CaseEvidence {
  caseId: string
  finding: string
  metrics: EvidenceMetric[]
}

export interface DetectionScript {
  language: 'sql' | 'python'
  altLanguage: 'sql' | 'python'
  tables: Array<{ name: string; source: 'capone' | 'discover' | 'combined' }>
  code: string
  altCode: string
  classification: { flagged: string; review: string; pass: string }
}

export interface PlaybookRule {
  categoryId: string
  ruleId: string
  advisoryRef: string
  advisoryUrl: string
  advisoryTitle: string
  advisoryGuidance: string
  detectionObjective: string
  computationalSteps: string[]
  dataFields: DataField[]
  caponeAlone: { capability: string; limitation: string }
  discoverAlone: { capability: string; limitation: string }
  combined: { capability: string; uniqueInsight: string }
  triggeredCases: string[]
  evidence: CaseEvidence[]
  script: DetectionScript
}

export const PLAYBOOK_RULES: PlaybookRule[] = [
  {
    categoryId: '14-MCC',
    ruleId: 'HT-1',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryTitle: 'Guidance on Recognizing Activity that May be Associated with Human Smuggling and Human Trafficking — Financial Red Flags',
    advisoryGuidance:
      'FIN-2014-A008 identifies transactions at hotels, motels, massage parlors, escort services, and adult entertainment venues as red flags — particularly when multiple indicators cluster at the same merchant or geographic area. The absence of ordinary consumer spending patterns alongside concentration in these merchant categories is itself a financial red flag.',
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
    evidence: [
      {
        caseId: 'CORR-001',
        finding: 'CAP-004821: 100% of spend in trafficking MCCs over 18 days; Hotel→ATM sequence repeated 6× along I-95',
        metrics: [
          { label: 'Trafficking MCC ratio', observed: '~85%', threshold: '>70%', triggered: true },
          { label: 'Hotel→ATM sequences', observed: '6', threshold: '≥2', triggered: true },
          { label: 'Cross-issuer BIN clustering', observed: '8–14 BINs at 5 merchants', threshold: '≥8 BINs', triggered: true },
        ],
      },
      {
        caseId: 'CORR-002',
        finding: 'CAP-007342: New account (34 days) immediately exhibits trafficking MCC dominance; Beaumont merchant flagged as repeat nexus',
        metrics: [
          { label: 'Trafficking MCC ratio', observed: '~80%', threshold: '>70%', triggered: true },
          { label: 'Hotel→ATM sequences', observed: '4', threshold: '≥2', triggered: true },
          { label: 'Merchant nexus events', observed: '3 events in 45 days', threshold: '≥3 events', triggered: true },
        ],
      },
      {
        caseId: 'FRONT-001',
        finding: 'MID-0003847: MCC 7297 volume 6.5× peer median; 91% CNP for a declared in-person massage parlor',
        metrics: [
          { label: 'Volume vs MCC peer', observed: '$182K vs $28K (6.5×)', threshold: '>2.5×', triggered: true },
          { label: 'CNP rate (in-person MCC)', observed: '91%', threshold: '>70%', triggered: true },
        ],
      },
      {
        caseId: 'FRONT-002',
        finding: 'MID-0005123: 97% CNP for a declared car service; avg ticket $43 vs peer $18 (2.4×)',
        metrics: [
          { label: 'CNP rate (in-person MCC)', observed: '97%', threshold: '>70%', triggered: true },
          { label: 'Avg ticket vs peer', observed: '$43 vs $18 (2.4×)', threshold: '>1.5×', triggered: true },
        ],
      },
    ],
    script: {
      language: 'sql',
      tables: [
        { name: 'capone.transactions', source: 'capone' },
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'combined.merchant_map', source: 'combined' },
      ],
      code: `-- ① Cap One: per-cardholder trafficking-MCC ratio (rolling 30 days)
WITH mcc_ratio AS (
  SELECT cardholder_id,
    ROUND(
      SUM(amount) FILTER (WHERE mcc IN ('7011','4121','6540','6010','7297','7299'))
      / NULLIF(SUM(amount), 0), 3
    ) AS ht_ratio
  FROM capone.transactions
  WHERE txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
),
-- ② Cap One: hotel → cash/prepaid sequence within same city, 4-hour window
sequences AS (
  SELECT h.cardholder_id, COUNT(*) AS seq_count
  FROM capone.transactions h
  JOIN capone.transactions c
    ON  h.cardholder_id = c.cardholder_id AND h.city = c.city
    AND h.mcc = '7011' AND c.mcc IN ('6010','6540')
    AND c.txn_ts BETWEEN h.txn_ts AND h.txn_ts + INTERVAL '4 hours'
  WHERE h.txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY h.cardholder_id
),
-- ③ Discover: peak cross-issuer BIN count per merchant per 4-hr window
bin_clusters AS (
  SELECT mm.capone_mid,
    MAX(COUNT(DISTINCT LEFT(bin, 6)))
      OVER (PARTITION BY da.merchant_id) AS peak_bins
  FROM discover.authorizations da
  JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id
  WHERE auth_ts >= NOW() - INTERVAL '30 days'
  GROUP BY mm.capone_mid, da.merchant_id, DATE_TRUNC('hour', auth_ts)
)
-- ④ Join all signals and classify
SELECT r.cardholder_id, r.ht_ratio,
  COALESCE(s.seq_count, 0)  AS hotel_cash_sequences,
  COALESCE(bc.peak_bins, 0) AS peak_cross_issuer_bins,
  CASE
    WHEN r.ht_ratio > 0.70 AND COALESCE(s.seq_count, 0) >= 2 THEN 'FLAGGED'
    WHEN COALESCE(bc.peak_bins, 0) >= 8                       THEN 'FLAGGED'
    WHEN r.ht_ratio > 0.50                                    THEN 'REVIEW'
    ELSE 'PASS'
  END AS ht1_status
FROM mcc_ratio r
LEFT JOIN sequences s  ON s.cardholder_id = r.cardholder_id
LEFT JOIN capone.transactions t ON t.cardholder_id = r.cardholder_id
LEFT JOIN bin_clusters bc ON bc.capone_mid = t.merchant_id
GROUP BY r.cardholder_id, r.ht_ratio, s.seq_count, bc.peak_bins
ORDER BY r.ht_ratio DESC;`,
      altLanguage: 'python',
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine  = create_engine("postgresql+psycopg2://user:pass@host/db")
HT_MCCS = {'7011','4121','6540','6010','7297','7299'}

# ① Cap One: trafficking-MCC ratio per cardholder (rolling 30 days)
txns = pd.read_sql(
    "SELECT cardholder_id, mcc, amount, txn_ts, city, merchant_id "
    "FROM capone.transactions WHERE txn_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['txn_ts'])
mcc_ratio = (txns.assign(is_ht=txns.mcc.isin(HT_MCCS))
    .groupby('cardholder_id')
    .apply(lambda g: g.loc[g.is_ht,'amount'].sum() / g.amount.sum())
    .rename('ht_ratio').reset_index())

# ② Cap One: hotel → cash sequence within same city, ≤4 hours
hotels = txns[txns.mcc=='7011'][['cardholder_id','city','txn_ts']].rename(columns={'txn_ts':'h_ts'})
cash   = txns[txns.mcc.isin({'6010','6540'})][['cardholder_id','city','txn_ts']].rename(columns={'txn_ts':'c_ts'})
seqs   = (hotels.merge(cash, on=['cardholder_id','city'])
    .pipe(lambda d: d[(d.c_ts - d.h_ts).dt.total_seconds().between(0, 14400)])
    .groupby('cardholder_id').size().rename('seq_count').reset_index())

# ③ Discover: peak cross-issuer BIN count per merchant per 4-hr window
auths = pd.read_sql(
    "SELECT mm.capone_mid AS mid, LEFT(da.bin,6) AS bin6, "
    "DATE_TRUNC('hour', da.auth_ts) AS hr "
    "FROM discover.authorizations da "
    "JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id "
    "WHERE da.auth_ts >= NOW() - INTERVAL '30 days'", engine)
peak_bins = (auths.groupby(['mid','hr']).bin6.nunique()
    .groupby('mid').max().rename('peak_bins').reset_index())

# ④ Join and classify
result = mcc_ratio.merge(seqs, on='cardholder_id', how='left').fillna({'seq_count': 0})
m2c    = txns[['cardholder_id','merchant_id']].drop_duplicates()
result = (result.merge(m2c, on='cardholder_id', how='left')
    .merge(peak_bins.rename(columns={'mid':'merchant_id'}), on='merchant_id', how='left')
    .fillna({'peak_bins': 0}))
result['ht1_status'] = result.apply(lambda r: (
    'FLAGGED' if (r.ht_ratio > 0.70 and r.seq_count >= 2) or r.peak_bins >= 8
    else 'REVIEW' if r.ht_ratio > 0.50 else 'PASS'), axis=1)
print(result[['cardholder_id','ht_ratio','seq_count','peak_bins','ht1_status']]
      .sort_values('ht_ratio', ascending=False))`,
      classification: {
        flagged: 'ht_ratio > 0.70 AND sequences ≥ 2  OR  peak cross-issuer BINs ≥ 8',
        review:  'ht_ratio > 0.50 with no confirmed sequence or clustering',
        pass:    'ht_ratio ≤ 0.50 and no high-BIN clustering at shared merchants',
      },
    },
  },

  {
    categoryId: '14-Cash',
    ruleId: 'HT-2',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryTitle: 'Guidance on Recognizing Activity that May be Associated with Human Smuggling and Human Trafficking — Financial Red Flags',
    advisoryGuidance:
      'FIN-2014-A008 identifies frequent purchase or reload of prepaid access cards, money orders, or ATM cash advances as red flags — particularly when amounts appear structured to avoid the $10,000 CTR threshold and when combined with trafficking-adjacent merchant activity.',
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
    evidence: [
      {
        caseId: 'CORR-001',
        finding: 'CAP-004821: $2,200 ATM + $1,000 prepaid = $3,200 cash-equivalent (64% of total spend) across 6 corridor stops',
        metrics: [
          { label: 'Cash velocity ratio', observed: '64% ($3,200 / ~$5K)', threshold: '≥55%', triggered: true },
          { label: 'ATM withdrawals (MCC 6010)', observed: '$2,200 across 6 events', threshold: 'Combined with ≥55% velocity', triggered: true },
          { label: 'Prepaid reloads (MCC 6540)', observed: '$1,000 across 2 events', threshold: 'Combined with ≥55% velocity', triggered: true },
        ],
      },
      {
        caseId: 'CORR-002',
        finding: 'CAP-007342: $1,200 ATM + $1,000 prepaid = $2,200 cash-equivalent (63% of total spend) across 5 corridor stops',
        metrics: [
          { label: 'Cash velocity ratio', observed: '63% ($2,200 / ~$3.5K)', threshold: '≥55%', triggered: true },
          { label: 'ATM withdrawals (MCC 6010)', observed: '$1,200 across 3 events', threshold: 'Combined with ≥55% velocity', triggered: true },
          { label: 'Prepaid reloads (MCC 6540)', observed: '$1,000 across 2 events', threshold: 'Combined with ≥55% velocity', triggered: true },
        ],
      },
      {
        caseId: 'CTRL-001',
        finding: '9 accounts across 6 issuers: $28,400 combined cash-out over 21 days at 3 shared Atlanta merchants',
        metrics: [
          { label: 'Combined cash-out', observed: '$28,400 over 21 days', threshold: 'Confirmed by cross-issuer convergence', triggered: true },
          { label: 'Cap One accounts (cash)', observed: '$14,200 (4 accounts)', threshold: 'Shared device cluster confirmed', triggered: true },
          { label: 'Other-issuer accounts', observed: '$14,200 (5 accounts)', threshold: 'Terminal IP cross-match confirmed', triggered: true },
        ],
      },
    ],
    script: {
      language: 'sql',
      tables: [
        { name: 'capone.transactions', source: 'capone' },
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'combined.merchant_map', source: 'combined' },
      ],
      code: `-- ① Cap One: ATM + prepaid cash velocity per cardholder (rolling 30 days)
WITH cash_summary AS (
  SELECT cardholder_id,
    SUM(amount) FILTER (WHERE mcc = '6010')  AS atm_total,
    SUM(amount) FILTER (WHERE mcc = '6540')  AS prepaid_total,
    ROUND(
      SUM(amount) FILTER (WHERE mcc IN ('6010','6540'))
      / NULLIF(SUM(amount), 0), 3
    ) AS cash_velocity
  FROM capone.transactions
  WHERE txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
),
-- ② Cap One: structuring — 3+ cash txns $3K–$9.9K within any 7-day window
structuring AS (
  SELECT DISTINCT cardholder_id FROM (
    SELECT cardholder_id,
      COUNT(*) OVER (
        PARTITION BY cardholder_id ORDER BY txn_ts
        RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
      ) AS rolling_count
    FROM capone.transactions
    WHERE mcc IN ('6010','6540')
      AND amount BETWEEN 3000 AND 9900
      AND txn_ts >= NOW() - INTERVAL '30 days'
  ) w WHERE rolling_count >= 3
),
-- ③ Discover: prepaid reload volume at the cardholder's merchant stops
discover_prepaid AS (
  SELECT mm.capone_mid, COUNT(*) AS prepaid_hits
  FROM discover.authorizations da
  JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id
  WHERE da.mcc = '6540' AND da.auth_ts >= NOW() - INTERVAL '30 days'
  GROUP BY mm.capone_mid
)
-- ④ Join and classify
SELECT cs.cardholder_id, cs.atm_total, cs.prepaid_total, cs.cash_velocity,
  (st.cardholder_id IS NOT NULL)       AS structuring_flag,
  COALESCE(SUM(dp.prepaid_hits), 0)    AS discover_prepaid_at_stops,
  CASE
    WHEN cs.cash_velocity >= 0.55      THEN 'FLAGGED'
    WHEN st.cardholder_id IS NOT NULL  THEN 'FLAGGED'
    WHEN cs.cash_velocity >= 0.40      THEN 'REVIEW'
    ELSE 'PASS'
  END AS ht2_status
FROM cash_summary cs
LEFT JOIN structuring st USING (cardholder_id)
LEFT JOIN capone.transactions t USING (cardholder_id)
LEFT JOIN discover_prepaid dp ON dp.capone_mid = t.merchant_id
GROUP BY cs.cardholder_id, cs.atm_total, cs.prepaid_total,
         cs.cash_velocity, st.cardholder_id
ORDER BY cs.cash_velocity DESC NULLS LAST;`,
      altLanguage: 'python',
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Cap One: ATM + prepaid cash velocity per cardholder (rolling 30 days)
txns = pd.read_sql(
    "SELECT cardholder_id, mcc, amount, txn_ts, merchant_id "
    "FROM capone.transactions WHERE txn_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['txn_ts'])
cash_summary = (txns.groupby('cardholder_id').apply(lambda g: pd.Series({
    'atm_total':     g.loc[g.mcc=='6010','amount'].sum(),
    'prepaid_total': g.loc[g.mcc=='6540','amount'].sum(),
    'cash_velocity': g.loc[g.mcc.isin({'6010','6540'}),'amount'].sum() / g.amount.sum().clip(lower=1)
})).reset_index())

# ② Cap One: structuring — 3+ cash txns $3K–$9.9K within any 7-day window
cash_txns = txns[txns.mcc.isin({'6010','6540'}) & txns.amount.between(3000, 9900)].sort_values('txn_ts')
def has_structuring(g):
    for _, row in g.iterrows():
        if len(g[(g.txn_ts >= row.txn_ts) & (g.txn_ts <= row.txn_ts + pd.Timedelta('7D'))]) >= 3:
            return True
    return False
structuring = cash_txns.groupby('cardholder_id').apply(has_structuring).rename('structuring_flag').reset_index()

# ③ Discover: prepaid reloads at the same merchant stops
disc_prepaid = pd.read_sql(
    "SELECT mm.capone_mid AS mid, COUNT(*) AS prepaid_hits "
    "FROM discover.authorizations da "
    "JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id "
    "WHERE da.mcc='6540' AND da.auth_ts >= NOW()-INTERVAL '30 days' "
    "GROUP BY mm.capone_mid", engine)

# ④ Join and classify
result = cash_summary.merge(structuring, on='cardholder_id', how='left').fillna({'structuring_flag': False})
m2c    = txns[['cardholder_id','merchant_id']].drop_duplicates()
result = (result.merge(m2c, on='cardholder_id', how='left')
    .merge(disc_prepaid.rename(columns={'mid':'merchant_id'}), on='merchant_id', how='left')
    .fillna({'prepaid_hits': 0}))
result['ht2_status'] = result.apply(lambda r: (
    'FLAGGED' if r.cash_velocity >= 0.55 or r.structuring_flag
    else 'REVIEW' if r.cash_velocity >= 0.40 else 'PASS'), axis=1)
print(result[['cardholder_id','atm_total','prepaid_total','cash_velocity','structuring_flag','ht2_status']]
      .sort_values('cash_velocity', ascending=False))`,
      classification: {
        flagged: 'cash_velocity ≥ 0.55  OR  structuring_flag = true (3+ txns $3K–$9.9K in 7 days)',
        review:  'cash_velocity ≥ 0.40 and no structuring pattern detected',
        pass:    'cash_velocity < 0.40 and no structured cash transactions',
      },
    },
  },

  {
    categoryId: '14-Geo',
    ruleId: 'HT-3',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryTitle: 'Guidance on Recognizing Activity that May be Associated with Human Smuggling and Human Trafficking — Financial Red Flags',
    advisoryGuidance:
      'FIN-2014-A008 flags customers who frequently appear to move through and transact from multiple cities or states within short timeframes, especially when combined with trafficking-adjacent MCC activity at each stop. Repeat appearances at the same merchant location by multiple different cardholder groups indicate the venue may be a trafficking nexus.',
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
    evidence: [
      {
        caseId: 'CORR-001',
        finding: 'CAP-004821: Boston → Providence → NYC → Philadelphia → Baltimore → DC — 6 cities in 18 days; all 5 hotel stops on I-95 Discover network',
        metrics: [
          { label: 'Distinct cities (21-day window)', observed: '6 cities in 18 days', threshold: '≥4 cities in ≤14 days', triggered: true },
          { label: 'I-95 corridor segment match', observed: '6/6 stops on I-95 route', threshold: 'Route segment match', triggered: true },
          { label: 'Discover hotel BIN clustering', observed: '8–14 cross-issuer BINs per stop', threshold: 'Multi-issuer co-occurrence', triggered: true },
        ],
      },
      {
        caseId: 'CORR-002',
        finding: 'CAP-007342: Houston → Beaumont → New Orleans → Mobile → Jacksonville — 5 cities in 10 days on I-10 Southern; Beaumont merchant 3rd event in 45 days',
        metrics: [
          { label: 'Distinct cities (21-day window)', observed: '5 cities in 10 days', threshold: '≥4 cities in ≤14 days', triggered: true },
          { label: 'I-10 corridor segment match', observed: '5/5 stops on I-10 route', threshold: 'Route segment match', triggered: true },
          { label: 'Merchant nexus (MID-0001102)', observed: 'Beaumont, TX — 3rd distinct group in 45 days', threshold: '≥3 events in 45 days', triggered: true },
        ],
      },
    ],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'capone.transactions', source: 'capone' },
        { name: 'capone.cardholders', source: 'capone' },
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'combined.merchant_map', source: 'combined' },
        { name: 'combined.city_distances', source: 'combined' },
      ],
      code: `-- ① Cap One: per-cardholder movement summary (rolling 21 days)
WITH movement AS (
  SELECT cardholder_id,
    COUNT(DISTINCT city || ',' || state)         AS distinct_cities,
    EXTRACT(DAY FROM MAX(txn_ts) - MIN(txn_ts))  AS travel_days
  FROM capone.transactions
  WHERE txn_ts >= NOW() - INTERVAL '21 days'
  GROUP BY cardholder_id
),
-- ② Cap One: impossible-travel — same cardholder, same day, cities >200 miles apart
impossible AS (
  SELECT a.cardholder_id, COUNT(*) AS impossible_events
  FROM capone.transactions a
  JOIN capone.transactions b
    ON  a.cardholder_id = b.cardholder_id
    AND DATE(a.txn_ts) = DATE(b.txn_ts) AND a.city <> b.city
  JOIN combined.city_distances cd
    ON cd.city_a = a.city AND cd.city_b = b.city
    AND cd.distance_miles > 200
  WHERE a.txn_ts >= NOW() - INTERVAL '21 days'
  GROUP BY a.cardholder_id
),
-- ③ Discover: venue nexus — same merchant hosted 3+ distinct groups in 45 days
venue_nexus AS (
  SELECT mm.capone_mid
  FROM discover.authorizations da
  JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id
  WHERE da.auth_ts >= NOW() - INTERVAL '45 days'
  GROUP BY mm.capone_mid, DATE_TRUNC('week', da.auth_ts)
  HAVING COUNT(DISTINCT LEFT(da.bin, 6)) >= 3
)
-- ④ Join and classify
SELECT m.cardholder_id, m.distinct_cities, m.travel_days,
  COALESCE(i.impossible_events, 0)  AS impossible_travel_events,
  COUNT(DISTINCT vn.capone_mid)     AS nexus_venues_visited,
  CASE
    WHEN m.distinct_cities >= 4 AND m.travel_days <= 14 THEN 'FLAGGED'
    WHEN COALESCE(i.impossible_events, 0) >= 1          THEN 'FLAGGED'
    WHEN m.distinct_cities >= 3                         THEN 'REVIEW'
    ELSE 'PASS'
  END AS ht3_status
FROM movement m
LEFT JOIN impossible i USING (cardholder_id)
LEFT JOIN capone.transactions t USING (cardholder_id)
LEFT JOIN venue_nexus vn ON vn.capone_mid = t.merchant_id
GROUP BY m.cardholder_id, m.distinct_cities, m.travel_days, i.impossible_events
ORDER BY m.distinct_cities DESC;`,
      altCode: `import pandas as pd
from geopy.distance import geodesic
from sqlalchemy import create_engine
engine   = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Cap One: per-cardholder movement summary (rolling 21 days)
txns = pd.read_sql(
    "SELECT cardholder_id, city, state, txn_ts, merchant_id "
    "FROM capone.transactions WHERE txn_ts >= NOW() - INTERVAL '21 days'",
    engine, parse_dates=['txn_ts'])
movement = (txns.groupby('cardholder_id')
    .agg(distinct_cities=('city','nunique'),
         travel_days=('txn_ts', lambda x: (x.max()-x.min()).days))
    .reset_index())

# ② Cap One: impossible-travel — same cardholder, same day, cities > 200 miles
city_coords = pd.read_sql("SELECT city, lat, lon FROM combined.city_distances", engine)
city_ll = dict(zip(city_coords.city, zip(city_coords.lat, city_coords.lon)))
def impossible_travel(g):
    g['date'] = g.txn_ts.dt.date
    count = 0
    for _, grp in g.groupby('date'):
        cities = grp['city'].unique()
        for i, c1 in enumerate(cities):
            for c2 in cities[i+1:]:
                if c1 in city_ll and c2 in city_ll:
                    if geodesic(city_ll[c1], city_ll[c2]).miles > 200:
                        count += 1
    return count
imp = txns.groupby('cardholder_id').apply(impossible_travel).rename('impossible_events').reset_index()

# ③ Discover: venue nexus — merchant hosted 3+ distinct BIN groups in 45 days
venue_nexus = pd.read_sql(
    "SELECT mm.capone_mid FROM discover.authorizations da "
    "JOIN combined.merchant_map mm ON mm.discover_mid=da.merchant_id "
    "WHERE da.auth_ts >= NOW()-INTERVAL '45 days' "
    "GROUP BY mm.capone_mid, DATE_TRUNC('week',da.auth_ts) "
    "HAVING COUNT(DISTINCT LEFT(da.bin,6)) >= 3", engine)
nexus_mids = set(venue_nexus.capone_mid)

# ④ Join and classify
result = movement.merge(imp, on='cardholder_id', how='left').fillna({'impossible_events': 0})
result['ht3_status'] = result.apply(lambda r: (
    'FLAGGED' if (r.distinct_cities >= 4 and r.travel_days <= 14) or r.impossible_events >= 1
    else 'REVIEW' if r.distinct_cities >= 3 else 'PASS'), axis=1)
print(result[['cardholder_id','distinct_cities','travel_days','impossible_events','ht3_status']]
      .sort_values('distinct_cities', ascending=False))`,
      classification: {
        flagged: '≥ 4 distinct cities in ≤ 14 days  OR  impossible-travel event detected',
        review:  '3 cities in 21-day window (elevated but below threshold)',
        pass:    '≤ 2 distinct cities OR travel span > 14 days',
      },
    },
  },

  {
    categoryId: '14-Time',
    ruleId: 'HT-4',
    advisoryRef: 'FIN-2014-A008',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
    advisoryTitle: 'Guidance on Recognizing Activity that May be Associated with Human Smuggling and Human Trafficking — Financial Red Flags',
    advisoryGuidance:
      'FIN-2014-A008 identifies transactional activity that largely occurs outside of normal business operating hours as a red flag — for example, an establishment that operates during the day having a large number of transactions at night. A spa, massage parlor, or transportation service with activity concentrated in late-night hours is inconsistent with its declared business model.',
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
    evidence: [
      {
        caseId: 'FRONT-001',
        finding: 'MID-0003847 (Sunrise Relaxation Spa, Las Vegas): 84% of $182K monthly volume falls between 10 PM–4 AM — 5.6× MCC 7297 peer benchmark',
        metrics: [
          { label: 'After-hours ratio (10 PM–4 AM)', observed: '84%', threshold: '≥2× MCC peer (~15%)', triggered: true },
          { label: 'Peer multiple', observed: '5.6× (84% vs 15% peer)', threshold: '≥2×', triggered: true },
          { label: 'Zero-daytime days', observed: '6 of 14 days — no transactions 9 AM–7 PM', threshold: 'Declared business hours', triggered: true },
        ],
      },
      {
        caseId: 'FRONT-002',
        finding: 'MID-0005123 (Express Transportation LLC, Miami): 79% of $94K monthly volume falls between 10 PM–5 AM — 4.4× MCC 4121 peer benchmark',
        metrics: [
          { label: 'After-hours ratio (10 PM–5 AM)', observed: '79%', threshold: '≥2× MCC peer (~18%)', triggered: true },
          { label: 'Peer multiple', observed: '4.4× (79% vs 18% peer)', threshold: '≥2×', triggered: true },
          { label: 'Night-hour dollar volume', observed: '$74,260 of $94K/month after 10 PM', threshold: 'Absolute + relative threshold', triggered: true },
        ],
      },
    ],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'discover.merchants', source: 'discover' },
        { name: 'capone.transactions', source: 'capone' },
      ],
      code: `-- ① Discover: per-merchant after-hours ratio (22:00–04:00) vs MCC peer
WITH merchant_hours AS (
  SELECT da.merchant_id, dm.mcc, dm.name, dm.declared_hours_open,
    COUNT(*) FILTER (
      WHERE EXTRACT(HOUR FROM da.auth_ts) >= 22
         OR EXTRACT(HOUR FROM da.auth_ts) <  4
    )::FLOAT / NULLIF(COUNT(*), 0) AS night_ratio,
    COUNT(*) AS total_auths
  FROM discover.authorizations da
  JOIN discover.merchants dm USING (merchant_id)
  WHERE da.auth_ts >= NOW() - INTERVAL '30 days'
    AND dm.mcc IN ('7011','7297','7299','4121')
  GROUP BY da.merchant_id, dm.mcc, dm.name, dm.declared_hours_open
),
-- ② Discover: MCC peer night-ratio baseline
peer_bench AS (
  SELECT mcc, AVG(night_ratio) AS peer_night_ratio
  FROM merchant_hours
  GROUP BY mcc
),
-- ③ Cap One: cardholder after-hours spend ratio at trafficking MCCs
card_hours AS (
  SELECT cardholder_id,
    COUNT(*) FILTER (
      WHERE (EXTRACT(HOUR FROM txn_ts) >= 22 OR EXTRACT(HOUR FROM txn_ts) < 4)
        AND mcc IN ('7011','7297','7299','4121')
    )::FLOAT / NULLIF(COUNT(*), 0) AS ch_night_ratio
  FROM capone.transactions
  WHERE txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
)
-- ④ Score merchants; join cardholder night-ratio for compounded signal
SELECT mh.merchant_id, mh.name, mh.mcc,
  ROUND(mh.night_ratio::NUMERIC, 3)                                      AS night_ratio,
  ROUND(pb.peer_night_ratio::NUMERIC, 3)                                 AS peer_ratio,
  ROUND((mh.night_ratio / NULLIF(pb.peer_night_ratio,0))::NUMERIC, 1)   AS peer_multiple,
  CASE
    WHEN mh.night_ratio / NULLIF(pb.peer_night_ratio, 0) >= 2.0 THEN 'FLAGGED'
    WHEN mh.night_ratio / NULLIF(pb.peer_night_ratio, 0) >= 1.5 THEN 'REVIEW'
    ELSE 'PASS'
  END AS ht4_status
FROM merchant_hours mh
JOIN peer_bench pb USING (mcc)
WHERE mh.total_auths >= 50   -- exclude thin-data merchants
ORDER BY peer_multiple DESC;`,
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine      = create_engine("postgresql+psycopg2://user:pass@host/db")
HT_MCCS     = {'7011','7297','7299','4121'}
NIGHT_HOURS = set(range(22, 24)) | set(range(0, 4))

# ① Discover: per-merchant after-hours ratio vs MCC peer
auths = pd.read_sql(
    "SELECT da.merchant_id, dm.mcc, dm.name, da.auth_ts "
    "FROM discover.authorizations da "
    "JOIN discover.merchants dm USING (merchant_id) "
    "WHERE da.auth_ts >= NOW() - INTERVAL '30 days' "
    "AND dm.mcc IN ('7011','7297','7299','4121')",
    engine, parse_dates=['auth_ts'])
auths['is_night'] = auths.auth_ts.dt.hour.isin(NIGHT_HOURS)
merch_ratios = (auths.groupby(['merchant_id','mcc','name'])
    .apply(lambda g: pd.Series({
        'night_ratio': g.is_night.sum() / max(len(g), 1),
        'total_auths':  len(g)}))
    .reset_index())

# ② MCC peer benchmark — average night ratio per MCC
peer = merch_ratios.groupby('mcc').night_ratio.mean().rename('peer_ratio').reset_index()
merch_ratios = merch_ratios.merge(peer, on='mcc')
merch_ratios['peer_multiple'] = (merch_ratios.night_ratio
    / merch_ratios.peer_ratio.clip(lower=1e-6))

# ③ Cap One: cardholder after-hours spend at trafficking MCCs
txns = pd.read_sql(
    "SELECT cardholder_id, mcc, txn_ts FROM capone.transactions "
    "WHERE txn_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['txn_ts'])
txns['is_night_ht'] = txns.txn_ts.dt.hour.isin(NIGHT_HOURS) & txns.mcc.isin(HT_MCCS)
card_night = (txns.groupby('cardholder_id')
    .apply(lambda g: g.is_night_ht.sum() / max(len(g), 1))
    .rename('ch_night_ratio').reset_index())

# ④ Classify merchants (exclude thin-data merchants < 50 auths)
subset = merch_ratios[merch_ratios.total_auths >= 50].copy()
subset['ht4_status'] = subset.peer_multiple.map(
    lambda m: 'FLAGGED' if m >= 2.0 else 'REVIEW' if m >= 1.5 else 'PASS')
print(subset[['merchant_id','name','night_ratio','peer_ratio','peer_multiple','ht4_status']]
      .sort_values('peer_multiple', ascending=False))`,
      classification: {
        flagged: 'night_ratio ≥ 2.0× MCC peer benchmark (e.g. 84% vs 15% peer = 5.6×)',
        review:  'night_ratio 1.5×–2.0× peer benchmark — elevated, needs investigation',
        pass:    'night_ratio < 1.5× peer  OR  fewer than 50 authorizations in window',
      },
    },
  },

  {
    categoryId: '20-T1',
    ruleId: 'HT-5',
    advisoryRef: 'FIN-2020-A008, Typology 1',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
    advisoryTitle: 'Supplemental Advisory on Identifying and Reporting Human Trafficking and Related Activity',
    advisoryGuidance:
      'FIN-2020-A008 Typology 1 (Front Companies) describes licit and illicit businesses used to conceal human trafficking and launder its proceeds — including massage parlors, nail salons, bars, restaurants, and spas. Indicators include transaction volume, hours, or customer profile inconsistent with the declared business type and location.',
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
    evidence: [
      {
        caseId: 'FRONT-001',
        finding: 'MID-0003847: All 4 front-business flags simultaneously triggered. Cap One commercial match to Sunrise Wellness Group LLC (COMM-00312) identified $750K credit exposure.',
        metrics: [
          { label: 'Volume vs MCC 7297 peer', observed: '$182K vs $28K (6.5×)', threshold: '>2.5× peer median', triggered: true },
          { label: 'Card-not-present rate', observed: '91%', threshold: '>70% for in-person MCC', triggered: true },
          { label: 'Chargeback rate (14 months)', observed: '0.00%', threshold: '<0.2% (absence anomaly)', triggered: true },
          { label: 'After-hours volume', observed: '84%', threshold: '>2× MCC peer', triggered: true },
          { label: 'Front-business score', observed: '4/4 flags → immediate escalation', threshold: '≥3/4', triggered: true },
          { label: 'Commercial credit match', observed: '$750K facility — Sunrise Wellness Group LLC', threshold: 'Any commercial match', triggered: true },
        ],
      },
      {
        caseId: 'FRONT-002',
        finding: 'MID-0005123: 3 of 4 front-business flags triggered. No Cap One commercial relationship, but 3 cardholders cross-reference to CORR-001 active SAR.',
        metrics: [
          { label: 'Volume vs MCC 4121 peer', observed: '$94K vs $31K (3.0×)', threshold: '>2.5× peer median', triggered: true },
          { label: 'Card-not-present rate', observed: '97%', threshold: '>70% for in-person MCC', triggered: true },
          { label: 'Chargeback rate', observed: '0.20%', threshold: '<0.2% (marginal)', triggered: false },
          { label: 'After-hours volume', observed: '79%', threshold: '>2× MCC peer', triggered: true },
          { label: 'Front-business score', observed: '3/4 flags → escalation', threshold: '≥3/4', triggered: true },
        ],
      },
    ],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'discover.merchants', source: 'discover' },
        { name: 'discover.chargebacks', source: 'discover' },
        { name: 'capone.commercial_accounts', source: 'capone' },
        { name: 'combined.merchant_map', source: 'combined' },
      ],
      code: `-- ① Discover: merchant transaction signals (volume, CNP rate)
WITH merchant_signals AS (
  SELECT da.merchant_id, dm.name, dm.mcc,
    SUM(da.amount)                                              AS monthly_volume,
    dm.peer_monthly_median,
    ROUND(SUM(da.amount) / NULLIF(dm.peer_monthly_median, 0), 2) AS volume_multiple,
    ROUND(AVG(da.is_cnp::INT)::NUMERIC, 3)                     AS cnp_rate
  FROM discover.authorizations da
  JOIN discover.merchants dm USING (merchant_id)
  WHERE da.auth_ts >= NOW() - INTERVAL '30 days'
    AND dm.mcc IN ('7297','4121','7011')
  GROUP BY da.merchant_id, dm.name, dm.mcc, dm.peer_monthly_median
),
-- ② Discover: chargeback absence over 6+ months (zero CB = anomaly)
cb_check AS (
  SELECT merchant_id,
    SUM(cb_count)              AS total_cb,
    COUNT(DISTINCT cb_month)   AS months_observed
  FROM discover.chargebacks
  WHERE cb_month >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
  GROUP BY merchant_id
),
-- ③ Cap One: commercial entity match via name similarity (requires pg_trgm)
comm_match AS (
  SELECT mm.discover_mid, ca.entity_name, ca.credit_limit
  FROM capone.commercial_accounts ca
  JOIN combined.merchant_map mm
    ON SIMILARITY(LOWER(ca.entity_name), LOWER(mm.legal_entity_name)) > 0.80
),
-- ④ Score: 1 point per triggered anomaly flag, max 4
scored AS (
  SELECT ms.merchant_id, ms.name, ms.volume_multiple, ms.cnp_rate,
    COALESCE(cb.total_cb, 0)   AS chargebacks_6mo,
    cb.months_observed,
    cm.entity_name             AS commercial_entity,
    cm.credit_limit,
    (CASE WHEN ms.volume_multiple > 2.5                                          THEN 1 ELSE 0 END
     + CASE WHEN ms.cnp_rate > 0.70                                              THEN 1 ELSE 0 END
     + CASE WHEN COALESCE(cb.total_cb,0) = 0 AND COALESCE(cb.months_observed,0) >= 6
                                                                                 THEN 1 ELSE 0 END
     + CASE WHEN cm.discover_mid IS NOT NULL                                     THEN 1 ELSE 0 END
    ) AS anomaly_score
  FROM merchant_signals ms
  LEFT JOIN cb_check cb   ON cb.merchant_id  = ms.merchant_id
  LEFT JOIN comm_match cm ON cm.discover_mid = ms.merchant_id
)
SELECT *,
  CASE WHEN anomaly_score >= 3 THEN 'FLAGGED'
       WHEN anomaly_score  = 2 THEN 'REVIEW'
       ELSE 'PASS'
  END AS ht5_status
FROM scored
ORDER BY anomaly_score DESC, monthly_volume DESC;`,
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Discover: merchant signals — volume vs peer, CNP rate
auths = pd.read_sql(
    "SELECT da.merchant_id, dm.name, dm.mcc, da.amount, da.is_cnp, "
    "dm.peer_monthly_median FROM discover.authorizations da "
    "JOIN discover.merchants dm USING (merchant_id) "
    "WHERE da.auth_ts >= NOW()-INTERVAL '30 days' "
    "AND dm.mcc IN ('7297','4121','7011')", engine)
signals = (auths.groupby(['merchant_id','name','mcc','peer_monthly_median'])
    .agg(monthly_volume=('amount','sum'), cnp_rate=('is_cnp','mean'))
    .reset_index())
signals['volume_multiple'] = signals.monthly_volume / signals.peer_monthly_median.clip(lower=1)

# ② Discover: chargeback absence — zero chargebacks over 6+ months = anomaly
cb = pd.read_sql(
    "SELECT merchant_id, SUM(cb_count) AS total_cb, "
    "COUNT(DISTINCT cb_month) AS months_obs "
    "FROM discover.chargebacks WHERE cb_month >= NOW()-INTERVAL '6 months' "
    "GROUP BY merchant_id", engine)

# ③ Cap One: commercial entity fuzzy match (pre-computed via pg_trgm in DB)
comm = pd.read_sql(
    "SELECT mm.discover_mid AS merchant_id, ca.entity_name, ca.credit_limit "
    "FROM capone.commercial_accounts ca "
    "JOIN combined.merchant_map mm "
    "ON SIMILARITY(LOWER(ca.entity_name), LOWER(mm.legal_entity_name)) > 0.80", engine)

# ④ Score and classify
result = (signals.merge(cb, on='merchant_id', how='left')
    .fillna({'total_cb': 0, 'months_obs': 0})
    .merge(comm, on='merchant_id', how='left'))
result['flag_volume'] = (result.volume_multiple > 2.5).astype(int)
result['flag_cnp']    = (result.cnp_rate > 0.70).astype(int)
result['flag_cb']     = ((result.total_cb == 0) & (result.months_obs >= 6)).astype(int)
result['flag_comm']   = result.entity_name.notna().astype(int)
result['anomaly_score'] = result[['flag_volume','flag_cnp','flag_cb','flag_comm']].sum(axis=1)
result['ht5_status']  = result.anomaly_score.map(
    lambda s: 'FLAGGED' if s >= 3 else 'REVIEW' if s == 2 else 'PASS')
print(result[['merchant_id','name','volume_multiple','cnp_rate','anomaly_score','ht5_status']]
      .sort_values('anomaly_score', ascending=False))`,
      classification: {
        flagged: 'anomaly_score ≥ 3 of 4 flags (volume outlier + CNP + zero-CB + commercial match)',
        review:  'anomaly_score = 2 of 4 flags — two concurrent anomalies require investigation',
        pass:    'anomaly_score ≤ 1 — isolated anomaly consistent with legitimate variation',
      },
    },
  },

  {
    categoryId: '20-T3',
    ruleId: 'HT-6',
    advisoryRef: 'FIN-2020-A008, Typology 3',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
    advisoryTitle: 'Supplemental Advisory on Identifying and Reporting Human Trafficking and Related Activity',
    advisoryGuidance:
      'FIN-2020-A008 Typology 3 (Funnel Accounts) describes accounts receiving multiple cash deposits below the CTR threshold from various sources and locations, followed by rapid consolidation and disbursement to different geographic areas — consistent with layering trafficking proceeds across financial institutions and cardholders.',
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
    evidence: [
      {
        caseId: 'CTRL-001',
        finding: 'Device FP-7a3c9d2e1b4f8a0c links 4 Cap One accounts; session IP 192.168.44.17 cross-matched to Discover terminals at MID-0001872 and MID-0002341 — one controller, nine cards, six banks, $28,400 cash-out',
        metrics: [
          { label: 'Device fingerprint cluster (Cap One)', observed: '4 accounts share FP-7a3c9d2e1b4f8a0c', threshold: '≥3 accounts', triggered: true },
          { label: 'Session IP (Cap One auth logs)', observed: '192.168.44.17 across 3 accounts', threshold: 'Same IP, multiple accounts', triggered: true },
          { label: 'Terminal IP cross-match (Discover)', observed: '192.168.44.17 at MID-0001872 + MID-0002341', threshold: 'Session IP = terminal IP', triggered: true },
          { label: 'Multi-BIN convergence', observed: '6 issuers: Cap One, Discover, Chase, WF, US Bank, Citi', threshold: '≥6 distinct issuers', triggered: true },
          { label: 'Shared merchant windows', observed: '3 merchants, 7 separate nights, 90-min windows', threshold: '≥3 nights confirmed', triggered: true },
          { label: 'Combined cash-out', observed: '$28,400 over 21 days (9 accounts)', threshold: 'Controller network confirmed', triggered: true },
        ],
      },
    ],
    script: {
      language: 'python',
      altLanguage: 'sql',
      tables: [
        { name: 'capone.device_sessions', source: 'capone' },
        { name: 'discover.authorizations', source: 'discover' },
        { name: 'discover.terminals', source: 'discover' },
        { name: 'combined.merchant_map', source: 'combined' },
      ],
      code: `import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Cap One: load device sessions, cluster by fingerprint similarity (DBSCAN)
sessions = pd.read_sql("""
    SELECT account_id, device_fp, ip_address
    FROM capone.device_sessions
    WHERE session_ts >= NOW() - INTERVAL '30 days'
""", engine)

fp_encoded  = pd.get_dummies(sessions["device_fp"]).values
dist_matrix = 1 - cosine_similarity(fp_encoded)   # convert to distance
sessions["cluster"] = DBSCAN(
    eps=0.05, min_samples=3, metric="precomputed"  # 95% similarity threshold
).fit_predict(dist_matrix)

# Keep clusters where 3+ distinct accounts share a device fingerprint
clusters = (
    sessions[sessions.cluster >= 0]
    .groupby("cluster")
    .agg(accounts=("account_id", "unique"), ips=("ip_address", "unique"))
    .assign(account_count=lambda d: d.accounts.map(len))
    .query("account_count >= 3")
)

# ② Discover: multi-BIN convergence per merchant in 90-minute windows
convergence = pd.read_sql("""
    SELECT mm.capone_mid,
           COUNT(DISTINCT LEFT(da.bin, 6)) AS distinct_bins
    FROM discover.authorizations da
    JOIN combined.merchant_map mm ON mm.discover_mid = da.merchant_id
    WHERE da.auth_ts >= NOW() - INTERVAL '30 days'
    GROUP BY mm.capone_mid,
             (EXTRACT(EPOCH FROM da.auth_ts) / 5400)::INT
    HAVING COUNT(DISTINCT LEFT(da.bin, 6)) >= 6
""", engine)
conv_events = convergence.groupby("capone_mid").size().rename("convergence_events")

# ③ Cross-institution IP match: Cap One session IP == Discover terminal IP
terminal_ips = set(pd.read_sql(
    "SELECT DISTINCT ip_address FROM discover.terminals", engine
)["ip_address"])

# ④ Score and classify each device cluster
def classify(row):
    ip_hit = bool(set(row.ips) & terminal_ips)
    conv   = int(conv_events.get(row.name, 0))
    if ip_hit and conv >= 2: return "FLAGGED"   # controller confirmed
    if ip_hit or  conv >= 2: return "REVIEW"    # partial signal
    return "PASS"

clusters["ht6_status"] = clusters.apply(classify, axis=1)
print(clusters[["accounts", "account_count", "ht6_status"]])`,
      altCode: `-- ① Cap One: accounts sharing the same device fingerprint (≥ 3 accounts per FP)
WITH shared_devices AS (
  SELECT device_fp,
    array_agg(DISTINCT account_id) AS accounts,
    COUNT(DISTINCT account_id)     AS account_count
  FROM capone.device_sessions
  WHERE session_ts >= NOW() - INTERVAL '30 days'
  GROUP BY device_fp
  HAVING COUNT(DISTINCT account_id) >= 3
),
-- ② Cap One: collect all session IPs from flagged device clusters
cluster_ips AS (
  SELECT ds.ip_address, sd.device_fp
  FROM capone.device_sessions ds
  JOIN shared_devices sd USING (device_fp)
  WHERE ds.session_ts >= NOW() - INTERVAL '30 days'
),
-- ③ Discover: IP cross-match — session IP appears in merchant terminal registry
ip_cross AS (
  SELECT ci.device_fp, t.merchant_id AS terminal_merchant
  FROM cluster_ips ci
  JOIN discover.terminals t USING (ip_address)
),
-- ④ Discover: multi-BIN convergence — 6+ distinct issuers per 90-min window
bin_convergence AS (
  SELECT mm.capone_mid, COUNT(*) AS convergence_events
  FROM (
    SELECT da.merchant_id,
      (EXTRACT(EPOCH FROM da.auth_ts) / 5400)::INT AS window_bucket
    FROM discover.authorizations da
    WHERE da.auth_ts >= NOW() - INTERVAL '30 days'
    GROUP BY da.merchant_id, window_bucket
    HAVING COUNT(DISTINCT LEFT(da.bin, 6)) >= 6
  ) conv
  JOIN combined.merchant_map mm ON mm.discover_mid = conv.merchant_id
  GROUP BY mm.capone_mid
)
-- ⑤ Join and classify each device cluster
SELECT sd.device_fp, sd.account_count,
  COUNT(DISTINCT ic.terminal_merchant) > 0   AS ip_cross_match,
  COALESCE(MAX(bc.convergence_events), 0)    AS convergence_events,
  CASE
    WHEN COUNT(DISTINCT ic.terminal_merchant) > 0
     AND COALESCE(MAX(bc.convergence_events), 0) >= 2 THEN 'FLAGGED'
    WHEN COUNT(DISTINCT ic.terminal_merchant) > 0
      OR COALESCE(MAX(bc.convergence_events), 0) >= 2 THEN 'REVIEW'
    ELSE 'PASS'
  END AS ht6_status
FROM shared_devices sd
LEFT JOIN cluster_ips ci USING (device_fp)
LEFT JOIN ip_cross ic     USING (device_fp)
LEFT JOIN bin_convergence bc
  ON bc.capone_mid IN (
    SELECT mm.capone_mid FROM cluster_ips ci2
    JOIN discover.terminals t2 ON t2.ip_address = ci2.ip_address
    JOIN combined.merchant_map mm ON mm.discover_mid = t2.merchant_id
    WHERE ci2.device_fp = sd.device_fp
  )
GROUP BY sd.device_fp, sd.account_count
ORDER BY convergence_events DESC, ip_cross_match DESC;`,
      classification: {
        flagged: 'device cluster confirmed AND IP cross-match AND convergence_events ≥ 2',
        review:  'device cluster OR convergence_events ≥ 2 — partial cross-institution signal',
        pass:    'no shared device cluster and convergence_events < 2',
      },
    },
  },

  // ── Pig Butchering ────────────────────────────────────────────────────────────
  {
    categoryId: 'PB-Crypto',
    ruleId: 'PB-1',
    advisoryRef: 'FIN-2023-Alert001',
    advisoryUrl: 'https://www.fincen.gov/sites/default/files/2023-09/FinCEN%20Alert%20FIN-2023-Alert001.pdf',
    advisoryTitle: 'FinCEN Alert on Prevalent Virtual Currency Investment Scams ("Pig Butchering")',
    advisoryGuidance:
      'FIN-2023-Alert001 alerts financial institutions to a surge in virtual currency investment scams known as "pig butchering" (shā zhū pán). Fraudsters cultivate online relationships with victims over weeks or months — through dating apps, social media, or unsolicited messages — before convincing them to invest in fraudulent cryptocurrency platforms. The platforms fabricate returns to build confidence, then execute a sudden fund drain. FinCEN identifies escalating virtual currency deposits, pressure to invest larger amounts, use of unregistered exchanges, and credit-line exploitation as key financial red flags requiring SAR filing.',
    detectionObjective:
      'Detect the grooming-to-attack pattern: initial small crypto exchange test deposits escalating geometrically to large wire transfers, combined with sudden credit utilization spikes and destination exchange blacklist matches.',
    computationalSteps: [
      'Detect first-ever MCC 6051 (cryptocurrency exchange / money transfer) appearance on an account with no prior crypto transaction history — baseline disruption signal',
      'Identify "test deposit" escalation: two or more crypto exchange deposits within 30 days where each subsequent deposit is ≥ 2× the prior amount (geometric growth pattern)',
      'Flag wire transfer velocity anomaly: total wires to virtual currency exchanges exceeding $5,000 within 30 days on an account with zero prior wire history',
      'Detect credit utilization spike: utilization increasing ≥ 50 percentage points within 30 days, especially when immediately followed by a wire to a crypto exchange (coerced extraction pattern)',
      'Cross-reference destination exchange entity against FinCEN MSB registration database and known scam wallet cluster blacklist',
      'Flag when: first MCC 6051 + escalation pattern, OR wire velocity > $5K with no wire history, OR destination matches blacklisted wallet cluster — any one of these alone warrants SAR consideration',
    ],
    dataFields: [
      { name: 'MCC Code', type: 'transaction', source: 'both', description: 'MCC 6051 (crypto exchange / non-bank money transfer) as primary trigger signal' },
      { name: 'Wire Transfer Records', type: 'transaction', source: 'capone', description: 'Outbound wire destination, amount, and timing for velocity analysis' },
      { name: 'Credit Utilization History', type: 'transaction', source: 'capone', description: '30-day rolling utilization for spike detection' },
      { name: 'MSB Registry', type: 'merchant', source: 'both', description: 'FinCEN Money Services Business registration lookup for destination exchange verification' },
    ],
    caponeAlone: { capability: 'Detect test deposit escalation and wire velocity on Cap One cardholders.', limitation: 'Cannot see cross-institution account patterns or shared wallet cluster signals.' },
    discoverAlone: { capability: 'Detect merchant-level crypto exchange clustering.', limitation: 'Cannot link to cardholder identity or relationship grooming signals.' },
    combined: { capability: 'Cross-victim wallet cluster identification — same exchange receiving funds from multiple institutions.', uniqueInsight: 'PB-001 and PB-002 both wired to wallet cluster 0x7f3a…c42d via different branded platforms (CryptoVault Pro and TrustFinance) — only detectable by cross-referencing both issuer streams against the same receiving wallet registry.' },
    triggeredCases: ['PB-001', 'PB-002'],
    evidence: [],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'capone.transactions', source: 'capone' },
        { name: 'capone.account_utilization_daily', source: 'capone' },
        { name: 'ref.msb_registry', source: 'combined' },
      ],
      code: `-- ① Detect first-ever MCC 6051 (crypto exchange) per account
WITH first_crypto AS (
  SELECT cardholder_id, MIN(txn_ts) AS first_crypto_ts,
    COUNT(*) AS crypto_txn_count
  FROM capone.transactions
  WHERE mcc = '6051'
    AND txn_ts >= NOW() - INTERVAL '90 days'
  GROUP BY cardholder_id
),
-- ② Test deposit escalation: geometric growth across crypto deposits
test_escalation AS (
  SELECT cardholder_id,
    COUNT(*) AS deposit_count,
    MAX(amount) / NULLIF(MIN(amount), 0) AS growth_ratio
  FROM capone.transactions
  WHERE mcc = '6051'
    AND txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
),
-- ③ Wire transfer velocity to crypto/money-transfer merchants
wire_velocity AS (
  SELECT cardholder_id,
    SUM(amount) AS wire_total_30d,
    COUNT(*) AS wire_count
  FROM capone.transactions
  WHERE mcc IN ('6051','4829')
    AND txn_ts >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
),
-- ④ Credit utilization spike (peak - floor in 30 days)
util_spike AS (
  SELECT cardholder_id,
    MAX(utilization_pct) - MIN(utilization_pct) AS util_delta_pp
  FROM capone.account_utilization_daily
  WHERE snapshot_date >= NOW() - INTERVAL '30 days'
  GROUP BY cardholder_id
)
SELECT fc.cardholder_id,
  fc.first_crypto_ts, te.deposit_count,
  te.growth_ratio, wv.wire_total_30d, us.util_delta_pp,
  CASE
    WHEN te.growth_ratio >= 2 AND wv.wire_total_30d >= 5000 THEN 'FLAGGED'
    WHEN wv.wire_total_30d >= 5000 OR us.util_delta_pp >= 50  THEN 'FLAGGED'
    WHEN te.deposit_count >= 2                                 THEN 'REVIEW'
    ELSE 'PASS'
  END AS pb1_status
FROM first_crypto fc
LEFT JOIN test_escalation te ON te.cardholder_id = fc.cardholder_id
LEFT JOIN wire_velocity    wv ON wv.cardholder_id = fc.cardholder_id
LEFT JOIN util_spike       us ON us.cardholder_id = fc.cardholder_id
ORDER BY wv.wire_total_30d DESC NULLS LAST;`,
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Load recent transactions
txns = pd.read_sql(
    "SELECT cardholder_id, mcc, amount, txn_ts "
    "FROM capone.transactions "
    "WHERE txn_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['txn_ts'])

# ② First-ever crypto exchange deposit
crypto = txns[txns.mcc == '6051']
first_crypto = crypto.groupby('cardholder_id')['txn_ts'].min().reset_index()

# ③ Test deposit escalation
escalation = (crypto.sort_values('txn_ts')
    .groupby('cardholder_id')['amount']
    .apply(lambda a: a.max() / a.min() if len(a) > 1 else 0)
    .rename('growth_ratio').reset_index())

# ④ Wire velocity
wire = txns[txns.mcc.isin(['6051','4829'])]
wire_vel = wire.groupby('cardholder_id')['amount'].sum().rename('wire_total').reset_index()

# ⑤ Classify
result = first_crypto.merge(escalation, on='cardholder_id', how='left') \\
                     .merge(wire_vel,   on='cardholder_id', how='left').fillna(0)
result['pb1_status'] = result.apply(lambda r: (
    'FLAGGED' if (r.growth_ratio >= 2 and r.wire_total >= 5000) or r.wire_total >= 5000
    else 'REVIEW'  if r.growth_ratio >= 2
    else 'PASS'), axis=1)
print(result.sort_values('wire_total', ascending=False))`,
      classification: {
        flagged: 'test escalation (growth ≥ 2×) AND wire total ≥ $5K, OR wire total ≥ $5K with no wire history',
        review:  '≥ 2 crypto deposits in 30 days without escalation threshold — monitor for progression',
        pass:    'first MCC 6051 occurrence only — flag for 30-day watchlist',
      },
    },
  },

  // ── Elder Financial Exploitation ──────────────────────────────────────────────
  {
    categoryId: 'EFE-Exploit',
    ruleId: 'EFE-1',
    advisoryRef: 'FIN-2022-A002',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2022-a002',
    advisoryTitle: 'FinCEN Advisory on Elder Financial Exploitation',
    advisoryGuidance:
      'FIN-2022-A002 addresses the growing threat of elder financial exploitation (EFE) — the illegal or improper use of an older adult\'s funds, property, or assets. EFE is perpetrated by family members, caregivers, fiduciaries, and romance scammers, and is one of the fastest-growing categories of financial crime with an estimated $28.3 billion in annual US losses. FinCEN identifies patterns including sudden large cash withdrawals, new authorized user additions correlated with fund transfers, wire transfers to previously unknown recipients, and geographic inconsistencies as key financial red flags. Victims often do not self-report due to shame, dependency, or cognitive decline, making proactive monitoring by financial institutions especially critical to victim protection.',
    detectionObjective:
      'Identify account holders aged 60 or older exhibiting sudden anomalous financial behavior — large cash withdrawal clusters, new authorized user additions, first-ever wires to unknown payees, or geographic transaction inconsistencies — that may indicate exploitation by a caregiver, family member, or scammer.',
    computationalSteps: [
      'Apply elder risk overlay: flag accounts held by cardholders aged 60 or older who exhibit spend pattern changes exceeding 2× their 90-day baseline in any single category (cash, wire, or new payee spend)',
      'Detect large cash withdrawal clusters: three or more ATM withdrawals totaling > $3,000 within any 7-day window on an account with historically low cash activity (< 5% baseline cash ratio)',
      'Monitor new authorized user or joint account holder additions: flag if a large withdrawal (> $2,000) or wire transfer occurs within 30 days of adding a new authorized user to an elder-flagged account',
      'Detect first-ever wire transfer to a new payee from an account with no prior wire history, where the account holder is aged 60 or older — cross-check payee against known exploitation and romance scam registries',
      'Flag geographic transaction inconsistency: transactions appearing in a city or state inconsistent with the cardholder\'s established location patterns — may indicate proxy access or travel under duress',
      'Flag when: Elder overlay active AND any of: cash cluster > $3K in 7 days, OR new authorized user + large withdrawal, OR first-ever wire + age ≥ 60, OR geographic inconsistency with large transaction',
    ],
    dataFields: [
      { name: 'Cardholder Age', type: 'transaction', source: 'capone', description: 'Account holder date of birth — primary input for elder risk overlay (age ≥ 60)' },
      { name: 'Authorized User Changes', type: 'transaction', source: 'capone', description: 'New authorized user or POA additions — correlated with subsequent fund movement' },
      { name: 'Wire Transfer Records', type: 'transaction', source: 'capone', description: 'Outbound wire payee, amount, and timing for first-ever wire detection' },
      { name: 'Transaction Geography', type: 'geographic', source: 'both', description: 'City/state per transaction for location consistency monitoring' },
    ],
    caponeAlone: { capability: 'Detect cash clusters and wire anomalies on Cap One elder cardholders.', limitation: 'Cannot see cross-institution exploitation patterns or shared exploiter payee networks.' },
    discoverAlone: { capability: 'Detect geographic inconsistencies at Discover-network merchants.', limitation: 'Cannot link to cardholder age or authorized user change events.' },
    combined: { capability: 'Cross-institution payee matching to identify serial exploiters receiving funds from multiple elder victims across banks.', uniqueInsight: 'A single exploiter may receive funds from elder victims at multiple institutions — detectable only when Cap One wire payees are cross-referenced against Discover network payment recipients.' },
    triggeredCases: [],
    evidence: [],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'capone.transactions', source: 'capone' },
        { name: 'capone.account_holders', source: 'capone' },
        { name: 'capone.authorized_user_changes', source: 'capone' },
      ],
      code: `-- ① Elder cardholder overlay (age ≥ 60)
WITH elder_accounts AS (
  SELECT account_id, cardholder_id,
    DATE_PART('year', AGE(date_of_birth)) AS age
  FROM capone.account_holders
  WHERE DATE_PART('year', AGE(date_of_birth)) >= 60
),
-- ② Unusual cash cluster: 3+ ATM txns > $3K total in any 7-day window
cash_clusters AS (
  SELECT t.cardholder_id,
    SUM(t.amount) OVER (
      PARTITION BY t.cardholder_id
      ORDER BY t.txn_ts
      RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
    ) AS rolling_7d_cash,
    COUNT(*) OVER (
      PARTITION BY t.cardholder_id
      ORDER BY t.txn_ts
      RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
    ) AS rolling_7d_count
  FROM capone.transactions t
  WHERE t.mcc = '6010'  -- ATM cash
    AND t.txn_ts >= NOW() - INTERVAL '30 days'
),
-- ③ New authorized user within 30 days + subsequent large withdrawal
auth_user_flag AS (
  SELECT auc.account_id
  FROM capone.authorized_user_changes auc
  JOIN capone.transactions t
    ON t.cardholder_id = auc.cardholder_id
    AND t.txn_ts BETWEEN auc.change_ts AND auc.change_ts + INTERVAL '30 days'
    AND t.amount >= 2000
  WHERE auc.change_ts >= NOW() - INTERVAL '60 days'
    AND auc.change_type = 'ADD'
)
SELECT ea.cardholder_id, ea.age,
  MAX(cc.rolling_7d_cash)  AS peak_7d_cash,
  MAX(cc.rolling_7d_count) AS peak_7d_count,
  CASE WHEN auf.account_id IS NOT NULL THEN true ELSE false END AS auth_user_flag,
  CASE
    WHEN MAX(cc.rolling_7d_cash) > 3000 AND MAX(cc.rolling_7d_count) >= 3 THEN 'FLAGGED'
    WHEN auf.account_id IS NOT NULL                                          THEN 'FLAGGED'
    WHEN MAX(cc.rolling_7d_cash) > 1500                                      THEN 'REVIEW'
    ELSE 'PASS'
  END AS efe1_status
FROM elder_accounts ea
LEFT JOIN cash_clusters  cc  ON cc.cardholder_id = ea.cardholder_id
LEFT JOIN auth_user_flag auf ON auf.account_id   = ea.account_id
GROUP BY ea.cardholder_id, ea.age, auf.account_id
ORDER BY peak_7d_cash DESC NULLS LAST;`,
      altCode: `import pandas as pd
from sqlalchemy import create_engine
from datetime import timedelta
engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Load elder accounts (age >= 60)
holders = pd.read_sql(
    "SELECT cardholder_id, date_of_birth FROM capone.account_holders",
    engine, parse_dates=['date_of_birth'])
holders['age'] = (pd.Timestamp.today() - holders.date_of_birth).dt.days // 365
elders = holders[holders.age >= 60].cardholder_id.tolist()

# ② Load recent ATM transactions for elder accounts
atm = pd.read_sql(
    f"SELECT cardholder_id, amount, txn_ts FROM capone.transactions "
    f"WHERE mcc='6010' AND txn_ts >= NOW()-INTERVAL '30 days' "
    f"AND cardholder_id = ANY(ARRAY{elders})",
    engine, parse_dates=['txn_ts'])

# ③ Rolling 7-day cash cluster detection
def rolling_cash(g):
    g = g.sort_values('txn_ts')
    g['roll7_sum'] = g.amount.rolling('7D', on='txn_ts').sum()
    g['roll7_cnt'] = g.amount.rolling('7D', on='txn_ts').count()
    return g
atm_rolling = atm.groupby('cardholder_id', group_keys=False).apply(rolling_cash)
peak = atm_rolling.groupby('cardholder_id').agg(
    peak_cash=('roll7_sum','max'), peak_count=('roll7_cnt','max')).reset_index()

# ④ Classify
peak['efe1_status'] = peak.apply(lambda r: (
    'FLAGGED' if r.peak_cash > 3000 and r.peak_count >= 3
    else 'REVIEW'  if r.peak_cash > 1500
    else 'PASS'), axis=1)
print(peak.sort_values('peak_cash', ascending=False))`,
      classification: {
        flagged: '≥ 3 ATM withdrawals totaling > $3K in 7 days, OR new authorized user + large withdrawal within 30 days',
        review:  'rolling 7-day ATM cash $1,500–$3,000 on elder account — monitor and cross-check with service records',
        pass:    'elder overlay active but no anomalous cash or authorization patterns detected',
      },
    },
  },

  // ── Deepfake / GenAI Identity Fraud ──────────────────────────────────────────
  {
    categoryId: 'DF-Identity',
    ruleId: 'DF-1',
    advisoryRef: 'FIN-2024-NTC-2',
    advisoryUrl: 'https://www.fincen.gov/resources/advisories',
    advisoryTitle: 'FinCEN Notice on Deepfake and Generative AI-Enabled Identity Fraud',
    advisoryGuidance:
      'Financial institutions face a rapidly evolving threat from generative AI-enabled identity fraud. Fraudsters use deepfake video and audio to bypass biometric KYC checks, AI-assembled synthetic identity documents to open fraudulent accounts at scale, and cloned voice profiles to defeat IVR and call-center authentication. These attacks are increasingly automated — enabling account farm operations across multiple institutions simultaneously. FinCEN has directed institutions to assess their biometric verification confidence thresholds, monitor for synthetic identity indicators at account opening, flag device-change-to-wire sequences, and file SARs when AI-enabled fraud is suspected even without definitive proof of deepfake use.',
    detectionObjective:
      'Identify accounts opened with low-confidence biometric verification, synthetic identity indicators, or rapid account-open-to-transfer velocity — and detect device fingerprint clustering across institutions that may indicate coordinated AI-driven account farm activity.',
    computationalSteps: [
      'Flag low biometric confidence score at account opening: liveness detection confidence below the institution\'s threshold (typically < 85%), consistent with a deepfake video or photo injection during KYC — request secondary authentication',
      'Detect device change followed by large wire: new device enrollment or device fingerprint change on an existing account, followed by an outbound wire exceeding $5,000 within 72 hours — classic account takeover amplified by AI social engineering',
      'Identify synthetic identity indicators at account opening: SSN issued date inconsistent with stated cardholder age, no continuous credit file history prior to 12 months ago, or identity data matching known synthetic identity construction patterns',
      'Monitor account-open-to-large-transfer velocity: accounts less than 30 days old receiving inbound deposits and immediately forwarding outbound transfers — consistent with mule accounts opened at scale using synthetic IDs',
      'Cross-institution device cluster detection: same device fingerprint or originating IP address used to open or access accounts at multiple institutions within a 7-day window — hallmark of AI-automated account farm behavior',
      'Flag when: Low biometric confidence at opening, OR device change + wire > $5K within 72hrs, OR synthetic identity score above threshold, OR account-open-to-transfer velocity anomaly detected within 30 days',
    ],
    dataFields: [
      { name: 'Biometric Confidence Score', type: 'transaction', source: 'capone', description: 'Liveness detection confidence from biometric vendor at account opening — primary deepfake indicator' },
      { name: 'Device Fingerprint', type: 'device', source: 'both', description: 'Device hardware and browser fingerprint — enables cross-institution account farm detection' },
      { name: 'Account Open Date', type: 'temporal', source: 'capone', description: 'Account vintage for account-open-to-transfer velocity monitoring' },
      { name: 'SSN Issue Date', type: 'transaction', source: 'capone', description: 'Social Security Number issue date vs stated cardholder age — synthetic identity consistency check' },
    ],
    caponeAlone: { capability: 'Detect biometric anomalies, device changes, and synthetic identity signals within Cap One accounts.', limitation: 'Cannot see cross-institution device clustering or account farm patterns across multiple banks.' },
    discoverAlone: { capability: 'Detect device fingerprint clustering at Discover-network merchants and terminals.', limitation: 'Cannot link to account opening biometric scores or SSN consistency checks.' },
    combined: { capability: 'Cross-institution device fingerprint matching to identify AI-automated account farm operators opening accounts at multiple banks simultaneously.', uniqueInsight: 'An AI account farm may open accounts at Cap One, Discover, and 4 other institutions within 7 days using the same device — only detectable when both device fingerprint registries are cross-referenced in real time.' },
    triggeredCases: [],
    evidence: [],
    script: {
      language: 'sql',
      altLanguage: 'python',
      tables: [
        { name: 'capone.account_opening_events', source: 'capone' },
        { name: 'capone.device_sessions', source: 'capone' },
        { name: 'capone.transactions', source: 'capone' },
      ],
      code: `-- ① Low biometric confidence at account opening
WITH biometric_flags AS (
  SELECT account_id, cardholder_id, open_ts,
    biometric_confidence_score,
    biometric_confidence_score < 0.85 AS low_confidence
  FROM capone.account_opening_events
  WHERE open_ts >= NOW() - INTERVAL '90 days'
),
-- ② Device change → large wire within 72 hours
device_wire AS (
  SELECT ds.cardholder_id, ds.device_change_ts,
    t.amount AS wire_amount, t.txn_ts AS wire_ts,
    EXTRACT(EPOCH FROM (t.txn_ts - ds.device_change_ts))/3600 AS hours_to_wire
  FROM capone.device_sessions ds
  JOIN capone.transactions t
    ON t.cardholder_id = ds.cardholder_id
    AND t.mcc IN ('4829','6051')
    AND t.txn_ts BETWEEN ds.device_change_ts
                     AND ds.device_change_ts + INTERVAL '72 hours'
    AND t.amount >= 5000
  WHERE ds.device_change_ts >= NOW() - INTERVAL '30 days'
    AND ds.is_new_device = true
),
-- ③ Account-open-to-transfer velocity (< 30 days old)
new_acct_transfers AS (
  SELECT t.cardholder_id,
    SUM(t.amount) AS outbound_total_30d
  FROM capone.transactions t
  JOIN capone.account_opening_events ao ON ao.cardholder_id = t.cardholder_id
  WHERE t.mcc IN ('4829','6051')
    AND t.txn_ts <= ao.open_ts + INTERVAL '30 days'
    AND ao.open_ts >= NOW() - INTERVAL '60 days'
  GROUP BY t.cardholder_id
)
SELECT bf.cardholder_id, bf.biometric_confidence_score,
  bf.low_confidence,
  dw.wire_amount, dw.hours_to_wire,
  nat.outbound_total_30d,
  CASE
    WHEN bf.low_confidence AND dw.wire_amount IS NOT NULL THEN 'FLAGGED'
    WHEN bf.low_confidence OR nat.outbound_total_30d >= 5000 THEN 'FLAGGED'
    WHEN dw.wire_amount IS NOT NULL                           THEN 'REVIEW'
    ELSE 'PASS'
  END AS df1_status
FROM biometric_flags bf
LEFT JOIN device_wire       dw  ON dw.cardholder_id = bf.cardholder_id
LEFT JOIN new_acct_transfers nat ON nat.cardholder_id = bf.cardholder_id
ORDER BY bf.biometric_confidence_score ASC;`,
      altCode: `import pandas as pd
from sqlalchemy import create_engine
engine = create_engine("postgresql+psycopg2://user:pass@host/db")

# ① Account opening biometric scores
openings = pd.read_sql(
    "SELECT account_id, cardholder_id, open_ts, biometric_confidence_score "
    "FROM capone.account_opening_events "
    "WHERE open_ts >= NOW() - INTERVAL '90 days'",
    engine, parse_dates=['open_ts'])
openings['low_confidence'] = openings.biometric_confidence_score < 0.85

# ② Device change → wire within 72 hours
device_sessions = pd.read_sql(
    "SELECT cardholder_id, device_change_ts "
    "FROM capone.device_sessions "
    "WHERE is_new_device = true "
    "AND device_change_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['device_change_ts'])
wires = pd.read_sql(
    "SELECT cardholder_id, amount, txn_ts "
    "FROM capone.transactions "
    "WHERE mcc IN ('4829','6051') AND amount >= 5000 "
    "AND txn_ts >= NOW() - INTERVAL '30 days'",
    engine, parse_dates=['txn_ts'])
device_wire = device_sessions.merge(wires, on='cardholder_id')
device_wire = device_wire[
    (device_wire.txn_ts - device_wire.device_change_ts).dt.total_seconds() <= 72*3600]

# ③ Classify
result = openings.copy()
result['device_wire_flag'] = result.cardholder_id.isin(device_wire.cardholder_id)
result['df1_status'] = result.apply(lambda r: (
    'FLAGGED' if r.low_confidence or r.device_wire_flag
    else 'REVIEW'  if r.biometric_confidence_score < 0.92
    else 'PASS'), axis=1)
print(result.sort_values('biometric_confidence_score'))`,
      classification: {
        flagged: 'low biometric confidence (< 85%) at opening, OR device change + wire > $5K within 72hrs, OR new account outbound > $5K within 30 days',
        review:  'biometric confidence 85–92% — secondary verification recommended before high-value transactions enabled',
        pass:    'biometric confidence ≥ 92% and no device anomaly or velocity flag',
      },
    },
  },
]
