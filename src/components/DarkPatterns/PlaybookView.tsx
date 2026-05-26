import { useState } from 'react'
import { PLAYBOOK_RULES, type PlaybookRule, type DataField } from '../../data/playbookData'
import { FINCEN_CATEGORIES } from '../../data/darkPatternsData'

const SOURCE_COLORS: Record<DataField['source'], { bg: string; text: string; label: string }> = {
  capone:   { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Cap One' },
  discover: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Discover' },
  both:     { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Both' },
}

const FIELD_TYPE_ICONS: Record<DataField['type'], string> = {
  transaction: 'T',
  merchant:    'M',
  device:      'D',
  geographic:  'G',
  temporal:    '⏱',
}

function RuleDetail({ rule }: { rule: PlaybookRule }) {
  const cat = FINCEN_CATEGORIES[rule.categoryId]

  return (
    <div className="space-y-4 overflow-y-auto scrollbar-thin pr-1 h-full">

      {/* Header — advisory card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-amber-700 font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                Rule {rule.ruleId}
              </span>
              <a
                href={rule.advisoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-amber-600 hover:text-amber-500 underline underline-offset-2"
              >
                {rule.advisoryRef} ↗
              </a>
              <span className="text-[10px] text-amber-600">fincen.gov</span>
            </div>
            <div className="text-xs font-semibold text-amber-900 mb-1">{rule.advisoryTitle}</div>
            <p className="text-[10px] text-amber-700 leading-relaxed italic">"{rule.advisoryGuidance}"</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs font-bold text-slate-700">{cat.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{rule.triggeredCases.length} active cases</div>
            <div className="flex gap-1 mt-1.5 justify-end">
              {rule.triggeredCases.map(id => (
                <span key={id} className="text-[9px] font-mono font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detection objective + algorithm */}
      <div className="grid grid-cols-[1fr_1.3fr] gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detection Objective</div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{rule.detectionObjective}</p>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Data Inputs</div>
            <div className="space-y-1.5">
              {rule.dataFields.map((field, i) => {
                const src = SOURCE_COLORS[field.source]
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-4 h-4 rounded bg-slate-200 text-slate-500 text-[8px] font-bold flex items-center justify-center mt-0.5">
                      {FIELD_TYPE_ICONS[field.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-700 truncate">{field.name}</span>
                        <span className={`shrink-0 text-[8px] font-bold px-1 py-0.5 rounded ${src.bg} ${src.text}`}>{src.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-snug">{field.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detection Algorithm</div>
          <div className="space-y-2.5">
            {rule.computationalSteps.map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded bg-indigo-700 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capability matrix */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Institutional Capability — What Each Institution Sees Alone vs. Combined</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-700">Capital One Alone</span>
            </div>
            <p className="text-[10px] text-indigo-800 leading-relaxed mb-2">{rule.caponeAlone.capability}</p>
            <div className="border-t border-indigo-200 pt-2">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Blind Spot</div>
              <p className="text-[10px] text-indigo-600 leading-relaxed">{rule.caponeAlone.limitation}</p>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs font-bold text-violet-700">Discover Alone</span>
            </div>
            <p className="text-[10px] text-violet-800 leading-relaxed mb-2">{rule.discoverAlone.capability}</p>
            <div className="border-t border-violet-200 pt-2">
              <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">Blind Spot</div>
              <p className="text-[10px] text-violet-600 leading-relaxed">{rule.discoverAlone.limitation}</p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span className="text-xs font-bold text-emerald-400">Combined Intelligence</span>
            </div>
            <p className="text-[10px] text-slate-200 leading-relaxed mb-2">{rule.combined.capability}</p>
            <div className="border-t border-slate-700 pt-2">
              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Unique Insight</div>
              <p className="text-[10px] text-emerald-300 leading-relaxed">{rule.combined.uniqueInsight}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Case evidence */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Rule Trigger Evidence — Actual Data from Active Cases
        </div>
        <div className="space-y-3">
          {rule.evidence.map(ev => (
            <div key={ev.caseId} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
                  {ev.caseId}
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{ev.finding}</p>
              </div>
              <div className="px-4 py-2">
                <div className="grid grid-cols-[2fr_1fr_1fr_48px] gap-x-3 gap-y-1.5 items-center">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metric</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Observed</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Threshold</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</div>
                  {ev.metrics.map((m, i) => (
                    <>
                      <div key={`l-${i}`} className="text-[10px] text-slate-600 font-medium">{m.label}</div>
                      <div key={`o-${i}`} className="text-[10px] font-mono font-semibold text-slate-800">{m.observed}</div>
                      <div key={`t-${i}`} className="text-[10px] text-slate-400 font-mono">{m.threshold}</div>
                      <div key={`s-${i}`} className="text-right">
                        {m.triggered
                          ? <span className="text-[9px] font-bold text-emerald-600">✓ HIT</span>
                          : <span className="text-[9px] font-bold text-slate-400">— miss</span>
                        }
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlaybookView() {
  const [selectedId, setSelectedId] = useState(PLAYBOOK_RULES[0].categoryId)
  const selected = PLAYBOOK_RULES.find(r => r.categoryId === selectedId)!

  return (
    <div className="grid grid-cols-[210px_1fr] gap-5 h-full min-h-0">
      {/* Rule list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-thin pr-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
          FinCEN Advisory → Detection Rule
        </div>
        {PLAYBOOK_RULES.map(rule => {
          const cat = FINCEN_CATEGORIES[rule.categoryId]
          const isSelected = selectedId === rule.categoryId
          return (
            <button
              key={rule.categoryId}
              onClick={() => setSelectedId(rule.categoryId)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                  {rule.ruleId}
                </span>
                <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                  {rule.categoryId}
                </span>
                <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {rule.triggeredCases.length}
                </span>
              </div>
              <div className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {cat.label}
              </div>
              <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                {rule.advisoryRef}
              </div>
            </button>
          )
        })}

        <div className="mt-2 pt-3 border-t border-slate-100 px-1 space-y-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Advisory Sources</div>
          <a
            href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[9px] text-amber-600 hover:text-amber-500 underline underline-offset-1 leading-snug"
          >
            FIN-2014-A008 — Human Trafficking Financial Red Flags ↗
          </a>
          <a
            href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[9px] text-amber-600 hover:text-amber-500 underline underline-offset-1 leading-snug"
          >
            FIN-2020-A008 — Supplemental Trafficking Advisory ↗
          </a>
          <div className="text-[9px] text-slate-400 leading-snug pt-1">
            Rules HT-1 through HT-6 derived from FinCEN advisory guidance. All case data is synthetic and for demonstration purposes.
          </div>
        </div>
      </div>

      {/* Rule detail */}
      <div className="min-h-0 overflow-hidden">
        <RuleDetail key={selected.categoryId} rule={selected} />
      </div>
    </div>
  )
}
