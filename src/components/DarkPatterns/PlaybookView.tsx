import { useState } from 'react'
import { PLAYBOOK_RULES, type PlaybookRule } from '../../data/playbookData'
import { FINCEN_CATEGORIES } from '../../data/darkPatternsData'

// ── Left panel: rule list ─────────────────────────────────────────────────────────

function RuleList({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5">
        Detection Rules
      </div>

      {PLAYBOOK_RULES.map(rule => {
        const cat = FINCEN_CATEGORIES[rule.categoryId]
        const sel = selectedId === rule.categoryId
        return (
          <button
            key={rule.categoryId}
            onClick={() => onSelect(rule.categoryId)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              sel
                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                sel ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>{rule.ruleId}</span>
              <span className={`text-[8px] font-mono font-semibold ${sel ? 'text-amber-600' : 'text-amber-500'}`}>
                {rule.categoryId}
              </span>
              <span className={`ml-auto text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                sel ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>{rule.triggeredCases.length} cases</span>
            </div>
            <div className={`text-[10px] font-semibold leading-snug ${sel ? 'text-indigo-900' : 'text-slate-700'}`}>
              {cat.label}
            </div>
            <div className={`text-[9px] mt-0.5 ${sel ? 'text-indigo-400' : 'text-slate-400'}`}>
              {rule.advisoryRef}
            </div>
          </button>
        )
      })}

      <div className="mt-2 pt-3 border-t border-slate-100 px-1 space-y-2">
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">FinCEN Sources</div>
        <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008" target="_blank" rel="noopener noreferrer"
          className="block text-[9px] text-amber-600 hover:text-amber-500 leading-snug">
          FIN-2014-A008 ↗
        </a>
        <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008" target="_blank" rel="noopener noreferrer"
          className="block text-[9px] text-amber-600 hover:text-amber-500 leading-snug">
          FIN-2020-A008 ↗
        </a>
        <p className="text-[8px] text-slate-400 leading-snug pt-1">
          Synthetic data only — for demonstration purposes.
        </p>
      </div>
    </div>
  )
}

// ── Advisory detail ───────────────────────────────────────────────────────────────

function AdvisoryDetail({ rule }: { rule: PlaybookRule }) {
  const cat = FINCEN_CATEGORIES[rule.categoryId]
  const [showImpl, setShowImpl] = useState(false)
  const [codeLang, setCodeLang] = useState<'primary' | 'alt'>('primary')

  const activeCode = codeLang === 'primary' ? rule.script.code : rule.script.altCode

  // Separate threshold step from observation steps
  const thresholdStep = rule.computationalSteps.find(s => s.toLowerCase().startsWith('flag when'))
  const observationSteps = rule.computationalSteps.filter(s => !s.toLowerCase().startsWith('flag when'))

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">

      {/* ── 1. Advisory Brief ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold font-mono bg-amber-100 border border-amber-300 text-amber-700 px-2 py-0.5 rounded">
              Rule {rule.ruleId}
            </span>
            <a href={rule.advisoryUrl} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-bold text-amber-600 hover:text-amber-500 border border-amber-300 bg-white px-2 py-0.5 rounded">
              {rule.advisoryRef} ↗
            </a>
            <span className="text-[9px] font-semibold text-amber-700">{cat.label}</span>
          </div>
        </div>

        <h2 className="text-sm font-bold text-amber-900 leading-snug mb-2">{rule.advisoryTitle}</h2>
        <p className="text-[11px] text-amber-800 leading-relaxed">{rule.advisoryGuidance}</p>

        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Detection Objective</div>
          <p className="text-[11px] text-amber-800 leading-relaxed">{rule.detectionObjective}</p>
        </div>
      </div>

      {/* ── 2. What FinCEN Says to Look For ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          What FinCEN Identifies as Red Flags
        </div>

        <div className="space-y-3">
          {observationSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-red-600">{i + 1}</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {thresholdStep && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-[10px] text-red-800 font-semibold leading-snug">{thresholdStep}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Data & Detection Coverage ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Detection Coverage — Cap One + Discover
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
          {/* Cap One alone */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">Capital One alone</span>
            </div>
            <p className="text-[10px] text-indigo-900 leading-snug mb-2">{rule.caponeAlone.capability}</p>
            <div className="flex items-start gap-1.5 bg-white/60 border border-indigo-100 rounded-lg px-2.5 py-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[9px] text-indigo-600 leading-snug italic">{rule.caponeAlone.limitation}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center pt-8 gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="rotate-180"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-1">Combined</span>
          </div>

          {/* Discover alone */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
              <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wider">Discover alone</span>
            </div>
            <p className="text-[10px] text-violet-900 leading-snug mb-2">{rule.discoverAlone.capability}</p>
            <div className="flex items-start gap-1.5 bg-white/60 border border-violet-100 rounded-lg px-2.5 py-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[9px] text-violet-600 leading-snug italic">{rule.discoverAlone.limitation}</p>
            </div>
          </div>
        </div>

        {/* Combined unique insight */}
        <div className="mt-3 bg-gradient-to-r from-indigo-50 via-white to-violet-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex gap-0.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div className="w-2 h-2 rounded-full bg-violet-500 -ml-0.5" />
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">What the combination unlocks</span>
          </div>
          <p className="text-[10px] text-slate-700 leading-snug mb-2">{rule.combined.capability}</p>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Example from this demo</div>
            <p className="text-[10px] text-slate-600 leading-snug italic">{rule.combined.uniqueInsight}</p>
          </div>
        </div>
      </div>

      {/* ── 4. Cases triggered in this demo ── */}
      {rule.evidence.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Cases in This Demo — {rule.triggeredCases.length} triggered
          </div>
          <div className="space-y-2.5">
            {rule.evidence.map(ev => (
              <div key={ev.caseId} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-[9px] font-bold font-mono text-indigo-600">{ev.caseId}</span>
                  <p className="text-[9px] text-slate-600 leading-snug flex-1">{ev.finding}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-3 py-2">
                  {ev.metrics.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.triggered ? 'bg-red-500' : 'bg-slate-300'}`} />
                      <span className="text-[9px] text-slate-500">{m.label}</span>
                      <span className={`text-[9px] font-bold font-mono ${m.triggered ? 'text-red-600' : 'text-slate-400'}`}>{m.observed}</span>
                      <span className="text-[8px] text-slate-400 font-mono">/ {m.threshold}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Detection implementation (on demand) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowImpl(v => !v)}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span className="text-sm font-semibold text-slate-800 flex-1">View Detection Implementation</span>
          <span className="text-[9px] text-slate-400">SQL · Python</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
            className={`shrink-0 transition-transform duration-200 ${showImpl ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showImpl && (
          <div className="px-5 pb-5 border-t border-slate-100 space-y-4">

            {/* Algorithm steps */}
            <div className="pt-4">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Algorithm Steps</div>
              <div className="space-y-2">
                {rule.computationalSteps.map((step, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Language toggle + table sources */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex-1">Query</div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  {(['primary', 'alt'] as const).map((k, i) => {
                    const lang = k === 'primary' ? rule.script.language : rule.script.altLanguage
                    const isActive = codeLang === k
                    return (
                      <button
                        key={k}
                        onClick={() => setCodeLang(k)}
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
              <div className="flex flex-wrap gap-1.5 mb-2">
                {rule.script.tables.map(t => (
                  <span key={t.name} className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
                    t.source === 'capone'   ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    t.source === 'discover' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                              'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>{t.name}</span>
                ))}
              </div>

              {/* Code block */}
              <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-72 overflow-y-auto">
                <code className="text-[9px] text-slate-200 font-mono leading-relaxed whitespace-pre">
                  {activeCode}
                </code>
              </pre>
            </div>

            {/* Classification thresholds */}
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
      <RuleList selectedId={selectedId} onSelect={id => setSelectedId(id)} />
      <AdvisoryDetail key={selected.categoryId} rule={selected} />
    </div>
  )
}
