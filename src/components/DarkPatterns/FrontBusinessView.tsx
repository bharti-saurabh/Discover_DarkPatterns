import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { FRONT_BUSINESS_CASES, FINCEN_CATEGORIES, type FrontBusinessCase } from '../../data/darkPatternsData'

function fmt$(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function pct(n: number) { return `${(n * 100).toFixed(0)}%` }

function MetricCard({ label, value, peer }: { label: string; value: string; peer: string; higherIsBad?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="text-[10px] text-slate-400 font-medium mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-slate-400">Peer avg: {peer}</span>
      </div>
    </div>
  )
}

function HourChart({ data, nightPct }: { data: FrontBusinessCase['hourlyVolume']; nightPct: number }) {
  const nightHours = new Set([22, 23, 0, 1, 2, 3])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">Transaction Volume by Hour</span>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
          {pct(nightPct)} after 10 PM
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap={1}>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            tickFormatter={h => h % 6 === 0 ? `${h}:00` : ''}
          />
          <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
          <Tooltip
            formatter={(val, name) => [fmt$(val as number), name === 'volume' ? 'This merchant' : 'Peer avg']}
            labelFormatter={h => `${h}:00`}
            contentStyle={{ fontSize: 11, border: '1px solid #E2E8F0' }}
          />
          <ReferenceLine x={22} stroke="#E11D48" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: '10 PM', fontSize: 9, fill: '#E11D48', position: 'insideTop' }} />
          <Bar dataKey="peerAvg" name="peerAvg" fill="#E2E8F0" radius={[2, 2, 0, 0]} />
          <Bar dataKey="volume" name="volume" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.hour} fill={nightHours.has(entry.hour) ? '#E11D48' : '#6366F1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" /> This merchant</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> After 10 PM (flagged)</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-slate-200 inline-block" /> Peer average</span>
      </div>
    </div>
  )
}

function CaseDetail({ c }: { c: FrontBusinessCase }) {
  return (
    <div className="space-y-4">
      {/* Merchant header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-bold text-slate-900">{c.merchantName}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{c.merchantId} · {c.legalEntityName}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Declared: {c.declaredBusiness} · MCC {c.mcc} ({c.mccLabel}) · {c.city}, {c.state}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Risk {c.riskScore}</span>
            {c.commercialCounterpartyId && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                Cap One credit: {fmt$(c.commercialExposure ?? 0)}
              </span>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MetricCard
            label="Monthly Volume"
            value={fmt$(c.monthlyVolume)}
            peer={fmt$(c.peerMonthlyVolume)}
          />
          <MetricCard
            label="Avg Ticket"
            value={`$${c.avgTicket}`}
            peer={`$${c.peerAvgTicket}`}
          />
          <MetricCard
            label="Chargeback Rate"
            value={c.chargebackRate === 0 ? '0.00%' : pct(c.chargebackRate)}
            peer={pct(c.peerChargebackRate)}
          />
          <MetricCard
            label="Card-Not-Present"
            value={pct(c.cnpPct)}
            peer="~30%"
          />
        </div>

        {/* Hour chart */}
        <HourChart data={c.hourlyVolume} nightPct={c.nightPct} />
      </div>

      {/* FinCEN red flags */}
      <div className="bg-slate-900 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">FinCEN Red Flags — {c.fincenRedFlags.length} triggered</div>
        <div className="space-y-3">
          {c.fincenRedFlags.map((rf, i) => (
            <div key={i} className="flex gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
              <div className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-white">{rf.flag}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{rf.detail}</div>
              </div>
            </div>
          ))}
        </div>
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

      {/* FinCEN category detail */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-600 mb-3">FinCEN Advisory Categories</div>
        <div className="flex flex-wrap gap-2">
          {c.flaggedCategories.map(id => {
            const cat = FINCEN_CATEGORIES[id]
            return (
              <a key={id} href={cat.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="border border-slate-200 rounded-lg p-2 text-[10px] max-w-[220px] hover:border-amber-300 hover:bg-amber-50 transition-colors block">
                <span className="font-bold text-amber-600">{id} ↗</span>
                <span className="text-slate-600 ml-1">{cat.label}</span>
                <div className="text-slate-400 mt-0.5">{cat.source}</div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function FrontBusinessView() {
  const [selectedId, setSelectedId] = useState(FRONT_BUSINESS_CASES[0].id)
  const selected = FRONT_BUSINESS_CASES.find(c => c.id === selectedId)!

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 h-full min-h-0">
      {/* Case list */}
      <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {FRONT_BUSINESS_CASES.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full text-left rounded-xl border p-4 transition-colors ${
              selectedId === c.id ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-mono text-xs font-semibold ${selectedId === c.id ? 'text-slate-300' : 'text-slate-500'}`}>{c.id}</span>
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Risk {c.riskScore}</span>
            </div>
            <div className={`text-sm font-semibold mb-1 truncate ${selectedId === c.id ? 'text-white' : 'text-slate-800'}`}>{c.merchantName}</div>
            <div className={`text-xs ${selectedId === c.id ? 'text-slate-400' : 'text-slate-500'}`}>
              MCC {c.mcc} · {c.city}, {c.state}
            </div>
            <div className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-slate-400' : 'text-slate-500'}`}>
              {fmt$(c.monthlyVolume)}/mo · {pct(c.nightPct)} after 10 PM
            </div>
            {c.commercialCounterpartyId && (
              <div className="mt-1.5">
                <span className="text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                  Cap One credit link
                </span>
              </div>
            )}
            <div className="flex gap-1 mt-2 flex-wrap">
              {c.flaggedCategories.map(id => {
                const cat = FINCEN_CATEGORIES[id]
                return (
                  <a key={id} href={cat?.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold bg-slate-800 text-white px-2 py-0.5 rounded hover:bg-slate-600 transition-colors">
                    {id} ↗
                  </a>
                )
              })}
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="overflow-y-auto scrollbar-thin">
        <CaseDetail c={selected} />
      </div>
    </div>
  )
}
