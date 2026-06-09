import { useState, useMemo, useEffect, Fragment } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ReactFlow, Background, Controls, MarkerType, Handle, Position, type Node, type Edge } from '@xyflow/react'
import {
  CORRIDOR_CASES, CONTROLLER_CASES, FRONT_BUSINESS_CASES, FINCEN_CATEGORIES,
  type CorridorCase, type FrontBusinessCase, type ControllerCase, type AccountContext,
} from '../../data/darkPatternsData'
import {
  AGENTS, AGENT_FINDINGS, findingsForCase,
  type AgentFinding, type AgentDef, type SarBrief,
  type Artifact, type TableArtifact, type MetricGridArtifact, type IntelListArtifact, type ChecklistArtifact,
} from '../../data/agentData'

// ── Types ───────────────────────────────────────────────────────────────────────

type InvPhase = 'idle' | 'detecting' | 'dispatching' | 'investigating' | 'synthesizing' | 'complete'
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
            {m.delta && <div className={`text-[8px] font-semibold mt-0.5 leading-tight ${m.flagged ? 'text-red-600' : 'text-blue-800'}`}>{m.delta}</div>}
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
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.flagged ? 'bg-red-500' : 'bg-blue-500'}`} />
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
        <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-blue-600 inline-block" /> This merchant</span>
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
  const border = isCapOne ? 'border-blue-300' : isExternal ? 'border-slate-300' : 'border-violet-300'
  const header = isCapOne ? 'bg-blue-800' : isExternal ? 'bg-slate-500' : 'bg-violet-600'
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

// ── Investigation Pipeline strip ──────────────────────────────────────────────────

function InvestigationPipeline({ caseId, invPhase, completedAgents }: {
  caseId: string; invPhase: InvPhase; completedAgents: string[]
}) {
  const nonStrat = findingsForCase(caseId).filter(f => f.agentId !== 'strategist')
  const doneCount = completedAgents.filter(id => id !== 'strategist').length
  const hasStrat  = completedAgents.includes('strategist')

  const stages = [
    { label: 'Rule Engine',             done: !['idle','detecting'].includes(invPhase),   active: invPhase === 'detecting' },
    { label: `${doneCount}/${nonStrat.length} Agents`, done: ['synthesizing','complete'].includes(invPhase), active: ['dispatching','investigating'].includes(invPhase) },
    { label: 'Strategist',              done: hasStrat,                                   active: invPhase === 'synthesizing' },
    { label: 'SAR Brief',               done: invPhase === 'complete',                    active: false },
  ]

  const statusText: Record<InvPhase, string> = {
    idle: '', detecting: 'Scanning 47,823 accounts…', dispatching: 'Dispatching agents…',
    investigating: `${doneCount} of ${nonStrat.length} agents complete`,
    synthesizing: 'Synthesizing findings…', complete: 'Investigation complete',
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-4">
      {stages.map((s, i) => (
        <Fragment key={i}>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all ${
            s.done   ? 'bg-emerald-100 text-emerald-700' :
            s.active ? 'bg-blue-100 text-blue-900' :
                       'bg-slate-100 text-slate-400'
          }`}>
            {s.done   && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            {s.active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block" />}
            {!s.done && !s.active && <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />}
            {s.label}
          </div>
          {i < stages.length - 1 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.done ? '#6EE7B7' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          )}
        </Fragment>
      ))}
      {invPhase !== 'idle' && (
        <span className={`ml-auto text-[8px] shrink-0 ${invPhase === 'complete' ? 'text-emerald-600 font-semibold' : 'text-slate-400 animate-pulse'}`}>
          {statusText[invPhase]}
        </span>
      )}
    </div>
  )
}

// ── Live Investigation Theater — step-by-step chain-of-thought reveal ───────────

function InvestigationLiveView({ caseId, invPhase, completedAgents, revealedAgentSteps }: {
  caseId: string
  invPhase: InvPhase
  completedAgents: string[]
  revealedAgentSteps: Record<string, number>
}) {
  const allFindings  = findingsForCase(caseId)
  const nonStrat     = allFindings.filter(f => f.agentId !== 'strategist')
  const stratF       = allFindings.find(f => f.agentId === 'strategist')
  const [modal, setModal] = useState<string | null>(null)
  const modalFinding = modal ? allFindings.find(f => f.agentId === modal) ?? null : null
  const modalAgent   = modal ? AGENTS.find(a => a.id === modal) ?? null : null
  const doneCount    = completedAgents.filter(id => id !== 'strategist').length
  const stratDone    = completedAgents.includes('strategist')

  if (invPhase === 'idle' || invPhase === 'complete') return null

  const statusMsg: Record<InvPhase, string> = {
    idle: '', detecting: 'Scanning 47,823 accounts…', dispatching: `Dispatching ${nonStrat.length} agents…`,
    investigating: `${doneCount} of ${nonStrat.length} complete`, synthesizing: 'Strategist synthesizing…', complete: '',
  }

  return (
    <>
      {modalFinding && modalAgent && (
        <AgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModal(null)} />
      )}

      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl">

        {/* Header bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <PulseDot color="bg-blue-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Investigation</span>
          <span className="font-mono text-[9px] text-slate-500 ml-0.5">{caseId}</span>
          <span className="ml-auto text-[9px] text-blue-300">{statusMsg[invPhase]}</span>
        </div>

        {/* Detecting / dispatching warm-up */}
        {['detecting', 'dispatching'].includes(invPhase) && (
          <div className="p-5 flex items-center gap-4">
            <div className="flex gap-1 items-end shrink-0">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-1.5 bg-blue-800 rounded-full animate-pulse"
                  style={{ height: `${10 + i * 6}px`, animationDelay: `${i * 0.14}s` }} />
              ))}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {invPhase === 'detecting' ? 'Rule engine scanning…' : 'Dispatching investigators…'}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {invPhase === 'detecting'
                  ? 'Evaluating FinCEN advisory indicators across full transaction history'
                  : `${nonStrat.length} specialist agents dispatched to investigate ${caseId}`}
              </div>
            </div>
          </div>
        )}

        {/* Step-by-step investigation log */}
        {['investigating', 'synthesizing'].includes(invPhase) && (
          <div className="p-3 space-y-2">

            {nonStrat.map(f => {
              const agent      = AGENTS.find(a => a.id === f.agentId)!
              const revealed   = revealedAgentSteps[f.agentId] ?? -1
              const complete   = completedAgents.includes(f.agentId)
              const active     = revealed >= 0 && !complete
              const isFlagged  = f.verdict === 'FLAGGED'

              /* Queued — not yet dispatched */
              if (revealed === -1) {
                return (
                  <div key={f.agentId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                    <span className="text-[8px] font-mono text-slate-600 shrink-0">{agent.htRule}</span>
                    <span className="text-[9px] text-slate-600 flex-1 truncate">{agent.name}</span>
                    <span className="text-[8px] text-slate-700 italic">Queued</span>
                  </div>
                )
              }

              /* Active or complete — show full step log */
              return (
                <div key={f.agentId} className={`rounded-xl border transition-all duration-500 overflow-hidden ${
                  complete
                    ? isFlagged ? 'border-red-700/60 bg-red-950/30' : 'border-amber-700/50 bg-amber-950/20'
                    : 'border-blue-900/40 bg-slate-800/60'
                }`}>

                  {/* Agent header */}
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b ${
                    complete
                      ? isFlagged ? 'border-red-800/40' : 'border-amber-800/30'
                      : 'border-slate-700/40'
                  }`}>
                    {complete
                      ? <div className={`w-2 h-2 rounded-full shrink-0 ${isFlagged ? 'bg-red-400' : 'bg-amber-400'}`} />
                      : <PulseDot color="bg-blue-500" />}
                    <span className="text-[8px] font-mono font-bold text-blue-500 shrink-0">{agent.htRule}</span>
                    <span className="text-[10px] font-bold text-slate-100 flex-1 truncate">{agent.name}</span>
                    {complete && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-black font-mono tabular-nums ${isFlagged ? 'text-red-400' : 'text-amber-400'}`}>
                          {f.confidence}%
                        </span>
                        <VerdictChip verdict={f.verdict} />
                      </div>
                    )}
                    {active && <span className="text-[8px] text-blue-300 italic shrink-0 animate-pulse">Analyzing…</span>}
                  </div>

                  {/* Steps stream in one by one */}
                  <div className="px-3.5 py-2.5 space-y-1.5">
                    {f.steps.slice(0, revealed).map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          step.triggered ? 'bg-red-500/70' : 'bg-emerald-600/60'
                        }`}>
                          {step.triggered
                            ? <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            : <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[9px] leading-snug ${step.triggered ? 'text-red-300 font-medium' : 'text-slate-400'}`}>
                            {step.text}
                          </span>
                          {step.metric && (
                            <span className={`ml-1.5 inline-block text-[8px] font-bold font-mono px-1 py-px rounded ${
                              step.triggered ? 'bg-red-800/50 text-red-300' : 'bg-slate-700 text-slate-400'
                            }`}>{step.metric}</span>
                          )}
                          {step.threshold && (
                            <span className="ml-1 text-[8px] text-slate-600 font-mono">/ {step.threshold}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* In-progress pulse after last revealed step */}
                    {active && revealed < f.steps.length && (
                      <div className="flex items-center gap-2 pl-5">
                        <div className="flex gap-0.5 items-center">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-0.5 bg-blue-600 rounded-full animate-pulse"
                              style={{ height: `${5 + i * 3}px`, animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                        <span className="text-[8px] text-blue-500/70 italic">Running check…</span>
                      </div>
                    )}

                    {/* Finding + drill-down once complete */}
                    {complete && (
                      <div className={`mt-1.5 pt-2 border-t ${isFlagged ? 'border-red-800/40' : 'border-amber-800/30'}`}>
                        <p className={`text-[9px] leading-snug ${isFlagged ? 'text-red-200/80' : 'text-amber-200/70'}`}>
                          {f.finding}
                        </p>
                        <button onClick={() => setModal(f.agentId)}
                          className="mt-1.5 text-[8px] font-semibold text-blue-500 hover:text-blue-300 transition-colors">
                          Full analysis + evidence →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Strategist — appears during synthesizing, steps also stream in */}
            {invPhase === 'synthesizing' && stratF && (() => {
              const revealed = revealedAgentSteps['strategist'] ?? -1
              return (
                <div className={`rounded-xl border transition-all duration-500 overflow-hidden ${
                  stratDone ? 'border-red-600/60 bg-red-950/30' : 'border-amber-700/40 bg-slate-800/60'
                }`}>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b ${
                    stratDone ? 'border-red-800/40' : 'border-slate-700/40'
                  }`}>
                    {stratDone
                      ? <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      : <PulseDot color="bg-amber-400" />}
                    <span className="text-[10px] font-bold text-slate-100 flex-1">Case Strategist</span>
                    {stratDone && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black font-mono text-red-400">{stratF.confidence}%</span>
                        <VerdictChip verdict={stratF.verdict} />
                      </div>
                    )}
                    {!stratDone && revealed >= 0 && (
                      <span className="text-[8px] text-amber-300 italic shrink-0 animate-pulse">Synthesizing…</span>
                    )}
                  </div>

                  {revealed >= 0 && (
                    <div className="px-3.5 py-2.5 space-y-1.5">
                      {stratF.steps.slice(0, revealed).map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            step.triggered ? 'bg-red-500/70' : 'bg-emerald-600/60'
                          }`}>
                            {step.triggered
                              ? <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              : <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[9px] leading-snug ${step.triggered ? 'text-red-300 font-medium' : 'text-slate-400'}`}>
                              {step.text}
                            </span>
                            {step.metric && (
                              <span className={`ml-1.5 inline-block text-[8px] font-bold font-mono px-1 py-px rounded ${
                                step.triggered ? 'bg-red-800/50 text-red-300' : 'bg-slate-700 text-slate-400'
                              }`}>{step.metric}</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {!stratDone && revealed < stratF.steps.length && (
                        <div className="flex items-center gap-2 pl-5">
                          <div className="flex gap-0.5 items-center">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-0.5 bg-amber-500 rounded-full animate-pulse"
                                style={{ height: `${5 + i * 3}px`, animationDelay: `${i * 0.2}s` }} />
                            ))}
                          </div>
                          <span className="text-[8px] text-amber-400/70 italic">Evaluating…</span>
                        </div>
                      )}

                      {stratDone && stratF.sarBrief && (
                        <div className="mt-1.5 pt-2 border-t border-red-800/40">
                          <div className="text-[9px] text-red-200 font-semibold">
                            SAR brief drafted — {stratF.sarBrief.type} filing recommended
                          </div>
                          <div className="text-[8px] text-slate-500 mt-0.5">
                            Filing deadline: {stratF.sarBrief.filingDeadline}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </>
  )
}

// ── SAR Brief card ────────────────────────────────────────────────────────────────

function SarBriefCard({ brief }: { brief: SarBrief }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[8px] font-black bg-white/20 text-white px-2 py-0.5 rounded tracking-widest uppercase">Draft SAR</span>
              <span className="text-[9px] font-bold bg-white text-red-700 px-2 py-0.5 rounded">{brief.type}</span>
            </div>
            <div className="text-sm font-black text-white leading-tight">{brief.typology}</div>
            <div className="text-[10px] text-red-200 mt-0.5">{brief.fincenRef}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[8px] text-red-200 uppercase tracking-wider">Filing deadline</div>
            <div className="text-sm font-black text-white">{brief.filingDeadline}</div>
            <div className="text-[8px] text-red-200">30-day clock</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-red-100">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">FinCEN Indicators Triggered</div>
        <div className="space-y-2">
          {brief.indicators.map((ind, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-px">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-[10px] text-slate-700 leading-snug">{ind}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-red-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">SAR Narrative — Draft</div>
          <button onClick={() => setExpanded(e => !e)} className="text-[9px] text-blue-800 hover:text-blue-900 font-semibold">
            {expanded ? 'Collapse' : 'Read full'}
          </button>
        </div>
        <p className={`text-[10px] text-slate-700 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>{brief.narrative}</p>
      </div>

      <div className="px-5 py-4 bg-red-50">
        <div className="text-[9px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Recommendation</div>
        <p className="text-[10px] text-red-800 font-medium leading-snug mb-3">{brief.recommendation}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {brief.jointFiling?.map(id => (
            <span key={id} className="text-[8px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Joint filing: {id}</span>
          ))}
          {brief.victimReferral && (
            <span className="text-[8px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded">Victim services referral</span>
          )}
          <button className="ml-auto text-[9px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
            Submit for Review →
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentSignalGrid({ findings, revealedIds }: { findings: AgentFinding[]; revealedIds?: string[] }) {
  if (!findings.length) return null
  const visible = revealedIds ? findings.filter(f => revealedIds.includes(f.agentId)) : findings
  const [modalAgentId, setModalAgentId] = useState<string | null>(null)
  const modalFinding = modalAgentId ? findings.find(f => f.agentId === modalAgentId) ?? null : null
  const modalAgent = modalAgentId ? AGENTS.find(a => a.id === modalAgentId) ?? null : null
  const flagCount = visible.filter(f => f.verdict === 'FLAGGED').length

  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      {modalFinding && modalAgent && (
        <AgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModalAgentId(null)} />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Why This Was Flagged</span>
        <span className="text-[8px] text-slate-400">{flagCount} of {visible.length} agents flagged</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visible.map(f => {
          const agent = AGENTS.find(a => a.id === f.agentId)!
          const isFlagged = f.verdict === 'FLAGGED'
          const triggeredSteps = f.steps.filter(s => s.triggered)
          const hasArtifacts = f.artifacts && f.artifacts.length > 0

          return (
            <button
              key={f.agentId}
              onClick={() => setModalAgentId(f.agentId)}
              className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Gradient top strip */}
              <div className={`h-0.5 ${isFlagged
                ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-300'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300'}`}
              />

              <div className="p-4">
                {/* Header: name + confidence number */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[8px] font-bold font-mono text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">{agent.htRule}</span>
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

                {/* Gradient progress bar */}
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${isFlagged
                      ? 'bg-gradient-to-r from-red-500 to-rose-400'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300'}`}
                    style={{ width: `${f.confidence}%` }}
                  />
                </div>

                {/* Triggered signals */}
                <div className="space-y-2.5 mb-4">
                  {triggeredSteps.slice(0, 3).map((step, i) => (
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

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${isFlagged ? 'border-red-100' : 'border-amber-100'}`}>
                  <span className="text-[8px] text-slate-400">
                    {hasArtifacts ? `${f.artifacts!.length} evidence tables` : ''}
                  </span>
                  <div className={`flex items-center gap-1 text-[9px] font-semibold transition-colors ${isFlagged
                    ? 'text-red-500 group-hover:text-red-700'
                    : 'text-amber-500 group-hover:text-amber-700'}`}>
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
    <div className={`rounded-xl p-4 border ${isNewAccount ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isNewAccount ? 'text-red-600' : 'text-blue-800'}`}>Account Profile</span>
        <span className={`font-mono text-[9px] ${isNewAccount ? 'text-red-400' : 'text-blue-500'}`}>{c.cardholderIdA}</span>
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
              <span key={m} className="text-[8px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-medium">{m}</span>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg p-2.5 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-[8px] text-slate-400 font-medium mb-1.5">Baseline Cash Activity</div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-0.5">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(ctx.baselineCashPct * 100, 100)}%` }} />
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

function CardholderDetail({ c, findings, strategist, invPhase, completedAgents, revealedAgentSteps }: {
  c: CorridorCase; findings: AgentFinding[]; strategist?: AgentFinding
  invPhase: InvPhase; completedAgents: string[]; revealedAgentSteps: Record<string, number>
}) {
  return (
    <div className="space-y-4">
      <InvestigationPipeline caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Cardholder · Corridor</span>
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

      <InvestigationLiveView caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />

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

      {invPhase === 'complete' && <AgentSignalGrid findings={findings} />}
      <FinCENPanel categories={c.flaggedCategories} />
      {invPhase === 'complete' && strategist?.sarBrief && <SarBriefCard brief={strategist.sarBrief} />}
    </div>
  )
}

// ── Merchant detail ───────────────────────────────────────────────────────────────

function MerchantDetail({ c, findings, strategist, invPhase, completedAgents, revealedAgentSteps }: {
  c: FrontBusinessCase; findings: AgentFinding[]; strategist?: AgentFinding
  invPhase: InvPhase; completedAgents: string[]; revealedAgentSteps: Record<string, number>
}) {
  const volMultiplier = c.peerMonthlyVolume > 0 ? `${(c.monthlyVolume / c.peerMonthlyVolume).toFixed(1)}×` : undefined
  const cnpMultiplier = `${(c.cnpPct * 100).toFixed(0)}% vs 30%`
  return (
    <div className="space-y-4">
      <InvestigationPipeline caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} />
      <InvestigationLiveView caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
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

      {invPhase === 'complete' && <AgentSignalGrid findings={findings} />}
      <FinCENPanel categories={c.flaggedCategories} />
      {invPhase === 'complete' && strategist?.sarBrief && <SarBriefCard brief={strategist.sarBrief} />}
    </div>
  )
}

// ── Cluster detail ────────────────────────────────────────────────────────────────

function ClusterDetail({ c, findings, strategist, invPhase, completedAgents, revealedAgentSteps }: {
  c: ControllerCase; findings: AgentFinding[]; strategist?: AgentFinding
  invPhase: InvPhase; completedAgents: string[]; revealedAgentSteps: Record<string, number>
}) {
  const { nodes, edges } = useMemo(() => buildClusterGraph(c), [c])
  return (
    <div className="space-y-4">
      <InvestigationPipeline caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} />
      <InvestigationLiveView caseId={c.id} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
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
            <span className="flex items-center gap-1 text-slate-400"><span className="inline-block w-3 h-0.5 bg-blue-600 mr-0.5" /> Capital One</span>
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

      {invPhase === 'complete' && <AgentSignalGrid findings={findings} />}
      <FinCENPanel categories={c.flaggedCategories} />
      {invPhase === 'complete' && strategist?.sarBrief && <SarBriefCard brief={strategist.sarBrief} />}
    </div>
  )
}

// ── Center panel dispatcher ───────────────────────────────────────────────────────

function CenterPanel({ caseId, invPhase, completedAgents, revealedAgentSteps }: {
  caseId: string | null; invPhase: InvPhase; completedAgents: string[]; revealedAgentSteps: Record<string, number>
}) {
  if (!caseId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-2">Select a case to investigate</div>
        <p className="text-[10px] text-slate-400 max-w-60 leading-relaxed mb-2">
          The rule engine scans 47,823 accounts continuously. Select a flagged case to launch the agentic investigation pipeline.
        </p>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Rule engine active · {AGENT_FINDINGS.filter(f => f.verdict === 'FLAGGED').length} flags · {ALL_CASES.length} cases
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-xs">
          {[
            { label: 'Cardholders', count: CORRIDOR_CASES.length, cls: 'bg-blue-100 text-blue-900' },
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
        return <CardholderDetail c={c} findings={findings} strategist={strategist} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
      })()}
      {entry.entityType === 'merchant' && (() => {
        const c = FRONT_BUSINESS_CASES.find(x => x.id === caseId)!
        return <MerchantDetail c={c} findings={findings} strategist={strategist} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
      })()}
      {entry.entityType === 'cluster' && (() => {
        const c = CONTROLLER_CASES.find(x => x.id === caseId)!
        return <ClusterDetail c={c} findings={findings} strategist={strategist} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
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
                      className={`w-full text-left rounded-lg p-2.5 transition-all border ${sel ? 'bg-blue-800 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-mono text-[9px] font-bold ${sel ? 'text-blue-200' : 'text-slate-500'}`}>{c.id}</span>
                        <RiskBadge score={c.riskScore} />
                      </div>
                      <div className={`text-[10px] font-semibold leading-tight mb-1 ${sel ? 'text-white' : 'text-slate-800'}`}>{c.label}</div>
                      <div className={`text-[9px] ${sel ? 'text-blue-200' : 'text-slate-500'}`}>{c.sub}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${sel ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                          {c.agentHits} flagged
                        </span>
                        <div className="flex gap-0.5 flex-wrap">
                          {c.flaggedCategories.slice(0, 2).map(id => (
                            <span key={id} className={`text-[7px] font-bold px-1 py-0.5 rounded font-mono ${sel ? 'bg-blue-900 text-blue-200' : 'bg-amber-50 text-amber-700'}`}>{id}</span>
                          ))}
                          {c.flaggedCategories.length > 2 && (
                            <span className={`text-[7px] px-1 py-0.5 rounded ${sel ? 'bg-blue-900 text-blue-300' : 'bg-slate-100 text-slate-500'}`}>+{c.flaggedCategories.length - 2}</span>
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
              <span className="text-[8px] font-bold font-mono text-blue-800">{agent.htRule}</span>
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
                <span className="text-[7px] font-bold text-blue-800 font-mono">{agent.htRule}</span>
                <span className="text-[7px] text-slate-300">·</span>
                <span className="text-[7px] text-slate-400">{agent.scanCount} {agent.scanLabel}</span>
              </div>
              <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: hits > 0 ? '100%' : '55%' }} />
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

// ── Right panel: Live investigation feed ─────────────────────────────────────────

function AgentCasePanel({ caseId, invPhase, completedAgents }: {
  caseId: string; invPhase: InvPhase; completedAgents: string[]
}) {
  const allFindings  = findingsForCase(caseId)
  const nonStrat     = allFindings.filter(f => f.agentId !== 'strategist')
  const strategist   = allFindings.find(f => f.agentId === 'strategist')
  const [modal, setModal] = useState<string | null>(null)
  const modalFinding = modal ? allFindings.find(f => f.agentId === modal) ?? null : null
  const modalAgent   = modal ? AGENTS.find(a => a.id === modal) ?? null : null

  const triggeredRules = nonStrat
    .filter(f => f.steps.some(s => s.triggered))
    .map(f => AGENTS.find(a => a.id === f.agentId)?.htRule)
    .filter(Boolean) as string[]

  const headerText = invPhase === 'complete' ? 'Investigation Complete' : 'Agent Investigation'
  const headerColor = invPhase === 'complete' ? 'bg-emerald-500' : 'bg-blue-600'

  return (
    <div className="flex flex-col h-full">
      {modalFinding && modalAgent && (
        <AgentDetailModal agent={modalAgent} finding={modalFinding} onClose={() => setModal(null)} />
      )}

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          {invPhase === 'complete'
            ? <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            : <PulseDot color={headerColor} />}
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{headerText}</span>
        </div>
        <div className="text-[8px] text-slate-400">{caseId}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {/* Phase: detecting */}
        {invPhase !== 'idle' && (
          <div className={`rounded-xl border p-3 transition-all duration-500 ${
            invPhase === 'detecting' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              {invPhase === 'detecting'
                ? <PulseDot color="bg-blue-600" />
                : <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
              <span className="text-[9px] font-bold text-slate-700">Rule Engine</span>
            </div>
            <div className="text-[8px] text-slate-500 mb-2">
              {invPhase === 'detecting' ? 'Scanning 47,823 accounts…' : '47,823 accounts scanned'}
            </div>
            {invPhase !== 'detecting' && triggeredRules.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {triggeredRules.map(rule => (
                  <span key={rule} className="text-[7px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">{rule} triggered</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: dispatching */}
        {invPhase === 'dispatching' && (
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-3">
            <div className="flex items-center gap-2">
              <PulseDot color="bg-blue-600" />
              <span className="text-[9px] font-bold text-blue-900">Dispatching {nonStrat.length} specialist agents…</span>
            </div>
          </div>
        )}

        {/* Agents — appear one by one */}
        {['investigating','synthesizing','complete'].includes(invPhase) && nonStrat.map(f => {
          const agent  = AGENTS.find(a => a.id === f.agentId)!
          const done   = completedAgents.includes(f.agentId)
          const active = !done && invPhase === 'investigating'
          return (
            <div key={f.agentId} className={`rounded-xl border p-3 transition-all duration-300 ${
              done ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {done
                  ? <div className={`w-2 h-2 rounded-full shrink-0 ${f.verdict === 'FLAGGED' ? 'bg-red-500' : 'bg-amber-400'}`} />
                  : <PulseDot color={active ? 'bg-slate-400' : 'bg-slate-300'} />}
                <span className="text-[7px] font-bold font-mono text-blue-800 w-7 shrink-0">{agent.htRule}</span>
                <span className="text-[9px] font-semibold text-slate-700 flex-1 truncate">{agent.name}</span>
                {done && <VerdictChip verdict={f.verdict} />}
                {!done && active && <span className="text-[8px] text-slate-400 italic">Analyzing…</span>}
              </div>
              {done && (
                <>
                  <ConfidenceBar value={f.confidence} />
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => setModal(f.agentId)}
                      className="text-[8px] font-semibold text-blue-800 hover:text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors">
                      Full Analysis →
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Strategist */}
        {['synthesizing','complete'].includes(invPhase) && strategist && (() => {
          const done = completedAgents.includes('strategist')
          return (
            <div className={`rounded-xl border p-3 transition-all duration-300 ${
              done ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {done ? <PulseDot color="bg-red-500" /> : <PulseDot color="bg-amber-400" />}
                <span className="text-[9px] font-bold text-slate-800 flex-1">Case Strategist</span>
                {done && <VerdictChip verdict={strategist.verdict} />}
              </div>
              {!done && (
                <p className="text-[8px] text-slate-400 italic">
                  Synthesizing {completedAgents.filter(id => id !== 'strategist').length} agent findings…
                </p>
              )}
              {done && (
                <>
                  <ConfidenceBar value={strategist.confidence} />
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => setModal('strategist')}
                      className="text-[8px] font-semibold text-blue-800 hover:text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors">
                      Full Analysis →
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* SAR ready nudge */}
        {invPhase === 'complete' && strategist?.sarBrief && (
          <div className="bg-red-600 rounded-xl p-3 text-center">
            <div className="text-[9px] font-black text-white mb-0.5">SAR Brief Ready</div>
            <div className="text-[8px] text-red-200">{strategist.sarBrief.type} · Due {strategist.sarBrief.filingDeadline}</div>
            <div className="text-[7px] text-red-300 mt-1">See case panel below ↓</div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
        <div className="text-[8px] text-slate-400">
          {invPhase === 'complete' ? `Investigation complete · ${caseId}` : `${caseId} · In progress…`}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────────

const STEP_MS   = 320  // ms between each revealed step
const AGENT_GAP = 450  // ms pause between finishing one agent and starting the next

export default function DarkPatterns() {
  const [selectedCaseId,    setSelectedCaseId]    = useState<string | null>(null)
  const [invPhase,          setInvPhase]          = useState<InvPhase>('idle')
  const [completedAgents,   setCompletedAgents]   = useState<string[]>([])
  const [revealedAgentSteps, setRevealedAgentSteps] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!selectedCaseId) {
      setInvPhase('idle'); setCompletedAgents([]); setRevealedAgentSteps({})
      return
    }

    const nonStrat = AGENT_FINDINGS.filter(f => f.caseId === selectedCaseId && f.agentId !== 'strategist')
    const stratF   = AGENT_FINDINGS.find(f => f.caseId === selectedCaseId && f.agentId === 'strategist')
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    setInvPhase('detecting')
    setCompletedAgents([])
    setRevealedAgentSteps({})

    at(800,  () => setInvPhase('dispatching'))
    at(1600, () => setInvPhase('investigating'))

    let cursor = 1600

    for (const f of nonStrat) {
      const agentId = f.agentId
      // Agent appears with 0 steps visible
      at(cursor, () => setRevealedAgentSteps(p => ({ ...p, [agentId]: 0 })))
      // Each step streams in
      f.steps.forEach((_, i) => {
        cursor += STEP_MS
        const count = i + 1
        at(cursor, () => setRevealedAgentSteps(p => ({ ...p, [agentId]: count })))
      })
      // Agent verdict appears after final step
      cursor += STEP_MS
      at(cursor, () => setCompletedAgents(p => [...p, agentId]))
      cursor += AGENT_GAP
    }

    // Strategist synthesis phase
    at(cursor, () => setInvPhase('synthesizing'))
    cursor += 300
    if (stratF) {
      at(cursor, () => setRevealedAgentSteps(p => ({ ...p, strategist: 0 })))
      stratF.steps.forEach((_, i) => {
        cursor += STEP_MS
        const count = i + 1
        at(cursor, () => setRevealedAgentSteps(p => ({ ...p, strategist: count })))
      })
      cursor += STEP_MS
      at(cursor, () => { setCompletedAgents(p => [...p, 'strategist']); setInvPhase('complete') })
    } else {
      cursor += 1800
      at(cursor, () => { setCompletedAgents(p => [...p, 'strategist']); setInvPhase('complete') })
    }

    return () => timers.forEach(clearTimeout)
  }, [selectedCaseId])

  function handleSelectCase(id: string) {
    setInvPhase('idle')
    setCompletedAgents([])
    setRevealedAgentSteps({})
    setSelectedCaseId(null)
    requestAnimationFrame(() => setSelectedCaseId(id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <CaseRegistry selectedId={selectedCaseId} onSelect={handleSelectCase} />
      <CenterPanel caseId={selectedCaseId} invPhase={invPhase} completedAgents={completedAgents} revealedAgentSteps={revealedAgentSteps} />
      <div className="w-[270px] shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
        {selectedCaseId
          ? <AgentCasePanel key={selectedCaseId} caseId={selectedCaseId} invPhase={invPhase} completedAgents={completedAgents} />
          : <AgentScanningPanel />
        }
      </div>
    </div>
  )
}
