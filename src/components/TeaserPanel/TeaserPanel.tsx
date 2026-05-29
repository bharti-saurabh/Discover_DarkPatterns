type UseCase = 'efe' | 'deepfake-fraud'

interface TeaserConfig {
  id: UseCase
  name: string
  tagline: string
  color: { bg: string; text: string; border: string; badge: string; icon: string; accent: string }
  icon: React.ReactNode
  description: string
  annualLoss: string
  victimStat: string
  growthStat: string
  fincenRefs: { id: string; label: string; url: string }[]
  signals: { label: string; detail: string }[]
  roadmap: string[]
}

const CONFIGS: Record<UseCase, TeaserConfig> = {
  efe: {
    id: 'efe',
    name: 'Elder Financial Exploitation',
    tagline: 'Detecting financial abuse of adults aged 60+',
    color: {
      bg: 'from-teal-50 to-emerald-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-700',
      icon: 'bg-teal-100',
      accent: 'bg-teal-500',
    },
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        <path d="M12 17l2 2 4-4"/>
      </svg>
    ),
    description:
      'Elder Financial Exploitation (EFE) is the illegal or improper use of an older adult\'s funds, property, or assets — often by a trusted caregiver, family member, or romance scammer. It is one of the fastest-growing categories of financial crime, with victims losing an estimated $28.3 billion annually in the US alone. Unlike fraud, victims often do not report it due to shame, dependency, or fear of losing independence.',
    annualLoss: '$28.3B',
    victimStat: '78% aged 60+',
    growthStat: '+42% since 2020',
    fincenRefs: [
      { id: 'FIN-2022-A002', label: 'FinCEN Advisory on Elder Financial Exploitation', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2022-a002' },
      { id: 'FIN-2021-Alert003', label: 'FinCEN Alert on Elder Financial Exploitation Typologies', url: 'https://www.fincen.gov/resources/advisories/fincen-alert-fin-2021-a003' },
    ],
    signals: [
      { label: 'Unusual large cash withdrawals', detail: 'ATM or teller cash-outs far exceeding the account\'s baseline — especially multiple withdrawals below CTR threshold in a short window.' },
      { label: 'New authorized users or POA additions', detail: 'Power of Attorney additions correlated with immediate large withdrawals or wire transfers to new payees.' },
      { label: 'Wire transfers to unknown beneficiaries', detail: 'First-ever wire to a beneficiary with no prior account relationship, especially if paired with large amount and senior account holder.' },
      { label: 'Sudden change in transaction geography', detail: 'Transactions appearing in a distant city inconsistent with cardholder mobility patterns — may indicate proxy access by an exploiter.' },
      { label: 'Caregiver-linked account changes', detail: 'Address changes, new joint account holders, or beneficiary changes following a caregiver relationship flag.' },
      { label: 'Cross-account fund funneling', detail: 'Rapid transfers from savings/retirement accounts into checking, followed immediately by wire or ATM withdrawal.' },
    ],
    roadmap: [
      'Elder risk overlay — account-level flag for cardholders aged 60+ entering anomalous spend patterns',
      'Caregiver transaction monitoring — detect spend pattern shifts coinciding with authorized-user additions',
      'POA + large-withdrawal sequence detection — regulatory-required alert pattern',
      'Cross-institution account drain detection (via Discover network data sharing)',
      'Adult Protective Services (APS) referral workflow integrated into SAR filing',
      'Velocity comparison vs age-cohort peer benchmarks',
    ],
  },

  'deepfake-fraud': {
    id: 'deepfake-fraud',
    name: 'Deepfake / GenAI Identity Fraud',
    tagline: 'AI-synthesized identity attacks on account opening and verification',
    color: {
      bg: 'from-violet-50 to-purple-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      badge: 'bg-violet-100 text-violet-700',
      icon: 'bg-violet-100',
      accent: 'bg-violet-500',
    },
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M9 8.5c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3"/>
        <path d="M9 13.5h6" strokeDasharray="2 2"/>
        <circle cx="18" cy="5" r="2" fill="#6D28D9" stroke="none"/>
        <path d="M17 4l2 2"/>
      </svg>
    ),
    description:
      'GenAI-enabled identity fraud uses deepfake video/audio, synthetic document generation, and AI-assembled identity profiles to bypass KYC checks, open fraudulent accounts, and execute account takeovers. In 2024, identity fraud losses reached $12.3 billion — with GenAI-enabled attacks growing 340% year-over-year. Unlike traditional identity theft, these attacks are scalable, automated, and increasingly indistinguishable from legitimate customers during onboarding.',
    annualLoss: '$12.3B',
    victimStat: '340% YoY growth',
    growthStat: '#1 emerging threat 2025',
    fincenRefs: [
      { id: 'FIN-2024-NTC-2', label: 'FinCEN Notice on Emerging Deepfake Threats to Financial Sector', url: 'https://www.fincen.gov/resources/advisories' },
      { id: 'FIN-2023-A001', label: 'FinCEN Advisory on Synthetic Identity Fraud', url: 'https://www.fincen.gov/resources/advisories' },
    ],
    signals: [
      { label: 'Biometric verification freshness anomaly', detail: 'Account opening biometric check passed, but the liveness model flags low confidence — consistent with a deepfake video submission.' },
      { label: 'Device change + large wire within 72 hours', detail: 'New device enrollment followed immediately by a large outgoing wire — classic account takeover signature amplified by AI-assisted social engineering.' },
      { label: 'Synthetic identity triangulation', detail: 'SSN, DOB, and name combination that matches no continuous credit file history — assembled from breached data to pass basic credit checks.' },
      { label: 'Account-open-to-large-transfer velocity', detail: 'New account (< 30 days) receiving and then forwarding large deposits — consistent with mule accounts opened at scale using synthetic IDs.' },
      { label: 'Voice authentication bypass signals', detail: 'IVR or voice-biometric authentication on a known-victim account followed by immediate high-value transaction.' },
      { label: 'Cross-institution IP + device cluster', detail: 'Same device or IP opening accounts across multiple institutions within a short window — AI-automated account farm behavior.' },
    ],
    roadmap: [
      'Liveness confidence score integration from biometric vendor — flag low-confidence deepfake submissions',
      'Device-change-to-wire sequence detector with 72-hour lookback window',
      'Synthetic identity scoring: SSN issued date vs cardholder DOB + credit file age consistency',
      'Account-open velocity monitor — same device/IP across Capital One + Discover network',
      'Cross-institution real-time alert on suspected deepfake account farm activity',
      'SAR-ID filing template with FinCEN emerging threat classification codes',
    ],
  },
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
      <div className={`text-2xl font-black font-mono leading-none mb-1 ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-500 font-medium">{label}</div>
    </div>
  )
}

export default function TeaserPanel({ useCase }: { useCase: UseCase }) {
  const cfg = CONFIGS[useCase]
  const c = cfg.color

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header card */}
        <div className={`bg-gradient-to-br ${c.bg} rounded-2xl border ${c.border} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center shrink-0`}>
                {cfg.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>
                    In Development
                  </span>
                  {cfg.fincenRefs.map(r => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-[8px] font-bold font-mono text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded transition-colors">
                      {r.id} ↗
                    </a>
                  ))}
                </div>
                <h1 className="text-xl font-black text-slate-900 leading-tight">{cfg.name}</h1>
                <p className={`text-sm font-medium mt-0.5 ${c.text}`}>{cfg.tagline}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed mt-4">{cfg.description}</p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatPill value={cfg.annualLoss} label="Annual US losses" color="text-red-600" />
            <StatPill value={cfg.victimStat} label="Victim profile" color="text-slate-800" />
            <StatPill value={cfg.growthStat} label="Trend" color="text-orange-600" />
          </div>
        </div>

        {/* Detection signals */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-6 h-6 rounded-lg ${c.icon} flex items-center justify-center`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c.text}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">Detection Signals</span>
            <span className="ml-auto text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cfg.signals.length} signals identified</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cfg.signals.map((s, i) => (
              <div key={i} className={`rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-3.5`}>
                <div className="flex items-start gap-2 mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.accent} shrink-0 mt-1.5`} />
                  <span className={`text-[10px] font-bold leading-tight ${c.text}`}>{s.label}</span>
                </div>
                <p className="text-[9px] text-slate-600 leading-snug ml-3.5">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-6 h-6 rounded-lg ${c.icon} flex items-center justify-center`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c.text}>
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">What We'd Build</span>
          </div>
          <div className="space-y-2.5">
            {cfg.roadmap.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-slate-400">{i + 1}</span>
                </div>
                <span className="text-[10px] text-slate-700 leading-snug pt-0.5">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FinCEN refs */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-2.5">Regulatory References</div>
          <div className="flex flex-wrap gap-2">
            {cfg.fincenRefs.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-1.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 transition-colors">
                <span className="text-[8px] font-bold text-amber-600 font-mono shrink-0 mt-0.5">{r.id} ↗</span>
                <span className="text-[9px] text-amber-800 font-medium leading-tight">{r.label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
