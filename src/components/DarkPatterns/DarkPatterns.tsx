import { useState } from 'react'
import { DARK_PATTERN_STATS } from '../../data/darkPatternsData'
import CorridorView from './CorridorView'
import ControllerGraph from './ControllerGraph'
import FrontBusinessView from './FrontBusinessView'
import PlaybookView from './PlaybookView'

type DarkTab = 'corridor' | 'controller' | 'front-business' | 'playbook'

const TABS: { id: DarkTab; label: string; count: number | string }[] = [
  { id: 'corridor',       label: 'Geographic Corridors', count: 2 },
  { id: 'controller',     label: 'Controller Networks',  count: 1 },
  { id: 'front-business', label: 'Front Businesses',     count: 2 },
  { id: 'playbook',       label: 'Detection Playbook',   count: 6 },
]

function StatBar() {
  return (
    <div className="grid grid-cols-4 gap-3 mb-3">
      {[
        { label: 'Entities Flagged',    value: DARK_PATTERN_STATS.totalEntitiesFlagged,       sub: '3 corridors · 9 accounts · 2 merchants', color: 'text-rose-600' },
        { label: 'Cards Involved',      value: DARK_PATTERN_STATS.totalCardsInvolved,          sub: '6 issuing banks · 4 Cap One accounts',    color: 'text-slate-700' },
        { label: 'FinCEN Categories',   value: DARK_PATTERN_STATS.fincenCategoriesTriggered,   sub: 'FIN-2014-A008 · FIN-2020-A008',           color: 'text-indigo-600' },
        { label: 'Est. Illicit Volume', value: `$${(DARK_PATTERN_STATS.estimatedExposure / 1000000).toFixed(1)}M`, sub: 'Merchants $276K + cash-out $35K',  color: 'text-red-700' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="text-[10px] text-slate-400 font-medium mb-0.5">{s.label}</div>
          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 leading-snug">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

export default function DarkPatterns() {
  const [activeTab, setActiveTab] = useState<DarkTab>('corridor')

  return (
    <div className="flex flex-col h-full px-6 pt-4 pb-4 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-lg font-bold text-slate-900">Dark Pattern Detection</h1>
        <span className="text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
          FinCEN Intelligence
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live monitoring
        </span>

        {/* Detection pipeline — compact inline */}
        <div className="ml-auto flex items-center gap-1 bg-slate-900 rounded-lg px-3 py-1.5">
          {[
            { label: 'Ingest', detail: '150K txns' },
            { label: 'Anomaly', detail: '47 signals' },
            { label: 'Matching', detail: '5 cases' },
            { label: 'FinCEN', detail: '6 cats' },
            { label: 'Alert', detail: '5 alerts' },
          ].map((stage, i, arr) => (
            <div key={stage.label} className="flex items-center gap-1">
              <div className="text-center">
                <div className="flex items-center gap-0.5">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[9px] font-semibold text-slate-300">{stage.label}</span>
                </div>
                <span className="text-[8px] text-emerald-400 font-mono">{stage.detail}</span>
              </div>
              {i < arr.length - 1 && <span className="text-slate-700 text-[9px] mx-0.5">›</span>}
            </div>
          ))}
        </div>

        <div className="text-right shrink-0">
          <div className="text-[9px] text-slate-400">Last run</div>
          <div className="text-[10px] font-mono font-semibold text-slate-600">2024-11-15 00:31 UTC</div>
        </div>
      </div>

      <StatBar />

      {/* Tab bar + FinCEN advisory links */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 ml-auto">
          <span>FinCEN refs:</span>
          <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008" target="_blank" rel="noopener noreferrer"
            className="font-semibold text-amber-600 hover:text-amber-500">FIN-2014-A008 ↗</a>
          <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008" target="_blank" rel="noopener noreferrer"
            className="font-semibold text-amber-600 hover:text-amber-500">FIN-2020-A008 ↗</a>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'corridor'       && <CorridorView />}
        {activeTab === 'controller'     && <ControllerGraph />}
        {activeTab === 'front-business' && <FrontBusinessView />}
        {activeTab === 'playbook'       && <PlaybookView />}
      </div>
    </div>
  )
}
