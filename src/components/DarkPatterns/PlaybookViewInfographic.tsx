import { useState } from 'react'
import { PLAYBOOK_RULES, type PlaybookRule } from '../../data/playbookData'
import { FINCEN_CATEGORIES } from '../../data/darkPatternsData'
import { RULE_INFOGRAPHICS, type IconType } from '../../data/playbookInfographicData'

const HT_REFS = new Set(['FIN-2014-A008', 'FIN-2020-A008'])

// ── Icon renderer ─────────────────────────────────────────────────────────────────

function Icon({ type, size = 18 }: { type: IconType; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'receipt':    return <svg {...s}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
    case 'dollar':     return <svg {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case 'map':        return <svg {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    case 'clock':      return <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'network':    return <svg {...s}><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8L5 16M12 8l7 8"/></svg>
    case 'fingerprint':return <svg {...s}><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M6 12c0-.34.03-.67.08-1M4 16a33.76 33.76 0 0 1-.08-3.01A8 8 0 0 1 15.72 4.6"/><path d="M20 13c-.12 2-.8 3.96-1.72 5M9 6.8a6 6 0 0 1 9 5.2v.5"/></svg>
    case 'trending':   return <svg {...s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    case 'users':      return <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'shield':     return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'zap':        return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'eye':        return <svg {...s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  }
}

// ── Left panel ────────────────────────────────────────────────────────────────────

function RuleList({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const htRules       = PLAYBOOK_RULES.filter(r => HT_REFS.has(r.advisoryRef))
  const emergingRules = PLAYBOOK_RULES.filter(r => !HT_REFS.has(r.advisoryRef))

  function RuleBtn({ rule }: { rule: PlaybookRule }) {
    const cat = FINCEN_CATEGORIES[rule.categoryId]
    const sel = selectedId === rule.categoryId
    return (
      <button onClick={() => onSelect(rule.categoryId)}
        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
          sel ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${sel ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{rule.ruleId}</span>
          <span className={`text-[8px] font-mono ${sel ? 'text-amber-600' : 'text-amber-500'}`}>{rule.categoryId}</span>
        </div>
        <div className={`text-[10px] font-semibold leading-snug ${sel ? 'text-indigo-900' : 'text-slate-700'}`}>{cat?.label ?? rule.categoryId}</div>
        <div className={`text-[8px] mt-0.5 ${sel ? 'text-indigo-400' : 'text-slate-400'}`}>{rule.advisoryRef}</div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">Human Trafficking</div>
      {htRules.map(r => <RuleBtn key={r.categoryId} rule={r} />)}
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 pt-3 border-t border-slate-100 mt-2">Emerging Threats</div>
      {emergingRules.map(r => <RuleBtn key={r.categoryId} rule={r} />)}
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 px-1">
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">FinCEN Sources</div>
        {[
          ['FIN-2014-A008', 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008'],
          ['FIN-2020-A008', 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008'],
          ['FIN-2023-Alert001', 'https://www.fincen.gov/sites/default/files/2023-09/FinCEN%20Alert%20FIN-2023-Alert001.pdf'],
          ['FIN-2022-A002', 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2022-a002'],
          ['FIN-2024-NTC-2', 'https://www.fincen.gov/resources/advisories'],
        ].map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="block text-[9px] text-amber-600 hover:text-amber-500 leading-snug">{label} ↗</a>
        ))}
      </div>
    </div>
  )
}

// ── Infographic detail ────────────────────────────────────────────────────────────

const ICON_COLORS: Record<IconType, { bg: string; text: string }> = {
  receipt:     { bg: 'bg-blue-100',    text: 'text-blue-600' },
  dollar:      { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  map:         { bg: 'bg-teal-100',    text: 'text-teal-600' },
  clock:       { bg: 'bg-purple-100',  text: 'text-purple-600' },
  network:     { bg: 'bg-violet-100',  text: 'text-violet-600' },
  fingerprint: { bg: 'bg-cyan-100',    text: 'text-cyan-600' },
  trending:    { bg: 'bg-orange-100',  text: 'text-orange-600' },
  users:       { bg: 'bg-pink-100',    text: 'text-pink-600' },
  shield:      { bg: 'bg-slate-100',   text: 'text-slate-600' },
  zap:         { bg: 'bg-amber-100',   text: 'text-amber-600' },
  eye:         { bg: 'bg-rose-100',    text: 'text-rose-600' },
}

function InfographicDetail({ rule }: { rule: PlaybookRule }) {
  const [showQuery, setShowQuery] = useState(false)
  const [codeLang, setCodeLang]   = useState<'primary' | 'alt'>('primary')
  const activeCode = codeLang === 'primary' ? rule.script.code : rule.script.altCode

  const infographic = RULE_INFOGRAPHICS[rule.categoryId]
  const isHT = HT_REFS.has(rule.advisoryRef)

  const thresholdStep = rule.computationalSteps.find(s => s.toLowerCase().startsWith('flag when'))

  if (!infographic) return null

  const headerGradient = isHT
    ? 'from-amber-600 to-orange-500'
    : 'from-indigo-600 to-violet-600'

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">

      {/* ── Header banner ── */}
      <div className={`bg-gradient-to-r ${headerGradient} rounded-2xl p-5 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded font-mono tracking-wider">
                {rule.ruleId}
              </span>
              <a href={rule.advisoryUrl} target="_blank" rel="noopener noreferrer"
                className="text-[9px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors">
                {rule.advisoryRef} ↗
              </a>
              <span className="text-[9px] font-semibold opacity-80">{FINCEN_CATEGORIES[rule.categoryId]?.label}</span>
            </div>
            <h2 className="text-base font-black leading-snug mb-3">{rule.advisoryTitle}</h2>
            <p className="text-[11px] text-white/85 leading-relaxed">{infographic.summary}</p>
          </div>
        </div>
      </div>

      {/* ── Key thresholds ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Key Thresholds</div>
        <div className="grid grid-cols-4 gap-3">
          {infographic.stats.map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className={`text-xl font-black font-mono leading-none mb-1.5 ${isHT ? 'text-amber-600' : 'text-indigo-600'}`}>
                {s.value}
              </div>
              <div className="text-[9px] text-slate-500 leading-tight font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detection signals ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Detection Signals — {infographic.signals.length} Red Flags
        </div>
        <div className={`grid gap-3 ${infographic.signals.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {infographic.signals.map((signal, i) => {
            const col = ICON_COLORS[signal.icon]
            return (
              <div key={i} className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className={`w-8 h-8 rounded-xl ${col.bg} flex items-center justify-center mb-2.5 ${col.text}`}>
                  <Icon type={signal.icon} size={16} />
                </div>
                <div className="text-[10px] font-bold text-slate-800 mb-1 leading-tight">{signal.title}</div>
                <p className="text-[9px] text-slate-500 leading-snug">{signal.body}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Alert trigger ── */}
      {thresholdStep && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1">Alert Condition</div>
            <p className="text-[11px] text-red-800 font-semibold leading-relaxed">{thresholdStep}</p>
          </div>
        </div>
      )}

      {/* ── Detection query (on demand) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button onClick={() => setShowQuery(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span className="text-sm font-semibold text-slate-800 flex-1">View Detection Query</span>
          <span className="text-[9px] text-slate-400">{rule.script.language.toUpperCase()} · {rule.script.altLanguage.toUpperCase()}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
            className={`shrink-0 transition-transform duration-200 ${showQuery ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showQuery && (
          <div className="px-5 pb-5 border-t border-slate-100 space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-wrap gap-1.5">
                {rule.script.tables.map(t => (
                  <span key={t.name} className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
                    t.source === 'capone'   ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    t.source === 'discover' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                              'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>{t.name}</span>
                ))}
              </div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                {(['primary', 'alt'] as const).map((k, i) => {
                  const lang = k === 'primary' ? rule.script.language : rule.script.altLanguage
                  return (
                    <button key={k} onClick={() => setCodeLang(k)}
                      className={[
                        'px-3 py-1 text-[9px] font-bold uppercase transition-colors',
                        i > 0 ? 'border-l border-slate-200' : '',
                        codeLang === k
                          ? lang === 'python' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                          : 'bg-white text-slate-400 hover:text-slate-700',
                      ].join(' ')}>{lang}</button>
                  )
                })}
              </div>
            </div>
            <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-64 overflow-y-auto">
              <code className="text-[9px] text-slate-200 font-mono leading-relaxed whitespace-pre">{activeCode}</code>
            </pre>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'FLAGGED', value: rule.script.classification.flagged, cls: 'bg-red-50 border-red-200 text-red-800' },
                { label: 'REVIEW',  value: rule.script.classification.review,  cls: 'bg-amber-50 border-amber-200 text-amber-800' },
                { label: 'PASS',    value: rule.script.classification.pass,    cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              ].map(row => (
                <div key={row.label} className={`border rounded-xl p-3 ${row.cls}`}>
                  <div className="text-[8px] font-bold uppercase tracking-widest mb-1 opacity-60">{row.label}</div>
                  <p className="text-[9px] font-mono leading-snug">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────────

export default function PlaybookViewInfographic() {
  const [selectedId, setSelectedId] = useState(PLAYBOOK_RULES[0].categoryId)
  const selected = PLAYBOOK_RULES.find(r => r.categoryId === selectedId)!

  return (
    <div className="grid grid-cols-[200px_1fr] gap-5 h-full min-h-0">
      <RuleList selectedId={selectedId} onSelect={setSelectedId} />
      <InfographicDetail key={selected.categoryId} rule={selected} />
    </div>
  )
}
