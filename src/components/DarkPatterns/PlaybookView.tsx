import { useState } from 'react'
import { PLAYBOOK_RULES, type PlaybookRule } from '../../data/playbookData'
import { FINCEN_CATEGORIES } from '../../data/darkPatternsData'

const HT_REFS = new Set(['FIN-2014-A008', 'FIN-2020-A008'])

// ── Left panel ────────────────────────────────────────────────────────────────────

function RuleList({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const htRules      = PLAYBOOK_RULES.filter(r => HT_REFS.has(r.advisoryRef))
  const emergingRules = PLAYBOOK_RULES.filter(r => !HT_REFS.has(r.advisoryRef))

  function RuleBtn({ rule }: { rule: PlaybookRule }) {
    const cat = FINCEN_CATEGORIES[rule.categoryId]
    const sel = selectedId === rule.categoryId
    return (
      <button
        onClick={() => onSelect(rule.categoryId)}
        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
          sel ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
            sel ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'
          }`}>{rule.ruleId}</span>
          <span className={`text-[8px] font-mono ${sel ? 'text-amber-600' : 'text-amber-500'}`}>{rule.categoryId}</span>
        </div>
        <div className={`text-[10px] font-semibold leading-snug ${sel ? 'text-blue-950' : 'text-slate-700'}`}>
          {cat?.label ?? rule.categoryId}
        </div>
        <div className={`text-[8px] mt-0.5 ${sel ? 'text-blue-500' : 'text-slate-400'}`}>{rule.advisoryRef}</div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">Human Trafficking</div>
      {htRules.map(r => <RuleBtn key={r.categoryId} rule={r} />)}

      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 pt-3 border-t border-slate-100 mt-2">
        Emerging Threats
      </div>
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
          <a key={label} href={url} target="_blank" rel="noopener noreferrer"
            className="block text-[9px] text-amber-600 hover:text-amber-500 leading-snug">
            {label} ↗
          </a>
        ))}
        <p className="text-[8px] text-slate-400 leading-snug pt-1">Synthetic data · demonstration only.</p>
      </div>
    </div>
  )
}

// ── Advisory detail ───────────────────────────────────────────────────────────────

function AdvisoryDetail({ rule }: { rule: PlaybookRule }) {
  const [showImpl, setShowImpl] = useState(false)
  const [codeLang, setCodeLang] = useState<'primary' | 'alt'>('primary')
  const activeCode = codeLang === 'primary' ? rule.script.code : rule.script.altCode

  const thresholdStep = rule.computationalSteps.find(s => s.toLowerCase().startsWith('flag when'))
  const signalSteps   = rule.computationalSteps.filter(s => !s.toLowerCase().startsWith('flag when'))

  const isHT      = HT_REFS.has(rule.advisoryRef)
  const accentBg  = isHT ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'
  const accentText = isHT ? 'text-amber-900' : 'text-blue-950'
  const badgeCls  = isHT ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-blue-100 border-blue-200 text-blue-900'
  const linkCls   = isHT ? 'text-amber-600 hover:text-amber-500 border-amber-300' : 'text-blue-800 hover:text-blue-600 border-blue-200'

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">

      {/* ── Advisory Brief ── */}
      <div className={`${accentBg} border rounded-2xl p-5`}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`text-[9px] font-bold font-mono border px-2 py-0.5 rounded ${badgeCls}`}>
            Rule {rule.ruleId}
          </span>
          <a href={rule.advisoryUrl} target="_blank" rel="noopener noreferrer"
            className={`text-[9px] font-bold border bg-white px-2 py-0.5 rounded transition-colors ${linkCls}`}>
            {rule.advisoryRef} ↗
          </a>
        </div>
        <h2 className={`text-sm font-bold leading-snug mb-3 ${accentText}`}>{rule.advisoryTitle}</h2>
        <p className={`text-[11px] leading-relaxed mb-3 ${accentText} opacity-90`}>{rule.advisoryGuidance}</p>
        <div className={`pt-3 border-t ${isHT ? 'border-amber-200' : 'border-blue-100'}`}>
          <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isHT ? 'text-amber-600' : 'text-blue-800'}`}>
            Detection Objective
          </div>
          <p className={`text-[11px] leading-relaxed ${accentText} opacity-80`}>{rule.detectionObjective}</p>
        </div>
      </div>

      {/* ── Red Flags ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">
          Red Flags — What FinCEN Says to Look For
        </div>
        <div className="space-y-3">
          {signalSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-red-600">{i + 1}</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        {thresholdStep && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-[10px] text-red-800 font-semibold leading-snug">{thresholdStep}</p>
          </div>
        )}
      </div>

      {/* ── Detection Implementation (on demand) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowImpl(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span className="text-sm font-semibold text-slate-800 flex-1">View Detection Query</span>
          <span className="text-[9px] text-slate-400">{rule.script.language.toUpperCase()} · {rule.script.altLanguage.toUpperCase()}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
            className={`shrink-0 transition-transform duration-200 ${showImpl ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showImpl && (
          <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-4">
            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex-1">Query</div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(['primary', 'alt'] as const).map((k, i) => {
                  const lang = k === 'primary' ? rule.script.language : rule.script.altLanguage
                  const isActive = codeLang === k
                  return (
                    <button key={k} onClick={() => setCodeLang(k)}
                      className={[
                        'px-3 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors',
                        i > 0 ? 'border-l border-slate-200' : '',
                        isActive
                          ? lang === 'python' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                          : 'bg-white text-slate-400 hover:text-slate-700',
                      ].join(' ')}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Table chips */}
            <div className="flex flex-wrap gap-1.5">
              {rule.script.tables.map(t => (
                <span key={t.name} className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
                  t.source === 'capone'   ? 'bg-blue-50 text-blue-900 border-blue-200' :
                  t.source === 'discover' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                            'bg-slate-100 text-slate-500 border-slate-200'
                }`}>{t.name}</span>
              ))}
            </div>

            {/* Code */}
            <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-72 overflow-y-auto">
              <code className="text-[9px] text-slate-200 font-mono leading-relaxed whitespace-pre">
                {activeCode}
              </code>
            </pre>

            {/* Classification */}
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

export default function PlaybookView() {
  const [selectedId, setSelectedId] = useState(PLAYBOOK_RULES[0].categoryId)
  const selected = PLAYBOOK_RULES.find(r => r.categoryId === selectedId)!

  return (
    <div className="grid grid-cols-[200px_1fr] gap-5 h-full min-h-0">
      <RuleList selectedId={selectedId} onSelect={setSelectedId} />
      <AdvisoryDetail key={selected.categoryId} rule={selected} />
    </div>
  )
}
