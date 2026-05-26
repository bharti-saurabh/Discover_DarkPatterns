import { useMemo, useState } from 'react'
import { ReactFlow, Background, Controls, MarkerType, Handle, Position, type Node, type Edge } from '@xyflow/react'
import { CONTROLLER_CASES, FINCEN_CATEGORIES, type ControllerCase } from '../../data/darkPatternsData'

// ── Custom nodes ─────────────────────────────────────────────────────────────

function ControllerNode({ data }: { data: { ip: string; fp: string } }) {
  return (
    <div className="bg-red-700 text-white rounded-xl px-4 py-3 shadow-lg border-2 border-red-400 min-w-[180px]">
      <Handle type="source" position={Position.Right} className="!bg-red-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left}  className="!bg-red-400 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-400 !border-0 !w-2 !h-2" />
      <div className="text-[9px] font-bold opacity-70 uppercase tracking-wider mb-1">Controller</div>
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
      <Handle type="target" position={Position.Left}  className="!bg-slate-400 !border-0 !w-2 !h-2" />
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
          {data.signals.map(s => (
            <span key={s} className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded">{s.replace('_', ' ')}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MerchantNode({ data }: { data: { id: string; name: string; mccLabel: string; count: number; window: string } }) {
  return (
    <div className="bg-slate-800 text-white rounded-lg px-3 py-2 shadow-sm min-w-[150px]">
      <Handle type="target" position={Position.Top}   className="!bg-slate-500 !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left}  className="!bg-slate-500 !border-0 !w-2 !h-2" />
      <div className="text-[9px] font-bold text-slate-400 mb-0.5">Discover Merchant</div>
      <div className="text-[11px] font-semibold">{data.name}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{data.mccLabel}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-amber-400">{data.count} cards hit</span>
        <span className="text-[9px] text-slate-500">{data.window}</span>
      </div>
    </div>
  )
}

const nodeTypes = { controller: ControllerNode, account: AccountNode, merchant: MerchantNode }

function buildGraph(c: ControllerCase): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Controller node — center
  nodes.push({
    id: 'ctrl',
    type: 'controller',
    position: { x: 320, y: 280 },
    data: { ip: c.controllerIp, fp: c.controllerFingerprint.slice(0, 18) + '…' },
  })

  // Account nodes — arranged in a spread
  const capOne  = c.accounts.filter(a => a.institution === 'capone')
  const discover = c.accounts.filter(a => a.institution === 'discover')
  const external = c.accounts.filter(a => !['capone','discover'].includes(a.institution))

  const allAccounts = [...capOne, ...discover, ...external]
  const angleStep = (2 * Math.PI) / allAccounts.length
  const radius = 260

  allAccounts.forEach((acc, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    const x = 380 + radius * Math.cos(angle) - 80
    const y = 320 + radius * Math.sin(angle) - 40

    const inst = capOne.includes(acc) ? 'capone' : discover.includes(acc) ? 'discover' : 'external'
    nodes.push({
      id: acc.id,
      type: 'account',
      position: { x, y },
      data: {
        id: acc.id,
        name: acc.holderName,
        institution: inst,
        cashOut: acc.cashOutTotal,
        signals: acc.sharedSignals,
        daysOld: acc.openedDaysAgo,
      },
    })

    const edgeColor = inst === 'capone' ? '#6366F1' : inst === 'discover' ? '#8B5CF6' : '#94A3B8'
    const hasDevice = acc.sharedSignals.includes('device_fingerprint') || acc.sharedSignals.includes('ip_address') || acc.sharedSignals.includes('terminal_ip')

    edges.push({
      id: `ctrl-${acc.id}`,
      source: 'ctrl',
      target: acc.id,
      animated: hasDevice,
      style: { stroke: edgeColor, strokeWidth: hasDevice ? 2 : 1.5, strokeDasharray: hasDevice ? undefined : '4 3' },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 10, height: 10 },
      label: hasDevice ? 'device/IP' : 'co-occurrence',
      labelStyle: { fontSize: 8, fill: '#94A3B8' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    })
  })

  // Merchant nodes — below
  c.sharedMerchants.forEach((m, i) => {
    const x = 120 + i * 240
    const y = 700
    nodes.push({
      id: m.merchantId,
      type: 'merchant',
      position: { x, y },
      data: { id: m.merchantId, name: m.merchantName, mccLabel: m.mccLabel, count: m.transactionCount, window: m.timeWindow },
    })

    // Connect all accounts to each merchant
    allAccounts.forEach(acc => {
      edges.push({
        id: `${acc.id}-${m.merchantId}`,
        source: acc.id,
        target: m.merchantId,
        style: { stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '3 3' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B', width: 8, height: 8 },
      })
    })
  })

  return { nodes, edges }
}

function CaseDetail({ c }: { c: ControllerCase }) {
  const { nodes, edges } = useMemo(() => buildGraph(c), [c])

  return (
    <div className="space-y-4">
      {/* Graph */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f1f5f9" gap={20} size={1} />
          <Controls className="!bg-white !border-slate-200" />
        </ReactFlow>
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

      {/* FinCEN */}
      <div className="bg-slate-900 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">FinCEN Red Flags Triggered</div>
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

export default function ControllerGraph() {
  const [selectedId, setSelectedId] = useState(CONTROLLER_CASES[0].id)
  const selected = CONTROLLER_CASES.find(c => c.id === selectedId)!

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 h-full min-h-0">
      {/* Case list */}
      <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {CONTROLLER_CASES.map(c => (
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
            <div className={`text-sm font-semibold mb-1 ${selectedId === c.id ? 'text-white' : 'text-slate-800'}`}>
              {c.accounts.length} accounts · {c.sharedMerchants.length} merchants
            </div>
            <div className={`text-xs ${selectedId === c.id ? 'text-slate-400' : 'text-slate-500'}`}>
              ${c.totalCashOut.toLocaleString()} total cash-out · {c.daySpan} days
            </div>
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
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-900">Controller Network</h3>
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Risk {selected.riskScore}</span>
          <span className="text-xs text-slate-400 font-mono">{selected.controllerFingerprint}</span>
        </div>
        <CaseDetail c={selected} />
      </div>
    </div>
  )
}
