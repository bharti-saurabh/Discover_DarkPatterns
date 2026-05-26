import { useState } from 'react'
import { CORRIDOR_CASES, FINCEN_CATEGORIES, type CorridorCase, type CorridorStop } from '../../data/darkPatternsData'

const MCC_COLORS: Record<string, string> = {
  '7011': 'bg-rose-500',
  '4121': 'bg-amber-500',
  '6540': 'bg-purple-500',
  '6010': 'bg-red-600',
  '7297': 'bg-pink-500',
  '7299': 'bg-pink-500',
}

const MCC_LIGHT: Record<string, string> = {
  '7011': 'bg-rose-100 text-rose-700 border-rose-200',
  '4121': 'bg-amber-100 text-amber-700 border-amber-200',
  '6540': 'bg-purple-100 text-purple-700 border-purple-200',
  '6010': 'bg-red-100 text-red-700 border-red-200',
  '7297': 'bg-pink-100 text-pink-700 border-pink-200',
  '7299': 'bg-pink-100 text-pink-700 border-pink-200',
}

function RiskBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-red-600' : score >= 75 ? 'bg-amber-500' : 'bg-yellow-400'
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
      Risk {score}
    </span>
  )
}

function FinCENTag({ id }: { id: string }) {
  const cat = FINCEN_CATEGORIES[id]
  if (!cat) return null
  return (
    <a
      href={cat.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${cat.label} — ${cat.source}`}
      className="text-[10px] font-semibold bg-slate-800 text-white px-2 py-0.5 rounded hover:bg-slate-600 transition-colors"
    >
      {id} ↗
    </a>
  )
}

function CityTimeline({ corridorCase }: { corridorCase: CorridorCase }) {
  const cities = Array.from(new Set(corridorCase.stops.map(s => s.city)))
  const maxDay = Math.max(...corridorCase.stops.map(s => s.day))
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)

  const stopMap = new Map<string, CorridorStop>()
  corridorCase.stops.forEach(s => stopMap.set(`${s.city}-${s.day}`, s))

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-max">
        {/* Day header */}
        <div className="flex">
          <div className="w-28 shrink-0" />
          {days.map(d => (
            <div key={d} className="w-10 text-center text-[10px] text-slate-400 font-medium pb-1">
              D{d}
            </div>
          ))}
        </div>

        {/* City rows */}
        {cities.map(city => (
          <div key={city} className="flex items-center mb-1">
            <div className="w-28 shrink-0 text-[11px] font-medium text-slate-600 pr-2 truncate">{city}</div>
            {days.map(d => {
              const stop = stopMap.get(`${city}-${d}`)
              if (!stop) {
                return (
                  <div key={d} className="w-10 h-8 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                  </div>
                )
              }
              const dominant = stop.transactions[0]
              const hasCapOne = stop.transactions.some(t => t.source === 'capone')
              const hasDiscover = stop.transactions.some(t => t.source === 'discover')
              return (
                <div key={d} className="w-10 h-8 flex items-center justify-center relative group">
                  <div className={`w-6 h-6 rounded-full ${MCC_COLORS[dominant.mcc] ?? 'bg-slate-400'} flex items-center justify-center cursor-pointer shadow-sm`}>
                    <span className="text-white text-[8px] font-bold">{stop.transactions.length}</span>
                  </div>
                  {/* Source indicator dots */}
                  <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
                    {hasCapOne && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 border border-white" />}
                    {hasDiscover && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 border border-white" />}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-52 bg-slate-900 text-white rounded-lg p-2 shadow-xl pointer-events-none">
                    <div className="text-[10px] font-semibold mb-1">{city} · Day {d}</div>
                    {stop.transactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                        <span className={`px-1 rounded text-[9px] font-medium ${MCC_LIGHT[t.mcc] ?? 'bg-slate-700 text-white'}`}>{t.mccLabel}</span>
                        <span className="text-slate-300">${t.amount} · {t.time}</span>
                      </div>
                    ))}
                    <div className="flex gap-1 mt-1 pt-1 border-t border-slate-700">
                      {stop.transactions.some(t => t.source === 'capone') && <span className="text-[9px] text-indigo-300">● Cap One</span>}
                      {stop.transactions.some(t => t.source === 'discover') && <span className="text-[9px] text-violet-300">● Discover</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100 flex-wrap">
          {[
            { mcc: '7011', label: 'Hotel/Motel' },
            { mcc: '4121', label: 'Rideshare' },
            { mcc: '6540', label: 'Prepaid Reload' },
            { mcc: '6010', label: 'ATM Cash' },
          ].map(({ mcc, label }) => (
            <span key={mcc} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`w-3 h-3 rounded-full ${MCC_COLORS[mcc]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-slate-400 ml-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Cap One signal
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-violet-500" /> Discover signal
          </span>
        </div>
      </div>
    </div>
  )
}

function CaseDetail({ c }: { c: CorridorCase }) {
  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Movement Timeline</h3>
          <div className="flex gap-1">
            {c.flaggedCategories.map(id => <FinCENTag key={id} id={id} />)}
          </div>
        </div>
        <CityTimeline corridorCase={c} />
      </div>

      {/* Signal split */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">Capital One sees</span>
          </div>
          <p className="text-[11px] text-indigo-800 leading-relaxed">{c.capOneSignal}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs font-semibold text-violet-700">Discover sees</span>
          </div>
          <p className="text-[11px] text-violet-800 leading-relaxed">{c.discoverSignal}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span className="text-xs font-semibold text-rose-700">Combined insight</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed">{c.combinedInsight}</p>
        </div>
      </div>

      {/* FinCEN reference */}
      <div className="bg-slate-900 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FinCEN Red Flags Triggered</span>
        </div>
        <div className="space-y-2">
          {c.flaggedCategories.map(id => {
            const cat = FINCEN_CATEGORIES[id]
            return (
              <div key={id} className="flex gap-3">
                <a href={cat.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-bold text-amber-400 shrink-0 mt-0.5 hover:text-amber-300">
                  {id} ↗
                </a>
                <div>
                  <div className="text-[11px] font-semibold text-white">{cat.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{cat.description}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{cat.source}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function CorridorView() {
  const [selectedId, setSelectedId] = useState(CORRIDOR_CASES[0].id)
  const selected = CORRIDOR_CASES.find(c => c.id === selectedId)!

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 h-full min-h-0">
      {/* Case list */}
      <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {CORRIDOR_CASES.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full text-left rounded-xl border p-4 transition-colors ${
              selectedId === c.id
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-mono text-xs font-semibold ${selectedId === c.id ? 'text-slate-300' : 'text-slate-500'}`}>{c.id}</span>
              <RiskBadge score={c.riskScore} />
            </div>
            <div className={`text-sm font-semibold mb-1 ${selectedId === c.id ? 'text-white' : 'text-slate-800'}`}>
              {c.corridorLabel}
            </div>
            <div className={`text-xs ${selectedId === c.id ? 'text-slate-400' : 'text-slate-500'}`}>
              Home: {c.homeCityState} · {c.stops.length} stops · {Math.max(...c.stops.map(s => s.day))} days
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {c.flaggedCategories.map(id => <FinCENTag key={id} id={id} />)}
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900">{selected.corridorLabel} Corridor</h3>
              <RiskBadge score={selected.riskScore} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              Cap One: {selected.cardholderIdA}{selected.cardholderIdB ? ` · Discover: ${selected.cardholderIdB}` : ''}
            </div>
          </div>
        </div>
        <CaseDetail c={selected} />
      </div>
    </div>
  )
}
