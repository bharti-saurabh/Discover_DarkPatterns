import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ReactFlow, Background, Controls, MarkerType, Handle, Position, type Node, type Edge } from '@xyflow/react'
import {
  CORRIDOR_CASES, CONTROLLER_CASES, FRONT_BUSINESS_CASES, FINCEN_CATEGORIES,
  type CorridorCase, type FrontBusinessCase, type ControllerCase, type AccountContext,
} from '../../data/darkPatternsData'
import {
  AGENTS, AGENT_FINDINGS, findingsForCase,
  type AgentFinding, type AgentDef,
  type Artifact, type TableArtifact, type MetricGridArtifact, type IntelListArtifact, type ChecklistArtifact,
} from '../../data/agentData'

// ── Types ───────────────────────────────────────────────────────────────────────

type EntityType = 'cardholder' | 'merchant' | 'cluster'

interface CaseEntry {
  id: string
  entityType: EntityType
  label: string
  sub: string
  riskScore: number
  flaggedCategories: string[]
  agentHits: number
}

// ── Derived case list ────────────────────────────────────────────────────────────

const ALL_CASES: CaseEntry[] = [
  ...CORRIDOR_CASES.map(c => ({
    id: c.id, entityType: 'cardholder' as const,
    label: c.corridorLabel,
    sub: `${c.stops.length} stops · ${Math.max(...c.stops.map(s => s.day))} days`,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
    agentHits: AGENT_FINDINGS.filter(f => f.caseId === c.id && f.verdict === 'FLAGGED').length,
  })),
  ...FRONT_BUSINESS_CASES.map(c => ({
    id: c.id, entityType: 'merchant' as const,
    label: c.merchantName,
    sub: `${c.city}, ${c.state} · MCC ${c.mcc}`,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
    agentHits: AGENT_FINDINGS.filter(f => f.caseId === c.id && f.verdict === 'FLAGGED').length,
  })),
  ...CONTROLLER_CASES.map(c => ({
    id: c.id, entityType: 'cluster' as const,
    label: `${c.accounts.length}-Account Cluster`,
    sub: `$${c.totalCashOut.toLocaleString()} cash-out · ${c.daySpan} days`,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
    agentHits: AGENT_FINDINGS.filter(f => f.caseId === c.id && f.verdict === 'FLAGGED').length,
  })),
]

// ── MCC constants (for corridor timeline) ────────────────────────────────────────

const MCC_DOT: Record<string, string> = {
  '7011': 'bg-rose-500', '4121': 'bg-amber-500',
  '6540': 'bg-purple-500', '6010': 'bg-red-600',
  '7297': 'bg-pink-500', '7299': 'bg-pink-500',
  '5912': 'bg-emerald-500', '5411': 'bg-green-500', '5999': 'bg-teal-500',
}
const MCC_PILL: Record<string, string> = {
  '7011': 'bg-rose-100 text-rose-700', '4121': 'bg-amber-100 text-amber-700',
  '6540': 'bg-purple-100 text-purple-700', '6010': 'bg-red-100 text-red-700',
  '7297': 'bg-pink-100 text-pink-700', '7299': 'bg-pink-100 text-pink-700',
  '5912': 'bg-emerald-100 text-emerald-700', '5411': 'bg-green-100 text-green-700', '5999': 'bg-teal-100 text-teal-700',
}

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
function pct(n: number) { return `${(n * 100).toFixed(0)}%` }

function dayToDate(startDate: string, day: number): string {
  const d = new Date(startDate)
  d.setDate(d.getDate() + (day - 1))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Artifact renderers ────────────────────────────────────────────────────────────

function ArtifactTable({ artifact }: { artifact: TableArtifact }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="text-xs font-semibold text-slate-800">{artifact.title}</div>
        {artifact.subtitle && <div className="text-[9px] text-slate-500 mt-0.5">{artifact.subtitle}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {artifact.columns.map((col, i) => (
                <th key={i} className={`px-3 py-2 font-semibold text-slate-500 whitespace-nowrap ${col.right ? 'text-right' : 'text-left'}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {artifact.rows.map((row, ri) => (
              <tr key={ri} className={`border-b border-slate-100 last:border-0 ${row.flagged ? 'bg-red-50' : row.muted ? 'bg-slate-50/40' : ''}`}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={[
                    'px-3 py-2 leading-snug whitespace-nowrap',
                    artifact.columns[ci]?.right ? 'text-right' : '',
                    artifact.columns[ci]?.mono ? 'font-mono' : '',
                    row.flagged ? 'text-red-800' : row.muted ? 'text-slate-400' : 'text-slate-700',
                  ].join(' ')}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {artifact.note && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 text-[9px] text-amber-800 leading-snug">{artifact.note}</div>
      )}
    </div>
  )
}

function ArtifactMetricGrid({ artifact }: { artifact: MetricGridArtifact }) {
  const cols = artifact.cols ?? 2
  const gridCls = cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="text-xs font-semibold text-slate-800">{artifact.title}</div>
      </div>
      <div className={`grid ${gridCls} gap-2.5 p-3`}>
        {artifact.metrics.map((m, i) => (
          <div key={i} className={`rounded-lg p-2.5 border ${m.flagged ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className="text-[8px] text-slate-500 font-medium mb-1 leading-tight">{m.label}</div>
            <div className={`text-sm font-bold leading-none ${m.flagged ? 'text-red-700' : 'text-slate-900'}`}>{m.value}</div>
            {m.peer && <div className="text-[8px] text-slate-400 mt-1 leading-tight">{m.peer}</div>}
            {m.delta && <div className={`text-[8px] font-semibold mt-0.5 leading-tight ${m.flagged ? 'text-red-600' : 'text-indigo-600'}`}>{m.delta}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ArtifactIntelList({ artifact }: { artifact: IntelListArtifact }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="text-xs font-semibold text-slate-800">{artifact.title}</div>
      </div>
      <div className="p-3 space-y-2">
        {artifact.items.map((item, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${item.flagged ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.flagged ? 'bg-red-500' : 'bg-indigo-400'}`} />
            <div className="min-w-0">
              <div className={`text-[10px] font-medium leading-snug ${item.flagged ? 'text-red-800' : 'text-slate-700'}`}>{item.text}</div>
              {item.detail && <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">{item.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArtifactChecklist({ artifact }: { artifact: ChecklistArtifact }) {
  const triggered = artifact.items.filter(i => i.triggered).length
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-800">{artifact.title}</div>
          {artifact.subtitle && <div className="text-[9px] text-slate-500 mt-0.5">{artifact.subtitle}</div>}
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${triggered >= 6 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {triggered}/{artifact.items.length} triggered
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        {artifact.items.map((item, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${item.triggered ? 'bg-red-50' : 'bg-slate-50'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.triggered ? 'bg-red-500' : 'bg-emerald-500'}`}>
              {item.triggered
                ? <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-medium leading-snug ${item.triggered ? 'text-red-800' : 'text-slate-600'}`}>{item.label}</div>
              <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderArtifact(artifact: Artifact, key: number) {
  switch (artifact.type) {
    case 'table': return <ArtifactTable key={key} artifact={artifact} />
    case 'metric-grid': return <ArtifactMetricGrid key={key} artifact={artifact} />
    case 'intel-list': return <ArtifactIntelList key={key} artifact={artifact} />
    case 'checklist': return <ArtifactChecklist key={key} artifact={artifact} />
  }
}

// ── CityTimeline ─────────────────────────────────────────────────────────────────

function CityTimeline({ c }: { c: CorridorCase }) {
  const cities = Array.from(new Set(c.stops.map(s => s.city)))
  const maxDay = Math.max(...c.stops.map(s => s.day))
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)
  const stopMap = new Map<string, typeof c.stops[0]>()
  c.stops.forEach(s => stopMap.set(`${s.city}-${s.day}`, s))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex">
          <div className="w-28 shrink-0" />
          {days.map(d => (
            <div key={d} className="w-12 text-center text-[9px] text-slate-400 font-medium pb-1.5">{dayToDate(c.corridorStartDate, d)}</div>
          ))}
        </div>
        {cities.map((city, cityIdx) => (
          <div key={city} className="flex items-center mb-1.5">
            <div className="w-28 shrink-0 text-[10px] font-medium text-slate-600 pr-2 truncate">{city}</div>
            {days.map(d => {
              const stop = stopMap.get(`${city}-${d}`)
              if (!stop) return (
                <div key={d} className="w-12 h-9 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                </div>
              )
              const dom = stop.transactions[0]
              const tipPos = cityIdx < 2
                ? 'top-full mt-2'
                : 'bottom-full mb-2'
              return (
                <div key={d} className="w-12 h-9 flex items-center justify-center relative group">
                  <div className={`w-7 h-7 rounded-full ${MCC_DOT[dom.mcc] ?? 'bg-slate-400'} flex items-center justify-center shadow-sm ring-2 ring-white cursor-pointer`}>
                    <span className="text-white text-[8px] font-bold">{stop.transactions.length}</span>
                  </div>
                  <div className={`absolute ${tipPos} left-1/2 -translate-x-1/2 hidden group-hover:block z-20 w-52 bg-slate-900 text-white rounded-xl p-2.5 shadow-xl pointer-events-none`}>
                    <div className="text-[10px] font-semibold mb-1.5">{city} · {dayToDate(c.corridorStartDate, d)}</div>
                    {stop.transactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                        <span className={`px-1.5 rounded font-medium ${MCC_PILL[t.mcc] ?? 'bg-slate-700 text-white'}`}>{t.mccLabel}</span>
                        <span className="text-slate-300">${t.amount} · {t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div className="flex gap-3 mt-2 pt-2.5 border-t border-slate-100 flex-wrap">
          {([['7011', 'Hotel/Motel'], ['4121', 'Rideshare'], ['6540', 'Prepaid Reload'], ['6010', 'ATM Cash'], ['5912', 'Pharmacy'], ['5411', 'Grocery'], ['5999', 'Convenience']] as [string, string][])
            .filter(([mcc]) => c.stops.some(s => s.transactions.some(t => t.mcc === mcc)))
            .map(([mcc, label]) => (
              <span key={mcc} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${MCC_DOT[mcc]}`} />{label}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}

// ── HourChart ────────────────────────────────────────────────────────────────────

function HourChart({ data, nightPct }: { data: FrontBusinessCase['hourlyVolume']; nightPct: number }) {
  const nightHours = new Set([22, 23, 0, 1, 2, 3])
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">Transaction Volume by Hour</span>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">{pct(nightPct)} after 10 PM</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap={1}>
          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94A3B8' }} tickFormatter={h => h % 6 === 0 ? `${h}:00` : ''} />
          <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
          <Tooltip
            formatter={(val, name) => [fmt$(val as number), name === 'volume' ? 'This merchant' : 'Peer avg']}
            labelFormatter={h => `${h}:00`}
            contentStyle={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 8 }}
          />
          <ReferenceLine x={22} stroke="#E11D48" strokeDasharray="3 3" strokeWidth={1.5}
            label={{ value: '10 PM', fontSize: 9, fill: '#E11D48', position: 'insideTop' }} />
          <Bar dataKey="peerAvg" name="peerAvg" fill="#E2E8F0" radius={[2, 2, 0, 0]} />
          <Bar dataKey="volume" name="volume" radius={[2, 2, 0, 0]}>
            {data.map(entry => <Cell key={entry.hour} fill={nightHours.has(entry.hour) ? '#E11D48' : '#6366F1'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" /> This merchant</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> After 10 PM</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-slate-200 inline-block" /> Peer avg</span>
      </div>
    </div>
  )
}

// ── ReactFlow nodes (Cluster cases) ──────────────────────────────────────────────

function ClusterNode({ data }: { data: { ip: string; fp: string } }) {
  return (
    <div className="bg-red-700 text-white rounded-xl px-4 py-3 shadow-lg border-2 border-red-400 min-w-[180px]">
      <Handle type="source" position={Position.Right} className="!bg-red-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-red-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-400 !border-0 !w-2 !h-2" />
      <div className="text-[9px] font-bold opacity-70 uppercase tracking-wider mb-1">Cluster Node</div>
      <div className="font-mono text-[10px] font-semibold">{data.fp}</div>
      <div className="font-mono text-[10px] opacity-70 mt-0.5">{data.ip}</div>
    </div>
  )
}

function AccountNode({ data }: { data: { id: string; name: string; institution: string; cashOut: number; signals: string[]; daysOld: number } }) {
  const isCapOne = data.institution === 'capone'
  const isExternal = data.institution === 'external'
  const border = isCapOne ? 'border-indigo-300' : isExternal ? 'border-slate-300' : 'border-violet-300'
  const header = isCapOne ? 'bg-indigo-600' : isExternal ? 'bg-slate-500' : 'bg-violet-600'
  const label = isCapOne ? 'Capital One' : isExternal ? 'Other Issuer' : 'Discover'
  return (
    <div className={`bg-white rounded-lg border-2 ${border} shadow-sm min-w-[160px]`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !border-0 !w-2 !h-2" />
      <div className={`${header} text-white text-[9px] font-bold px-2 py-1 rounded-t-md`}>{label}</div>
      <div className="px-2 py-2">
        <div className="font-mono text-[10px] font-semibold text-slate-700">{data.id}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{data.name}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-rose-600 font-semibold">${data.cashOut.toLocaleString()} out</span>
          {data.daysOld > 0 && <span className="text-[9px] text-slate-400">{data.daysOld}d old</span>}
        </div>
        <div className="flex flex-wrap gap-0.5 mt-1">
          {data.signals.map(s => <span key={s} className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded">{s.replace('_', ' ')}</span>)}
        </div>
      </div>
    </div>
  )
}

function MerchantFlowNode({ data }: { data: { name: string; mccLabel: string; count: number; window: string } }) {
  return (
    <div className="bg-slate-800 text-white rounded-lg px-3 py-2 shadow-sm min-w-[150px]">
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !border-0 !w-2 !h-2" />
      <div className="text-[9px] font-bold text-slate-400 mb-0.5">Shared Merchant</div>
      <div className="text-[11px] font-semibold">{data.name}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{data.mccLabel}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-amber-400">{data.count} cards hit</span>
        <span className="text-[9px] text-slate-500">{data.window}</span>
      </div>
    </div>
  )
}

const CLUSTER_NODE_TYPES = { controller: ClusterNode, account: AccountNode, merchant: MerchantFlowNode }

function buildClusterGraph(c: ControllerCase): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  nodes.push({ id: 'ctrl', type: 'controller', position: { x: 320, y: 280 }, data: { ip: c.controllerIp, fp: c.controllerFingerprint.slice(0, 18) + '…' } })
  const capOne = c.accounts.filter(a => a.institution === 'capone')
  const discover = c.accounts.filter(a => a.institution === 'discover')
  const allAccounts = [...capOne, ...discover, ...c.accounts.filter(a => !['capone', 'discover'].includes(a.institution))]
  const angleStep = (2 * Math.PI) / allAccounts.length
  allAccounts.forEach((acc, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    const inst = capOne.includes(acc) ? 'capone' : discover.includes(acc) ? 'discover' : 'external'
    nodes.push({ id: acc.id, type: 'account', position: { x: 380 + 260 * Math.cos(angle) - 80, y: 320 + 260 * Math.sin(angle) - 40 }, data: { id: acc.id, name: acc.holderName, institution: inst, cashOut: acc.cashOutTotal, signals: acc.sharedSignals, daysOld: acc.openedDaysAgo } })
    const edgeColor = inst === 'capone' ? '#6366F1' : inst === 'discover' ? '#8B5CF6' : '#94A3B8'
    const hasDevice = acc.sharedSignals.some(s => ['device_fingerprint', 'ip_address', 'terminal_ip'].includes(s))
    edges.push({ id: `ctrl-${acc.id}`, source: 'ctrl', target: acc.id, animated: hasDevice, style: { stroke: edgeColor, strokeWidth: hasDevice ? 2 : 1.5, strokeDasharray: hasDevice ? undefined : '4 3' }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 10, height: 10 }, label: hasDevice ? 'device/IP' : 'co-occurrence', labelStyle: { fontSize: 8, fill: '#94A3B8' }, labelBgStyle: { fill: 'white', fillOpacity: 0.8 } })
  })
  c.sharedMerchants.forEach((m, i) => {
    nodes.push({ id: m.merchantId, type: 'merchant', position: { x: 120 + i * 240, y: 700 }, data: { name: m.merchantName, mccLabel: m.mccLabel, count: m.transactionCount, window: m.timeWindow } })
    allAccounts.forEach(acc => {
      edges.push({ id: `${acc.id}-${m.merchantId}`, source: acc.id, target: m.merchantId, style: { stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '3 3' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B', width: 8, height: 8 } })
    })
  })
  return { nodes, edges }
}

// ── Shared center-panel sections ──────────────────────────────────────────────────

function MetricCard({ label, value, peer, multiplier, anomaly }: { label: string; value: string; peer: string; multiplier?: string; anomaly?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${anomaly ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="text-[9px] text-slate-500 font-medium mb-1">{label}</div>
      <div className="flex items-end gap-1.5">
        <div className={`text-lg font-bold leading-none ${anomaly ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
        {multiplier && <span className={`text-[9px] font-bold rounded px-1 py-0.5 leading-none mb-0.5 ${anomaly ? 'bg-red-200 text-red-700' : 'bg-slate-200 text-slate-600'}`}>{multiplier}</span>}
      </div>
      <div className="text-[8px] text-slate-400 mt-1.5">peer {peer}</div>
    </div>
  )
}

function AgentSignalGrid({ findings }: { findings: AgentFinding[] }) {
  if (!findings.length) return null
  const [modalAgentId, setModalAgentId] = useState<string | null>(null)
  const modalFinding = modalAgentId ? findings.find(f => f.agentId === modalAgentId) ?? null : null
  const modalAgent = modalAgentId ? AGENTS.find(a => a.id === modalAgentId) ?? null : null
  const flagCount = findings.filter(f => f.verdict === 'FLAGGED').length

  return (
    <div className="space-y-3">
      {modalFinding && modalAgent && (
        <AgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModalAgentId(null)} />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Why This Was Flagged</span>
        <span className="text-[8px] text-slate-400">{flagCount} agent{flagCount !== 1 ? 's' : ''} flagged · click a card for full intel</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {findings.map(f => {
          const agent = AGENTS.find(a => a.id === f.agentId)!
          const isFlagged = f.verdict === 'FLAGGED'
          const triggeredSteps = f.steps.filter(s => s.triggered)
          const hasArtifacts = f.artifacts && f.artifacts.length > 0
          const accentBorder = isFlagged ? 'border-l-red-400' : 'border-l-amber-400'
          const hoverRing = isFlagged ? 'hover:border-red-300 hover:shadow-red-50/60' : 'hover:border-amber-300 hover:shadow-amber-50/60'

          return (
            <button
              key={f.agentId}
              onClick={() => setModalAgentId(f.agentId)}
              className={`text-left bg-white border border-slate-200 border-l-4 ${accentBorder} rounded-xl p-4 hover:shadow-lg ${hoverRing} transition-all duration-150 group`}
            >
              {/* Header row */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-[8px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{agent.htRule}</span>
                <span className="text-[11px] font-bold text-slate-800 flex-1 leading-tight">{agent.name}</span>
                <VerdictChip verdict={f.verdict} />
              </div>

              {/* Confidence bar */}
              <div className="flex items-center gap-2 mb-3.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isFlagged ? 'bg-red-500' : 'bg-amber-400'}`}
                    style={{ width: `${f.confidence}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold font-mono tabular-nums shrink-0 ${isFlagged ? 'text-red-600' : 'text-amber-600'}`}>{f.confidence}%</span>
              </div>

              {/* Triggered checks */}
              <div className="space-y-1.5 mb-3">
                {triggeredSteps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[4px] ${isFlagged ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-slate-600 leading-tight">{step.text}</span>
                      {step.metric && (
                        <span className={`ml-1 text-[9px] font-bold font-mono ${isFlagged ? 'text-red-600' : 'text-amber-600'}`}>&nbsp;{step.metric}</span>
                      )}
                      {step.threshold && (
                        <span className="ml-1 text-[8px] text-slate-400 font-mono">/ {step.threshold}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Finding snippet */}
              <p className="text-[9px] text-slate-500 leading-snug line-clamp-2 italic mb-3">{f.finding}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                {hasArtifacts
                  ? <span className="text-[8px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">{f.artifacts!.length} evidence tables</span>
                  : <span />}
                <span className="text-[8px] font-semibold text-indigo-500 group-hover:text-indigo-700 transition-colors">
                  View evidence →
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FinCENPanel({ categories }: { categories: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">FinCEN Advisory Triggers</span>
        <span className="ml-auto text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{categories.length} matched</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(id => {
          const cat = FINCEN_CATEGORIES[id]
          return (
            <a key={id} href={cat?.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 transition-colors">
              <span className="text-[8px] font-bold text-amber-600 font-mono shrink-0 mt-0.5">{id} ↗</span>
              <span className="text-[9px] text-amber-800 font-medium leading-tight">{cat?.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function StrategistVerdict({ f }: { f: AgentFinding }) {
  return (
    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <PulseDot color="bg-red-500" />
        <span className="text-sm font-bold text-slate-900">Case Strategist Verdict</span>
        <span className="ml-auto text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">{f.verdict}</span>
      </div>
      <p className="text-[11px] text-slate-700 leading-relaxed mb-2.5">{f.finding}</p>
      <ConfidenceBar value={f.confidence} />
    </div>
  )
}

// ── MCC spend breakdown (cardholder) ─────────────────────────────────────────────

function MccBreakdown({ c }: { c: CorridorCase }) {
  const counts: Record<string, { label: string; count: number }> = {}
  c.stops.forEach(stop => stop.transactions.forEach(t => {
    if (!counts[t.mcc]) counts[t.mcc] = { label: t.mccLabel, count: 0 }
    counts[t.mcc].count++
  }))
  const total = Object.values(counts).reduce((s, v) => s + v.count, 0)
  const breakdown = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([mcc, { label, count }]) => ({ mcc, label, count, pct: count / total }))

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction Mix</div>
      <div className="flex h-3 rounded-full overflow-hidden gap-px mb-2">
        {breakdown.map(b => (
          <div key={b.mcc} className={MCC_DOT[b.mcc] ?? 'bg-slate-400'} style={{ width: `${b.pct * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {breakdown.map(b => (
          <span key={b.mcc} className="flex items-center gap-1.5 text-[9px] text-slate-600">
            <span className={`w-2 h-2 rounded-sm ${MCC_DOT[b.mcc] ?? 'bg-slate-400'} inline-block shrink-0`} />
            {b.label}
            <span className="font-bold text-slate-800">{(b.pct * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Account Context Banner ────────────────────────────────────────────────────────

function AccountContextBanner({ c }: { c: CorridorCase }) {
  const ctx: AccountContext = c.accountContext
  const flaggedCashPct = (() => {
    const total = c.stops.reduce((s, stop) => s + stop.transactions.reduce((ss, t) => ss + t.amount, 0), 0)
    const cash = c.stops.reduce((s, stop) => s + stop.transactions.filter(t => ['6010', '6540'].includes(t.mcc)).reduce((ss, t) => ss + t.amount, 0), 0)
    return total > 0 ? cash / total : 0
  })()
  const isNewAccount = ctx.cardAge.includes('day')

  return (
    <div className={`rounded-xl p-4 border ${isNewAccount ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isNewAccount ? 'text-red-600' : 'text-indigo-600'}`}>Account Profile</span>
        <span className={`font-mono text-[9px] ${isNewAccount ? 'text-red-400' : 'text-indigo-400'}`}>{c.cardholderIdA}</span>
        {isNewAccount && <span className="ml-auto text-[8px] font-bold bg-red-200 text-red-700 px-2 py-0.5 rounded-full">⚠ New Account</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Card Type', value: ctx.cardType, highlight: false },
          { label: 'Account Age', value: ctx.cardAge, highlight: isNewAccount },
          { label: 'Credit Limit', value: fmt$(ctx.creditLimit), highlight: false },
          { label: 'Avg Monthly Spend', value: ctx.avgMonthlySpend > 0 ? fmt$(ctx.avgMonthlySpend) : 'No history', highlight: ctx.avgMonthlySpend === 0 },
          { label: 'Avg Monthly Txns', value: ctx.avgMonthlyTxns > 0 ? `${ctx.avgMonthlyTxns} / mo` : 'No history', highlight: ctx.avgMonthlyTxns === 0 },
          { label: 'Account Status', value: ctx.accountStatus, highlight: ctx.accountStatus !== 'Good Standing' },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-white rounded-lg p-2.5">
            <div className="text-[8px] text-slate-400 font-medium">{label}</div>
            <div className={`text-[10px] font-semibold mt-0.5 leading-tight ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value}</div>
          </div>
        ))}
      </div>
      {ctx.typicalMccs.length > 0 && (
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[8px] text-slate-500 font-medium shrink-0">Typical spend:</span>
          <div className="flex flex-wrap gap-1">
            {ctx.typicalMccs.map(m => (
              <span key={m} className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{m}</span>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg p-2.5 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-[8px] text-slate-400 font-medium mb-1.5">Baseline Cash Activity</div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-0.5">
            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(ctx.baselineCashPct * 100, 100)}%` }} />
          </div>
          <div className="text-[8px] text-slate-500">{ctx.baselineCashPct > 0 ? `${(ctx.baselineCashPct * 100).toFixed(0)}% of typical spend` : 'No baseline — new account'}</div>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div className="flex-1">
          <div className="text-[8px] text-slate-400 font-medium mb-1.5">Flagged Period Cash Activity</div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-0.5">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(flaggedCashPct * 100, 100)}%` }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[8px] text-red-700 font-semibold">{(flaggedCashPct * 100).toFixed(0)}% of corridor spend</div>
            {ctx.baselineCashPct > 0 && flaggedCashPct > ctx.baselineCashPct && (
              <span className="text-[7px] bg-red-100 text-red-600 px-1 rounded font-bold">{(flaggedCashPct / ctx.baselineCashPct).toFixed(0)}× baseline</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cardholder detail ─────────────────────────────────────────────────────────────

function CardholderDetail({ c, findings, strategist }: { c: CorridorCase; findings: AgentFinding[]; strategist?: AgentFinding }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">Cardholder · Corridor</span>
              <span className="font-mono text-[9px] text-slate-500">{c.id}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{c.corridorLabel} Corridor</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{c.cardholderIdA}{c.cardholderIdB ? ` · ${c.cardholderIdB}` : ''}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 mb-0.5">Risk Score</div>
            <div className={`text-3xl font-bold font-mono ${c.riskScore >= 90 ? 'text-red-600' : 'text-orange-500'}`}>{c.riskScore}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {c.flaggedCategories.map(id => {
            const cat = FINCEN_CATEGORIES[id]
            return (
              <a key={id} href={cat?.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono hover:bg-amber-100 transition-colors">
                {id} ↗
              </a>
            )
          })}
        </div>
      </div>

      <AccountContextBanner c={c} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Corridor Movement</h3>
          <div className="flex items-center gap-3 text-[9px] text-slate-400">
            <span>{c.stops.length} stops</span>
            <span>{Math.max(...c.stops.map(s => s.day))} days</span>
            <span>Origin: {c.homeCityState}</span>
          </div>
        </div>
        <CityTimeline c={c} />
        <MccBreakdown c={c} />
      </div>

      <AgentSignalGrid findings={findings} />
      <FinCENPanel categories={c.flaggedCategories} />
      {strategist && <StrategistVerdict f={strategist} />}
    </div>
  )
}

// ── Merchant detail ───────────────────────────────────────────────────────────────

function MerchantDetail({ c, findings, strategist }: { c: FrontBusinessCase; findings: AgentFinding[]; strategist?: AgentFinding }) {
  const volMultiplier = c.peerMonthlyVolume > 0 ? `${(c.monthlyVolume / c.peerMonthlyVolume).toFixed(1)}×` : undefined
  const cnpMultiplier = `${(c.cnpPct * 100).toFixed(0)}% vs 30%`
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider">Merchant · Front Business</span>
              <span className="font-mono text-[9px] text-slate-500">{c.id}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{c.merchantName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.merchantId} · {c.legalEntityName} · {c.city}, {c.state}</div>
            <div className="text-xs text-slate-400 mt-0.5">Declared: {c.declaredBusiness} · MCC {c.mcc} ({c.mccLabel})</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 mb-0.5">Risk Score</div>
            <div className={`text-3xl font-bold font-mono ${c.riskScore >= 90 ? 'text-red-600' : 'text-orange-500'}`}>{c.riskScore}</div>
            {c.commercialCounterpartyId && (
              <div className="mt-1.5 text-[9px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                Credit exposure: {fmt$(c.commercialExposure ?? 0)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MetricCard label="Monthly Volume" value={fmt$(c.monthlyVolume)} peer={fmt$(c.peerMonthlyVolume)} multiplier={volMultiplier} anomaly={c.monthlyVolume > c.peerMonthlyVolume * 2.5} />
          <MetricCard label="Avg Ticket" value={`$${c.avgTicket}`} peer={`$${c.peerAvgTicket}`} />
          <MetricCard label="Chargeback Rate" value={c.chargebackRate === 0 ? '0.00%' : pct(c.chargebackRate)} peer={pct(c.peerChargebackRate)} multiplier={c.chargebackRate < 0.002 ? '⚠ zero' : undefined} anomaly={c.chargebackRate < 0.002} />
          <MetricCard label="Card-Not-Present" value={pct(c.cnpPct)} peer="~30%" multiplier={cnpMultiplier} anomaly={c.cnpPct > 0.7} />
        </div>
        <HourChart data={c.hourlyVolume} nightPct={c.nightPct} />
      </div>

      <AgentSignalGrid findings={findings} />
      <FinCENPanel categories={c.flaggedCategories} />
      {strategist && <StrategistVerdict f={strategist} />}
    </div>
  )
}

// ── Cluster detail ────────────────────────────────────────────────────────────────

function ClusterDetail({ c, findings, strategist }: { c: ControllerCase; findings: AgentFinding[]; strategist?: AgentFinding }) {
  const { nodes, edges } = useMemo(() => buildClusterGraph(c), [c])
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">Cluster · Account Network</span>
              <span className="font-mono text-[9px] text-slate-500">{c.id}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{c.accounts.length}-Account Controlled Cluster</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{c.controllerFingerprint}</div>
            <div className="text-xs text-slate-400 mt-0.5">IP: {c.controllerIp} · {c.daySpan} days active</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 mb-0.5">Risk Score</div>
            <div className="text-3xl font-bold font-mono text-red-600">{c.riskScore}</div>
            <div className="text-[10px] font-semibold text-rose-600 mt-1">${c.totalCashOut.toLocaleString()} cash-out</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="bg-red-50 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-red-700">{c.accounts.length}</div>
            <div className="text-[9px] text-red-600 font-medium">Accounts</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-amber-700">{c.sharedMerchants.length}</div>
            <div className="text-[9px] text-amber-600 font-medium">Shared Merchants</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-white">${c.totalCashOut.toLocaleString()}</div>
            <div className="text-[9px] text-slate-400 font-medium">Total Cash-Out</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: 500 }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold text-slate-700">Account Network Graph</span>
          <div className="flex gap-3 text-[9px]">
            <span className="flex items-center gap-1 text-slate-400"><span className="inline-block w-3 h-0.5 bg-indigo-500 mr-0.5" /> Capital One</span>
            <span className="flex items-center gap-1 text-slate-400"><span className="inline-block w-3 h-0.5 bg-violet-500 mr-0.5" /> Discover</span>
            <span className="flex items-center gap-1 text-slate-400"><span className="inline-block w-3 h-0.5 bg-slate-400 mr-0.5" /> Other</span>
          </div>
        </div>
        <div style={{ height: 460 }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={CLUSTER_NODE_TYPES} fitView fitViewOptions={{ padding: 0.1 }} minZoom={0.3} maxZoom={1.5} proOptions={{ hideAttribution: true }}>
            <Background color="#f1f5f9" gap={20} size={1} />
            <Controls className="!bg-white !border-slate-200" />
          </ReactFlow>
        </div>
      </div>

      {c.sharedMerchants.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">Shared Merchant Activity</div>
          <div className="divide-y divide-slate-100">
            {c.sharedMerchants.map(m => (
              <div key={m.merchantId} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">{m.merchantName}</div>
                  <div className="text-[9px] text-slate-400">{m.mccLabel} · {m.merchantId}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-amber-600">{m.transactionCount} cards hit</div>
                  <div className="text-[9px] text-slate-400">{m.timeWindow}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AgentSignalGrid findings={findings} />
      <FinCENPanel categories={c.flaggedCategories} />
      {strategist && <StrategistVerdict f={strategist} />}
    </div>
  )
}

// ── Center panel dispatcher ───────────────────────────────────────────────────────

function CenterPanel({ caseId }: { caseId: string | null }) {
  if (!caseId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-1">Select a case to investigate</div>
        <div className="text-[10px] text-slate-400 max-w-52 leading-relaxed">
          Choose a case from the registry to view evidence, visualizations, and agent reasoning.
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-xs">
          {[
            { label: 'Cardholders', count: CORRIDOR_CASES.length, cls: 'bg-indigo-100 text-indigo-700' },
            { label: 'Merchants', count: FRONT_BUSINESS_CASES.length, cls: 'bg-violet-100 text-violet-700' },
            { label: 'Clusters', count: CONTROLLER_CASES.length, cls: 'bg-red-100 text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className={`text-lg font-bold ${s.cls} rounded-lg w-8 h-8 flex items-center justify-center mx-auto mb-1`}>{s.count}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const entry = ALL_CASES.find(c => c.id === caseId)!
  const findings = findingsForCase(caseId).filter(f => f.agentId !== 'strategist')
  const strategist = findingsForCase(caseId).find(f => f.agentId === 'strategist')

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50 px-4 py-4">
      {entry.entityType === 'cardholder' && (() => {
        const c = CORRIDOR_CASES.find(x => x.id === caseId)!
        return <CardholderDetail c={c} findings={findings} strategist={strategist} />
      })()}
      {entry.entityType === 'merchant' && (() => {
        const c = FRONT_BUSINESS_CASES.find(x => x.id === caseId)!
        return <MerchantDetail c={c} findings={findings} strategist={strategist} />
      })()}
      {entry.entityType === 'cluster' && (() => {
        const c = CONTROLLER_CASES.find(x => x.id === caseId)!
        return <ClusterDetail c={c} findings={findings} strategist={strategist} />
      })()}
    </div>
  )
}

// ── Left panel: Case Registry ─────────────────────────────────────────────────────

const ENTITY_GROUPS: { type: EntityType; label: string; icon: string }[] = [
  { type: 'cardholder', label: 'Cardholders', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { type: 'merchant', label: 'Merchants', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { type: 'cluster', label: 'Clusters', icon: 'M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M12 5l-7 14 M12 5l7 14' },
]

function CaseRegistry({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const totalFlags = AGENT_FINDINGS.filter(f => f.verdict === 'FLAGGED').length
  return (
    <div className="w-[248px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-red-500" />
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Case Registry</span>
        </div>
        <div className="text-[8px] text-slate-400">{ALL_CASES.length} active cases · {totalFlags} agent flags</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {ENTITY_GROUPS.map(group => {
          const cases = ALL_CASES.filter(c => c.entityType === group.type)
          if (!cases.length) return null
          return (
            <div key={group.type} className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={group.icon} />
                </svg>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</span>
                <span className="ml-auto text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">{cases.length}</span>
              </div>
              <div className="px-2 space-y-1">
                {cases.map(c => {
                  const sel = selectedId === c.id
                  return (
                    <button key={c.id} onClick={() => onSelect(c.id)}
                      className={`w-full text-left rounded-lg p-2.5 transition-all border ${sel ? 'bg-indigo-600 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-mono text-[9px] font-bold ${sel ? 'text-indigo-200' : 'text-slate-500'}`}>{c.id}</span>
                        <RiskBadge score={c.riskScore} />
                      </div>
                      <div className={`text-[10px] font-semibold leading-tight mb-1 ${sel ? 'text-white' : 'text-slate-800'}`}>{c.label}</div>
                      <div className={`text-[9px] ${sel ? 'text-indigo-200' : 'text-slate-500'}`}>{c.sub}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${sel ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                          {c.agentHits} flagged
                        </span>
                        <div className="flex gap-0.5 flex-wrap">
                          {c.flaggedCategories.slice(0, 2).map(id => (
                            <span key={id} className={`text-[7px] font-bold px-1 py-0.5 rounded font-mono ${sel ? 'bg-indigo-700 text-indigo-200' : 'bg-amber-50 text-amber-700'}`}>{id}</span>
                          ))}
                          {c.flaggedCategories.length > 2 && (
                            <span className={`text-[7px] px-1 py-0.5 rounded ${sel ? 'bg-indigo-700 text-indigo-300' : 'bg-slate-100 text-slate-500'}`}>+{c.flaggedCategories.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
        <div className="text-[8px] text-slate-400">Last scan: 2024-11-15 00:31 UTC</div>
      </div>
    </div>
  )
}

// ── Right panel: Agent Activity ───────────────────────────────────────────────────

function AgentDetailModal({ agent, finding, onClose }: { agent: AgentDef; finding: AgentFinding; onClose: () => void }) {
  const hasArtifacts = finding.artifacts && finding.artifacts.length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl w-full ${hasArtifacts ? 'max-w-3xl' : 'max-w-lg'} border border-slate-200 shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-bold font-mono text-indigo-600">{agent.htRule}</span>
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

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
          {/* Chain-of-Thought Steps */}
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Analysis Steps</div>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <span>Check</span><span>Observed</span><span>Threshold</span><span>Result</span>
              </div>
              {finding.steps.map((step, i) => (
                <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2.5 border-b border-slate-100 last:border-0 ${step.triggered ? 'bg-red-50' : ''}`}>
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

          {/* Artifacts */}
          {hasArtifacts && (
            <div className="space-y-4">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Supporting Evidence</div>
              {finding.artifacts!.map((a, i) => renderArtifact(a, i))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Finding</div>
          <p className="text-[10px] text-slate-700 leading-relaxed mb-3">{finding.finding}</p>
          <ConfidenceBar value={finding.confidence} />
        </div>
      </div>
    </div>
  )
}

function AgentScanningPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agent Activity</span>
        </div>
        <div className="text-[8px] text-slate-400">7 agents scanning continuously</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {AGENTS.map(agent => {
          const hits = AGENT_FINDINGS.filter(f => f.agentId === agent.id && f.verdict === 'FLAGGED').length
          return (
            <div key={agent.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <PulseDot color={hits > 0 ? 'bg-emerald-500' : 'bg-slate-300'} />
                <span className="text-[9px] font-semibold text-slate-700 flex-1 truncate">{agent.name}</span>
                {hits > 0 && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{hits} hit{hits > 1 ? 's' : ''}</span>}
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[7px] font-bold text-indigo-600 font-mono">{agent.htRule}</span>
                <span className="text-[7px] text-slate-300">·</span>
                <span className="text-[7px] text-slate-400">{agent.scanCount} {agent.scanLabel}</span>
              </div>
              <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: hits > 0 ? '100%' : '55%' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
        <div className="text-[8px] text-slate-400">Last full scan: 2024-11-15 00:31 UTC</div>
      </div>
    </div>
  )
}

function AgentCasePanel({ caseId }: { caseId: string }) {
  const allFindings = findingsForCase(caseId)
  const findings = allFindings.filter(f => f.agentId !== 'strategist')
  const strategist = allFindings.find(f => f.agentId === 'strategist')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal] = useState<string | null>(null)

  const modalFinding = modal ? allFindings.find(f => f.agentId === modal) : null
  const modalAgent = modal ? AGENTS.find(a => a.id === modal) : null

  function toggle(id: string) { setExpanded(prev => prev === id ? null : id) }

  function StepRow({ step }: { step: AgentFinding['steps'][number] }) {
    return (
      <div className="flex items-start gap-1.5">
        <span className={`shrink-0 mt-0.5 w-3 h-3 rounded-full flex items-center justify-center ${step.triggered ? 'bg-red-500' : 'bg-slate-300'}`}>
          {step.triggered
            ? <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </span>
        <div className="min-w-0">
          <div className="text-[8px] text-slate-600 leading-tight">{step.text}</div>
          {(step.metric || step.threshold) && (
            <div className="flex items-center gap-2 mt-0.5">
              {step.metric && <span className={`text-[8px] font-mono font-semibold ${step.triggered ? 'text-red-600' : 'text-slate-500'}`}>{step.metric}</span>}
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
        <AgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModal(null)} />
      )}

      <div className="px-3 py-2.5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PulseDot color="bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agent Analysis</span>
        </div>
        <div className="text-[8px] text-slate-400">{caseId} · click to expand · Full Analysis for deep intel</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {findings.map(f => {
          const agent = AGENTS.find(a => a.id === f.agentId)!
          const isOpen = expanded === f.agentId
          const hasArtifacts = f.artifacts && f.artifacts.length > 0
          return (
            <div key={f.agentId} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center gap-2 px-2.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
                onClick={() => toggle(f.agentId)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${f.verdict === 'FLAGGED' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <span className="text-[7px] font-bold font-mono text-indigo-600 w-7 shrink-0">{agent.htRule}</span>
                <span className="text-[9px] font-semibold text-slate-700 flex-1 truncate">{agent.name}</span>
                {hasArtifacts && <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-bold shrink-0">intel</span>}
                <VerdictChip verdict={f.verdict} />
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-2.5 pb-3 border-t border-slate-100">
                  <div className="space-y-2 mt-2.5">
                    {f.steps.map((step, i) => <StepRow key={i} step={step} />)}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <p className="text-[8px] text-slate-500 leading-snug italic mb-2.5">{f.finding}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ConfidenceBar value={f.confidence} /></div>
                      <button
                        onClick={() => setModal(f.agentId)}
                        className="shrink-0 text-[8px] font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                      >
                        Full Analysis →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {strategist && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center gap-2 px-2.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
              onClick={() => toggle('strategist')}
            >
              <PulseDot color="bg-red-500" />
              <span className="text-[9px] font-semibold text-slate-800 flex-1">Case Strategist</span>
              {strategist.artifacts && strategist.artifacts.length > 0 && (
                <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-bold shrink-0">intel</span>
              )}
              <VerdictChip verdict={strategist.verdict} />
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"
                className={`shrink-0 transition-transform duration-200 ${expanded === 'strategist' ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === 'strategist' && (
              <div className="px-2.5 pb-3 border-t border-slate-100">
                <div className="space-y-2 mt-2.5">
                  {strategist.steps.map((step, i) => <StepRow key={i} step={step} />)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <p className="text-[8px] text-red-700 leading-snug italic font-semibold mb-2.5">{strategist.finding}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><ConfidenceBar value={strategist.confidence} /></div>
                    <button
                      onClick={() => setModal('strategist')}
                      className="shrink-0 text-[8px] font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                    >
                      Full Analysis →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
        <div className="text-[8px] text-slate-400">Analysis completed · {caseId}</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────────

export default function DarkPatterns() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  function handleSelectCase(id: string) {
    setSelectedCaseId(null)
    requestAnimationFrame(() => setSelectedCaseId(id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <CaseRegistry selectedId={selectedCaseId} onSelect={handleSelectCase} />
      <CenterPanel key={selectedCaseId ?? 'empty'} caseId={selectedCaseId} />
      <div className="w-[270px] shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
        {selectedCaseId
          ? <AgentCasePanel key={selectedCaseId} caseId={selectedCaseId} />
          : <AgentScanningPanel />
        }
      </div>
    </div>
  )
}
