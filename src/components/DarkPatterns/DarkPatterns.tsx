import { useState } from 'react'
import { DARK_PATTERN_STATS, FINCEN_CATEGORIES } from '../../data/darkPatternsData'
import CorridorView from './CorridorView'
import ControllerGraph from './ControllerGraph'
import FrontBusinessView from './FrontBusinessView'

type DarkTab = 'corridor' | 'controller' | 'front-business'

const TABS: { id: DarkTab; label: string; sublabel: string }[] = [
  { id: 'corridor',       label: 'Geographic Corridors', sublabel: 'Movement pattern analysis' },
  { id: 'controller',     label: 'Controller Networks',  sublabel: 'Device & IP clustering' },
  { id: 'front-business', label: 'Front Businesses',     sublabel: 'Merchant anomaly detection' },
]

const ADVISORIES = [
  {
    id: 'FIN-2014-A008',
    title: 'Guidance on Recognizing Activity that May be Associated with Human Smuggling and Human Trafficking — Financial Red Flags',
    year: 2014,
    url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008',
  },
  {
    id: 'FIN-2020-A008',
    title: 'Supplemental Advisory on Identifying and Reporting Human Trafficking and Related Activity',
    year: 2020,
    url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008',
  },
]

function StatBar() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      {[
        { label: 'Entities Flagged',    value: DARK_PATTERN_STATS.totalEntitiesFlagged,       color: 'text-rose-600' },
        { label: 'Cards Involved',      value: DARK_PATTERN_STATS.totalCardsInvolved,          color: 'text-amber-600' },
        { label: 'FinCEN Categories',   value: DARK_PATTERN_STATS.fincenCategoriesTriggered,   color: 'text-indigo-600' },
        { label: 'Est. Illicit Volume', value: `$${(DARK_PATTERN_STATS.estimatedExposure / 1000000).toFixed(1)}M`, color: 'text-red-700' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div className="text-[11px] text-slate-400 font-medium mb-0.5">{s.label}</div>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}

function AdvisoryBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl mb-5 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <div className="flex-1">
          <span className="text-xs font-semibold text-amber-800">FinCEN Advisory References</span>
          <span className="text-xs text-amber-600 ml-2">{ADVISORIES.map(a => a.id).join(' · ')} — fincen.gov</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-amber-200 pt-3 space-y-3">
          {ADVISORIES.map(adv => (
            <div key={adv.id} className="flex gap-3">
              <span className="text-[11px] font-bold text-amber-700 font-mono shrink-0 mt-0.5">{adv.id}</span>
              <div>
                <a
                  href={adv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-amber-900 hover:underline"
                >
                  {adv.title} ↗
                </a>
                <div className="text-[10px] text-amber-600 mt-0.5">
                  Categories: {Object.entries(FINCEN_CATEGORIES)
                    .filter(([, v]) => v.source.includes(adv.id))
                    .map(([k]) => k).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DarkPatterns() {
  const [activeTab, setActiveTab] = useState<DarkTab>('corridor')

  return (
    <div className="flex flex-col h-full p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-900">Dark Pattern Detection</h1>
          <span className="text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
            FinCEN Intelligence
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Cross-network behavioral signals surfacing trafficking, exploitation, and illicit finance patterns — invisible to either institution alone.
        </p>
      </div>

      <StatBar />
      <AdvisoryBanner />

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'corridor'       && <CorridorView />}
        {activeTab === 'controller'     && <ControllerGraph />}
        {activeTab === 'front-business' && <FrontBusinessView />}
      </div>
    </div>
  )
}
