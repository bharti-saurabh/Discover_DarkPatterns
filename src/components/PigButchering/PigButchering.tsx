import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import {
  PB_CASES, PB_AGENTS, PB_FINDINGS, PB_FINCEN, pbFindingsForCase,
  type PBCase, type PBFinding, type PBAgent,
} from '../../data/pigButcheringData'

// ── Micro-components ─────────────────────────────────────────────────────────────

function PulseDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  )
}

function RiskBadge({ score }: { score: number }) {
  const cls = score >= 95 ? 'bg-red-600' : score >= 85 ? 'bg-orange-500' : 'bg-amber-500'
  return <span className={`${cls} text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono`}>{score}</span>
}

function VerdictChip({ verdict }: { verdict: 'FLAGGED' | 'REVIEW' | 'PASS' }) {
  const cls = verdict === 'FLAGGED' ? 'bg-red-100 text-red-700'
    : verdict === 'REVIEW' ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-500'
  return <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{verdict}</span>
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-red-500' : value >= 80 ? 'bg-orange-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[8px] font-mono text-slate-500">{value}%</span>
    </div>
  )
}

function fmt$(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

// ── Agent Detail Modal ────────────────────────────────────────────────────────────

function PBAgentDetailModal({ agent, finding, onClose }: { agent: PBAgent; finding: PBFinding; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl z-10 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-bold font-mono text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">{agent.rule}</span>
              <VerdictChip verdict={finding.verdict} />
            </div>
            <div className="text-sm font-bold text-slate-900">{agent.name}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug max-w-sm">{agent.description}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 ml-4 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Analysis Steps</div>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <span>Check</span><span>Observed</span><span>Threshold</span><span>Result</span>
            </div>
            {finding.steps.map((step, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2.5 border-b border-slate-100 last:border-0 ${step.triggered ? 'bg-red-50/50' : ''}`}>
                <span className="text-[9px] text-slate-700 leading-snug">{step.text}</span>
                <span className="text-[9px] font-mono text-amber-600 text-right whitespace-nowrap self-start">{step.metric ?? '—'}</span>
                <span className="text-[9px] font-mono text-slate-400 text-right whitespace-nowrap self-start">{step.threshold ?? '—'}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 self-start ${step.triggered ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  {step.triggered
                    ? <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Finding</div>
          <p className="text-[10px] text-slate-700 leading-relaxed mb-3">{finding.finding}</p>
          <ConfidenceBar value={finding.confidence} />
        </div>
      </div>
    </div>
  )
}

// ── Grooming Timeline ─────────────────────────────────────────────────────────────

const EVENT_COLOR: Record<string, { dot: string; bg: string; text: string }> = {
  'contact':       { dot: 'bg-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-900' },
  'test-deposit':  { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  'wire':          { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700' },
  'credit-advance':{ dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700' },
  'blocked':       { dot: 'bg-slate-500',   bg: 'bg-slate-100',  text: 'text-slate-600' },
  'fraud-report':  { dot: 'bg-slate-900',   bg: 'bg-slate-100',  text: 'text-slate-900' },
}

function GroomingTimeline({ c }: { c: PBCase }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxDay = Math.max(...c.events.map(e => e.day))
  const pos = (day: number) => `${((day - 1) / (maxDay - 1)) * 100}%`
  const attackStartPct = ((c.firstAttackDay - 1) / (maxDay - 1)) * 100

  return (
    <div>
      {/* Phase labels */}
      <div className="flex text-[8px] font-bold uppercase tracking-wider mb-2">
        <div style={{ width: `${attackStartPct}%` }} className="text-blue-600">
          Grooming · {c.groomingDays} days
        </div>
        <div style={{ width: `${100 - attackStartPct}%` }} className="text-red-500 text-right">
          Attack · {maxDay - c.firstAttackDay + 1} days
        </div>
      </div>

      {/* Track */}
      <div className="relative mb-8">
        <div className="h-3 flex rounded-full overflow-hidden">
          <div className="bg-blue-100" style={{ width: `${attackStartPct}%` }} />
          <div className="bg-red-100 flex-1" />
        </div>
        {/* Phase divider */}
        <div className="absolute top-0 h-3 w-0.5 bg-red-400" style={{ left: `${attackStartPct}%` }} />

        {/* Event dots */}
        {c.events.map(e => {
          const col = EVENT_COLOR[e.type] ?? EVENT_COLOR['contact']
          const isHovered = hovered === e.day
          return (
            <div
              key={e.day}
              className="absolute -translate-x-1/2 -top-1 group"
              style={{ left: pos(e.day) }}
              onMouseEnter={() => setHovered(e.day)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`w-5 h-5 rounded-full ${col.dot} ring-2 ring-white shadow-sm cursor-pointer flex items-center justify-center transition-transform ${isHovered ? 'scale-125' : ''}`}>
                {e.amount && (
                  <span className="text-white text-[6px] font-bold leading-none">$</span>
                )}
              </div>
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-52 bg-slate-900 text-white rounded-xl p-2.5 shadow-xl pointer-events-none">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-semibold">{e.label}</span>
                    <span className="text-[8px] text-slate-400">Day {e.day}</span>
                  </div>
                  {e.amount && (
                    <div className={`text-[11px] font-bold font-mono mb-1 ${e.type === 'wire' || e.type === 'credit-advance' ? 'text-red-400' : 'text-amber-400'}`}>
                      ${e.amount.toLocaleString()}
                    </div>
                  )}
                  <p className="text-[8px] text-slate-400 leading-snug">{e.detail}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day labels for key events */}
      <div className="relative h-5">
        {c.events.filter(e => e.type !== 'contact').map(e => (
          <div
            key={e.day}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: pos(e.day) }}
          >
            <div className="text-[7px] text-slate-400 leading-tight">Day {e.day}</div>
            {e.amount && (
              <div className={`text-[7px] font-bold font-mono leading-tight ${
                e.type === 'blocked' ? 'text-slate-400 line-through' :
                e.type === 'wire' || e.type === 'credit-advance' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {e.type === 'blocked' ? `$${(e.amount/1000).toFixed(0)}K ✗` : `$${(e.amount/1000).toFixed(0)}K`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
        {([
          ['test-deposit', 'Test deposits'],
          ['wire', 'Wire transfers'],
          ['credit-advance', 'Credit advance'],
          ['blocked', 'Blocked'],
          ['fraud-report', 'Fraud report'],
        ] as [string, string][]).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1.5 text-[9px] text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLOR[type]?.dot}`} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Transfer Escalation Chart ─────────────────────────────────────────────────────

function TransferChart({ c }: { c: PBCase }) {
  const chartData = c.events
    .filter(e => e.amount && e.type !== 'blocked')
    .map((e, i) => ({
      name: e.type === 'test-deposit' ? `Test ${i < 3 ? i + 1 : ''}`.trim() : `Day ${e.day}`,
      amount: e.amount!,
      type: e.type,
    }))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">Transfer Escalation</span>
        <span className="text-[9px] text-blue-800 font-mono">avg monthly spend {fmt$(c.avgMonthlySpend)}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap={6}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} />
          <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickFormatter={v => v >= 1000 ? `$${v / 1000}K` : `$${v}`} />
          <Tooltip
            formatter={v => [`$${(v as number).toLocaleString()}`, 'Amount']}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0' }}
          />
          <ReferenceLine y={c.avgMonthlySpend} stroke="#6366F1" strokeDasharray="3 3" strokeWidth={1.5}
            label={{ value: 'Avg monthly spend', fontSize: 8, fill: '#6366F1', position: 'insideTopRight' }} />
          <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={
                entry.type === 'test-deposit' ? '#CBD5E1' :
                entry.type === 'credit-advance' ? '#7C3AED' :
                '#EF4444'
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" /> Test deposits</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Wire transfers</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-violet-600 inline-block" /> Credit advance</span>
      </div>
    </div>
  )
}

// ── Agent Signal Cards ────────────────────────────────────────────────────────────

function PBAgentSignalCards({ findings }: { findings: PBFinding[] }) {
  const [modalAgentId, setModalAgentId] = useState<string | null>(null)
  const modalFinding = modalAgentId ? findings.find(f => f.agentId === modalAgentId) ?? null : null
  const modalAgent = modalAgentId ? PB_AGENTS.find(a => a.id === modalAgentId) ?? null : null
  const flagCount = findings.filter(f => f.verdict === 'FLAGGED').length

  return (
    <div className="space-y-3">
      {modalFinding && modalAgent && (
        <PBAgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModalAgentId(null)} />
      )}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Why This Was Flagged</span>
        <span className="text-[8px] text-slate-400">{flagCount} of {findings.length} agents flagged</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {findings.map(f => {
          const agent = PB_AGENTS.find(a => a.id === f.agentId)!
          const isFlagged = f.verdict === 'FLAGGED'
          const triggered = f.steps.filter(s => s.triggered)

          return (
            <button
              key={f.agentId}
              onClick={() => setModalAgentId(f.agentId)}
              className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`h-0.5 ${isFlagged ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-300' : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300'}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[8px] font-bold font-mono text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">{agent.rule}</span>
                      <VerdictChip verdict={f.verdict} />
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">{agent.name}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-2xl font-black font-mono leading-none tabular-nums ${isFlagged ? 'text-red-600' : 'text-amber-500'}`}>
                      {f.confidence}<span className="text-sm font-bold">%</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">confidence</div>
                  </div>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${isFlagged ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-amber-400 to-yellow-300'}`}
                    style={{ width: `${f.confidence}%` }}
                  />
                </div>
                <div className="space-y-2.5 mb-4">
                  {triggered.slice(0, 3).map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px ${isFlagged ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isFlagged ? 'bg-red-500' : 'bg-amber-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="text-[9px] text-slate-600">{step.text}</span>
                        {step.metric && (
                          <span className={`ml-1.5 inline-block text-[8px] font-bold font-mono px-1 py-0.5 rounded ${isFlagged ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                            {step.metric}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center justify-between pt-3 border-t ${isFlagged ? 'border-red-100' : 'border-amber-100'}`}>
                  <span className="text-[8px] text-slate-400" />
                  <div className={`flex items-center gap-1 text-[9px] font-semibold transition-colors ${isFlagged ? 'text-red-500 group-hover:text-red-700' : 'text-amber-500 group-hover:text-amber-700'}`}>
                    View intel
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── FinCEN Panel ──────────────────────────────────────────────────────────────────

function PBFinCENPanel({ categories }: { categories: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">FinCEN Advisory Triggers</span>
        <span className="ml-auto text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{categories.length} matched</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(id => {
          const ref = PB_FINCEN[id]
          return (
            <a key={id} href={ref?.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 transition-colors">
              <span className="text-[8px] font-bold text-amber-600 font-mono shrink-0 mt-0.5">{id} ↗</span>
              <span className="text-[9px] text-amber-800 font-medium leading-tight">{ref?.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ── Strategist Verdict ────────────────────────────────────────────────────────────

function PBStrategistVerdict({ f }: { f: PBFinding }) {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-red-950 border border-red-900/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <PulseDot color="bg-red-500" />
        <span className="text-sm font-bold text-white">Case Strategist Verdict</span>
        <span className="ml-auto text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">{f.verdict}</span>
      </div>
      <p className="text-[11px] text-slate-200 leading-relaxed mb-2.5">{f.finding}</p>
      <ConfidenceBar value={f.confidence} />
    </div>
  )
}

// ── Victim Detail (center panel) ─────────────────────────────────────────────────

function VictimDetail({ c }: { c: PBCase }) {
  const nonStratFindings = pbFindingsForCase(c.id).filter(f => f.agentId !== 'pb-strategist')
  const strategist = pbFindingsForCase(c.id).find(f => f.agentId === 'pb-strategist')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider">Cardholder · Crypto Scam</span>
              <span className="font-mono text-[9px] text-slate-500">{c.id}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">Pig Butchering — {c.groomingPlatform}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{c.cardholderLabel} · Age {c.cardholderAge} · {c.occupation}</div>
            <div className="text-xs text-slate-400 mt-0.5 italic">Scammer persona: {c.groomingPersona}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] text-slate-400 mb-0.5">Risk Score</div>
            <div className={`text-3xl font-bold font-mono ${c.riskScore >= 90 ? 'text-red-600' : 'text-orange-500'}`}>{c.riskScore}</div>
            <div className="text-[10px] font-bold text-red-600 mt-1">{fmt$(c.totalLost)} lost</div>
            {c.totalBlocked > 0 && (
              <div className="text-[9px] text-emerald-600 font-semibold">{fmt$(c.totalBlocked)} blocked</div>
            )}
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
          {[
            { label: 'Card Type', value: c.cardType },
            { label: 'Account Age', value: c.cardVintage },
            { label: 'Credit Limit', value: fmt$(c.creditLimit) },
            { label: 'Avg Monthly Spend', value: fmt$(c.avgMonthlySpend) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5">
              <div className="text-[8px] text-slate-400 font-medium">{label}</div>
              <div className="text-[10px] font-semibold text-slate-800 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Credit utilization bar */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-slate-400 font-medium">Credit utilization before attack</span>
                <span className="text-[9px] font-bold text-slate-600">{(c.creditUtilBefore * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.creditUtilBefore * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-slate-400 font-medium">Peak utilization during attack</span>
                <span className="text-[9px] font-bold text-red-600">{(c.creditUtilPeak * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${c.creditUtilPeak * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-case link */}
      {c.crossCaseLinks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-red-700 uppercase tracking-wider">Cross-Case Exchange Network</div>
            <div className="text-[10px] text-red-600 mt-0.5">
              Receiving wallet cluster 0x7f3a…c42d shared with <span className="font-bold">{c.crossCaseLinks.join(', ')}</span> — confirmed multi-victim pig butchering operation
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-800">Grooming → Attack Timeline</h3>
          <span className="text-[9px] text-slate-400">Hover events for detail · {c.events.length} key events</span>
        </div>
        <GroomingTimeline c={c} />
      </div>

      {/* Transfer chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <TransferChart c={c} />
      </div>

      {/* Agent signal cards */}
      <PBAgentSignalCards findings={nonStratFindings} />

      {/* FinCEN panel */}
      <PBFinCENPanel categories={c.flaggedCategories} />

      {/* Strategist verdict */}
      {strategist && <PBStrategistVerdict f={strategist} />}
    </div>
  )
}

// ── Left panel: Case List ─────────────────────────────────────────────────────────

function PBCaseList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="w-[248px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-orange-500" />
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Pig Butchering Cases</span>
        </div>
        <div className="text-[8px] text-slate-400">{PB_CASES.length} active victims · crypto investment scams</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
        {PB_CASES.map(c => {
          const sel = selectedId === c.id
          const findings = pbFindingsForCase(c.id)
          const hits = findings.filter(f => f.verdict === 'FLAGGED').length
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left rounded-xl p-3 transition-all border ${sel
                ? 'bg-orange-50 border-orange-200 shadow-sm'
                : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-sm'}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`font-mono text-[9px] font-bold ${sel ? 'text-orange-600' : 'text-slate-500'}`}>{c.id}</span>
                <RiskBadge score={c.riskScore} />
              </div>
              <div className={`text-[11px] font-semibold leading-tight mb-1 ${sel ? 'text-orange-900' : 'text-slate-800'}`}>
                {c.groomingPlatform} Scam · Age {c.cardholderAge}
              </div>
              <div className={`text-[9px] ${sel ? 'text-orange-600' : 'text-slate-500'}`}>
                {fmt$(c.totalLost)} lost · {c.groomingDays}d grooming
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${sel ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600'}`}>
                  {hits} flagged
                </span>
                {c.crossCaseLinks.length > 0 && (
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded font-mono ${sel ? 'bg-orange-100 text-orange-700' : 'bg-orange-50 text-orange-600'}`}>
                    linked: {c.crossCaseLinks[0]}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
        <div className="text-[8px] text-slate-400">Last scan: 2026-05-27 00:31 UTC</div>
      </div>
    </div>
  )
}

// ── Right panel: Agent Accordion ─────────────────────────────────────────────────

function PBAgentPanel({ caseId }: { caseId: string }) {
  const allFindings = pbFindingsForCase(caseId)
  const findings = allFindings.filter(f => f.agentId !== 'pb-strategist')
  const strategist = allFindings.find(f => f.agentId === 'pb-strategist')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal] = useState<string | null>(null)

  const modalFinding = modal ? allFindings.find(f => f.agentId === modal) : null
  const modalAgent = modal ? PB_AGENTS.find(a => a.id === modal) : null

  function StepRow({ step }: { step: PBFinding['steps'][number] }) {
    return (
      <div className="flex items-start gap-1.5">
        <span className={`shrink-0 mt-0.5 w-3 h-3 rounded-full flex items-center justify-center ${step.triggered ? 'bg-red-500' : 'bg-slate-200'}`}>
          {step.triggered
            ? <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </span>
        <div className="min-w-0">
          <div className="text-[8px] text-slate-600 leading-tight">{step.text}</div>
          {(step.metric || step.threshold) && (
            <div className="flex items-center gap-2 mt-0.5">
              {step.metric && <span className={`text-[8px] font-mono font-semibold ${step.triggered ? 'text-red-600' : 'text-slate-400'}`}>{step.metric}</span>}
              {step.threshold && <span className="text-[7px] text-slate-400 font-mono">thr: {step.threshold}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {modalFinding && modalAgent && (
        <PBAgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModal(null)} />
      )}
      <div className="px-3 py-2.5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-orange-500" />
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Agent Analysis</span>
        </div>
        <div className="text-[8px] text-slate-400">{caseId} · click to expand</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {findings.map(f => {
          const agent = PB_AGENTS.find(a => a.id === f.agentId)!
          const isOpen = expanded === f.agentId
          return (
            <div key={f.agentId} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <button
                className="w-full flex items-center gap-2 px-2.5 py-2.5 hover:bg-slate-100 transition-colors text-left"
                onClick={() => setExpanded(prev => prev === f.agentId ? null : f.agentId)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${f.verdict === 'FLAGGED' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="text-[7px] font-bold font-mono text-blue-800 w-7 shrink-0">{agent.rule}</span>
                <span className="text-[9px] font-semibold text-slate-800 flex-1 truncate">{agent.name}</span>
                <VerdictChip verdict={f.verdict} />
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-2.5 pb-3 border-t border-slate-200">
                  <div className="space-y-2 mt-2.5">
                    {f.steps.map((step, i) => <StepRow key={i} step={step} />)}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200">
                    <p className="text-[8px] text-slate-500 leading-snug italic mb-2.5">{f.finding}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ConfidenceBar value={f.confidence} /></div>
                      <button
                        onClick={() => setModal(f.agentId)}
                        className="shrink-0 text-[8px] font-semibold text-blue-800 hover:text-blue-900 border border-blue-200 hover:border-blue-500 px-2 py-1 rounded transition-colors whitespace-nowrap"
                      >Full Analysis →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {strategist && (
          <div className="bg-red-50 rounded-xl overflow-hidden border border-red-200">
            <button
              className="w-full flex items-center gap-2 px-2.5 py-2.5 hover:bg-red-100 transition-colors text-left"
              onClick={() => setExpanded(prev => prev === 'pb-strategist' ? null : 'pb-strategist')}
            >
              <PulseDot color="bg-red-500" />
              <span className="text-[9px] font-semibold text-red-900 flex-1">Case Strategist</span>
              <VerdictChip verdict={strategist.verdict} />
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
                className={`shrink-0 transition-transform duration-200 ${expanded === 'pb-strategist' ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === 'pb-strategist' && (
              <div className="px-2.5 pb-3 border-t border-red-200">
                <div className="space-y-2 mt-2.5">
                  {strategist.steps.map((step, i) => <StepRow key={i} step={step} />)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-red-200">
                  <p className="text-[8px] text-red-700 leading-snug italic font-semibold mb-2.5">{strategist.finding}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><ConfidenceBar value={strategist.confidence} /></div>
                    <button
                      onClick={() => setModal('pb-strategist')}
                      className="shrink-0 text-[8px] font-semibold text-blue-800 hover:text-blue-900 border border-blue-200 hover:border-blue-500 px-2 py-1 rounded transition-colors whitespace-nowrap"
                    >Full Analysis →</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="text-[8px] text-slate-400">Analysis completed · {caseId}</div>
      </div>
    </div>
  )
}

// ── Scanning panel (no case selected) ────────────────────────────────────────────

function PBScanningPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Agent Activity</span>
        </div>
        <div className="text-[8px] text-slate-400">4 agents scanning continuously</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PB_AGENTS.map(agent => {
          const hits = PB_FINDINGS.filter(f => f.agentId === agent.id && f.verdict === 'FLAGGED').length
          return (
            <div key={agent.id} className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <PulseDot color={hits > 0 ? 'bg-orange-500' : 'bg-slate-300'} />
                <span className="text-[9px] font-semibold text-slate-700 flex-1 truncate">{agent.name}</span>
                {hits > 0 && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{hits} hit{hits > 1 ? 's' : ''}</span>}
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[7px] font-bold text-blue-800 font-mono">{agent.rule}</span>
                <span className="text-[7px] text-slate-400">·</span>
                <span className="text-[7px] text-slate-400">{agent.scanCount} {agent.scanLabel}</span>
              </div>
              <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full animate-pulse" style={{ width: hits > 0 ? '100%' : '55%' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="text-[8px] text-slate-400">Last full scan: 2026-05-27 00:31 UTC</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────────

export default function PigButchering() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelect(id: string) {
    setSelectedId(null)
    requestAnimationFrame(() => setSelectedId(id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <PBCaseList selectedId={selectedId} onSelect={handleSelect} />
      <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50 px-4 py-4">
        {selectedId
          ? <VictimDetail key={selectedId} c={PB_CASES.find(c => c.id === selectedId)!} />
          : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div className="text-sm font-semibold text-slate-700 mb-1">Select a victim case</div>
              <div className="text-[10px] text-slate-400 max-w-56 leading-relaxed">
                Choose a case from the registry to view the grooming timeline, transfer escalation, and agent findings.
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-xs">
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-lg font-bold text-red-600 mb-0.5">{PB_CASES.reduce((s, c) => s + c.totalLost, 0).toLocaleString()}</div>
                  <div className="text-[9px] text-slate-500">Total $ lost</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600 mb-0.5">{fmt$(PB_CASES.reduce((s, c) => s + c.totalBlocked, 0))}</div>
                  <div className="text-[9px] text-slate-500">Blocked</div>
                </div>
              </div>
            </div>
          )
        }
      </div>
      <div className="w-[270px] shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
        {selectedId
          ? <PBAgentPanel key={selectedId} caseId={selectedId} />
          : <PBScanningPanel />
        }
      </div>
    </div>
  )
}
