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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-slate-900">{cat.label}</span>
            <a
              href={rule.advisoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors"
            >
              {rule.advisoryRef} ↗
            </a>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{cat.description}</p>
        </div>
        <div className="flex gap-1 ml-4 shrink-0">
          {rule.triggeredCases.map(id => (
            <span key={id} className="text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded">
              {id}
            </span>
          ))}
        </div>
      </div>

      {/* Advisory guidance */}
      <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
        <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Advisory Guidance — {rule.advisoryRef}</div>
        <p className="text-[11px] text-amber-900 leading-relaxed italic">"{rule.advisoryGuidance}"</p>
      </div>

      {/* Detection objective + algorithm */}
      <div className="grid grid-cols-[1fr_1.2fr] gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detection Objective</div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{rule.detectionObjective}</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detection Algorithm</div>
          <div className="space-y-2">
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

      {/* Data requirements */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Required Data Fields — {rule.dataFields.length} inputs
        </div>
        <div className="space-y-2">
          {rule.dataFields.map((field, i) => {
            const src = SOURCE_COLORS[field.source]
            return (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                <span className="shrink-0 w-5 h-5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {FIELD_TYPE_ICONS[field.type]}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-slate-800">{field.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${src.bg} ${src.text}`}>
                      {src.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{field.description}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
          {(['transaction', 'merchant', 'device', 'geographic', 'temporal'] as DataField['type'][]).map(type => (
            <span key={type} className="flex items-center gap-1 text-[9px] text-slate-400">
              <span className="w-4 h-4 rounded bg-slate-100 text-slate-400 text-[8px] font-bold flex items-center justify-center">
                {FIELD_TYPE_ICONS[type]}
              </span>
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Capability matrix */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Institutional Capability Analysis</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-700">Capital One Alone</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed mb-3">{rule.caponeAlone.capability}</p>
            <div className="border-t border-indigo-200 pt-2">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Blind Spot</div>
              <p className="text-[10px] text-indigo-600 leading-relaxed">{rule.caponeAlone.limitation}</p>
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs font-bold text-violet-700">Discover Alone</span>
            </div>
            <p className="text-[11px] text-violet-800 leading-relaxed mb-3">{rule.discoverAlone.capability}</p>
            <div className="border-t border-violet-200 pt-2">
              <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-1">Blind Spot</div>
              <p className="text-[10px] text-violet-600 leading-relaxed">{rule.discoverAlone.limitation}</p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span className="text-xs font-bold text-emerald-400">Combined Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed mb-3">{rule.combined.capability}</p>
            <div className="border-t border-slate-700 pt-2">
              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Unique Insight</div>
              <p className="text-[10px] text-emerald-300 leading-relaxed">{rule.combined.uniqueInsight}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlaybookView() {
  const [selectedId, setSelectedId] = useState(PLAYBOOK_RULES[0].categoryId)
  const selected = PLAYBOOK_RULES.find(r => r.categoryId === selectedId)!

  return (
    <div className="grid grid-cols-[200px_1fr] gap-5 h-full min-h-0">
      {/* Rule list */}
      <div className="space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">6 FinCEN Categories</div>
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
              <div className="flex items-center justify-between mb-1">
                <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                  {rule.categoryId}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {rule.triggeredCases.length} cases
                </span>
              </div>
              <div className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {cat.label}
              </div>
              <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                {rule.advisoryRef}
              </div>
            </button>
          )
        })}

        {/* Coverage summary */}
        <div className="mt-3 pt-3 border-t border-slate-100 px-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Coverage</div>
          <div className="space-y-1">
            {[
              { label: 'Cap One inputs', count: 4, color: 'bg-indigo-500' },
              { label: 'Discover inputs', count: 3, color: 'bg-violet-500' },
              { label: 'Shared inputs', count: 5, color: 'bg-slate-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-[9px] text-slate-500 flex-1">{item.label}</span>
                <span className="text-[9px] font-bold text-slate-600">{item.count}</span>
              </div>
            ))}
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
