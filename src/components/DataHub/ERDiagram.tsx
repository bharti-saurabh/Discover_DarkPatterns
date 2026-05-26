import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  type NodeTypes, type Node, type Edge,
  Handle, Position, BaseEdge, getSmoothStepPath,
  type EdgeProps, MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ── Custom node ───────────────────────────────────────────────────────────────

interface TableNodeData {
  label: string
  side: 'capone' | 'discover' | 'cross'
  recordCount: string
  pkField: string
  fkFields: string[]
  joinFields: string[]
}

function TableNode({ data }: { data: TableNodeData }) {
  const headerColor = data.side === 'capone'
    ? 'bg-indigo-600 text-white'
    : data.side === 'discover'
      ? 'bg-violet-600 text-white'
      : 'bg-amber-500 text-white'

  const borderColor = data.side === 'capone'
    ? 'border-indigo-300'
    : data.side === 'discover'
      ? 'border-violet-300'
      : 'border-amber-300'

  return (
    <div className={`bg-white rounded-lg border-2 ${borderColor} shadow-sm min-w-[200px] text-xs overflow-hidden`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-0" />

      {/* Header */}
      <div className={`${headerColor} px-3 py-2 flex items-center justify-between`}>
        <span className="font-mono font-bold text-[11px] leading-tight">{data.label}</span>
        <span className="text-[9px] font-semibold opacity-80 bg-white/20 px-1.5 py-0.5 rounded ml-2 shrink-0">
          {data.recordCount}
        </span>
      </div>

      {/* Fields */}
      <div className="divide-y divide-slate-100">
        {data.pkField && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50">
            <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded shrink-0">PK</span>
            <span className="font-mono text-[10px] text-slate-700 truncate">{data.pkField}</span>
          </div>
        )}
        {data.fkFields.map(f => (
          <div key={f} className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded shrink-0">FK</span>
            <span className="font-mono text-[10px] text-slate-600 truncate">{f}</span>
          </div>
        ))}
        {data.joinFields.map(f => (
          <div key={f} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/50">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span className="font-mono text-[10px] text-slate-600 truncate">{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Custom edge ───────────────────────────────────────────────────────────────

function CrossEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }: EdgeProps & { data?: { label?: string; category?: string } }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 16 })
  const color = data?.category === 'cross' ? '#F59E0B' : data?.category === 'capone' ? '#6366F1' : '#8B5CF6'

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: 1.5 }} />
      {data?.label && (
        <foreignObject x={labelX - 45} y={labelY - 10} width={90} height={20} className="pointer-events-none">
          <div style={{ background: color }} className="text-white text-[8px] font-semibold px-1.5 py-0.5 rounded text-center truncate">
            {data.label}
          </div>
        </foreignObject>
      )}
    </>
  )
}

const nodeTypes: NodeTypes = { table: TableNode }
const edgeTypes = { cross: CrossEdge }

// ── Node definitions ─────────────────────────────────────────────────────────

const NODES: Node[] = [
  // ── Capital One ─────────────────────────────────────────
  {
    id: 'cap_customers', type: 'table', position: { x: 40, y: 80 },
    data: { label: 'cap_customers', side: 'capone', recordCount: '5K', pkField: 'customer_id', fkFields: [], joinFields: ['ssn_last4','dob','name_hash','email','phone_primary'] },
  },
  {
    id: 'cap_accounts', type: 'table', position: { x: 40, y: 360 },
    data: { label: 'cap_accounts', side: 'capone', recordCount: '5.8K', pkField: 'account_id', fkFields: ['customer_id'], joinFields: ['pan_hash','bin','card_type'] },
  },
  {
    id: 'cap_transactions', type: 'table', position: { x: 40, y: 640 },
    data: { label: 'cap_transactions', side: 'capone', recordCount: '50K', pkField: 'txn_id', fkFields: ['account_id'], joinFields: ['auth_code','merchant_id','ip_address'] },
  },
  {
    id: 'cap_device_sessions', type: 'table', position: { x: 310, y: 640 },
    data: { label: 'cap_device_sessions', side: 'capone', recordCount: '15K', pkField: 'session_id', fkFields: ['account_id'], joinFields: ['ip_address','device_fingerprint'] },
  },
  {
    id: 'cap_disputes', type: 'table', position: { x: 310, y: 360 },
    data: { label: 'cap_disputes', side: 'capone', recordCount: '1.5K', pkField: 'dispute_id', fkFields: ['account_id','txn_id'], joinFields: [] },
  },
  {
    id: 'cap_commercial', type: 'table', position: { x: 40, y: 920 },
    data: { label: 'cap_commercial', side: 'capone', recordCount: '400', pkField: 'counterparty_id', fkFields: [], joinFields: ['ein_hash','beneficial_owner_ids'] },
  },

  // ── Discover Issuer ──────────────────────────────────────
  {
    id: 'disc_customers', type: 'table', position: { x: 860, y: 80 },
    data: { label: 'disc_customers', side: 'discover', recordCount: '4K', pkField: 'customer_id', fkFields: [], joinFields: ['ssn_last4','dob','name_hash','email','phone_primary'] },
  },
  {
    id: 'disc_accounts', type: 'table', position: { x: 860, y: 360 },
    data: { label: 'disc_accounts', side: 'discover', recordCount: '4.5K', pkField: 'account_id', fkFields: ['customer_id'], joinFields: ['pan_hash','bin'] },
  },
  {
    id: 'disc_cardholder_txns', type: 'table', position: { x: 860, y: 640 },
    data: { label: 'disc_cardholder_txns', side: 'discover', recordCount: '35K', pkField: 'txn_id', fkFields: ['account_id','merchant_id'], joinFields: ['network_txn_id'] },
  },

  // ── Discover Network ─────────────────────────────────────
  {
    id: 'disc_merchants', type: 'table', position: { x: 1130, y: 360 },
    data: { label: 'disc_merchants', side: 'discover', recordCount: '2K', pkField: 'merchant_id', fkFields: ['acquirer_id'], joinFields: ['ein_hash'] },
  },
  {
    id: 'disc_terminals', type: 'table', position: { x: 1130, y: 640 },
    data: { label: 'disc_terminals', side: 'discover', recordCount: '5K', pkField: 'terminal_id', fkFields: ['merchant_id'], joinFields: ['ip_address','device_serial'] },
  },
  {
    id: 'disc_network_txns', type: 'table', position: { x: 1130, y: 920 },
    data: { label: 'disc_network_txns', side: 'discover', recordCount: '100K', pkField: 'network_txn_id', fkFields: ['merchant_id','terminal_id','acquirer_id'], joinFields: ['pan_hash','auth_code','card_type','issuer_bin'] },
  },
  {
    id: 'disc_settlements', type: 'table', position: { x: 860, y: 920 },
    data: { label: 'disc_settlements', side: 'discover', recordCount: '2K', pkField: 'settlement_id', fkFields: ['merchant_id','acquirer_id'], joinFields: [] },
  },
  {
    id: 'disc_chargebacks', type: 'table', position: { x: 1130, y: 1200 },
    data: { label: 'disc_chargebacks', side: 'discover', recordCount: '1.2K', pkField: 'chargeback_id', fkFields: ['network_txn_id','merchant_id'], joinFields: [] },
  },
  {
    id: 'disc_bin_table', type: 'table', position: { x: 860, y: 1200 },
    data: { label: 'disc_bin_table', side: 'discover', recordCount: '150', pkField: 'bin', fkFields: [], joinFields: ['card_type'] },
  },
  {
    id: 'disc_fraud_patterns', type: 'table', position: { x: 1130, y: 1480 },
    data: { label: 'disc_fraud_patterns', side: 'discover', recordCount: '80', pkField: 'pattern_id', fkFields: [], joinFields: ['merchant_ids','bin_ranges'] },
  },
]

type FilterMode = 'all' | 'internal' | 'cross'

function buildEdges(filter: FilterMode): Edge[] {
  const mk = (type: string) => ({ type: MarkerType.ArrowClosed, width: 12, height: 12, color: type === 'cross' ? '#F59E0B' : type === 'capone' ? '#6366F1' : '#8B5CF6' })

  const internalCapOne: Edge[] = [
    { id: 'e1',  source: 'cap_customers',     target: 'cap_accounts',       type: 'cross', markerEnd: mk('capone'), data: { label: '1 : N', category: 'capone' }, animated: false },
    { id: 'e2',  source: 'cap_accounts',      target: 'cap_transactions',   type: 'cross', markerEnd: mk('capone'), data: { label: '1 : N', category: 'capone' }, animated: false },
    { id: 'e3',  source: 'cap_accounts',      target: 'cap_device_sessions',type: 'cross', markerEnd: mk('capone'), data: { label: '1 : N', category: 'capone' }, animated: false },
    { id: 'e4',  source: 'cap_accounts',      target: 'cap_disputes',       type: 'cross', markerEnd: mk('capone'), data: { label: '1 : N', category: 'capone' }, animated: false },
    { id: 'e5',  source: 'cap_transactions',  target: 'cap_disputes',       type: 'cross', markerEnd: mk('capone'), data: { label: '1 : N', category: 'capone' }, animated: false },
  ]

  const internalDiscover: Edge[] = [
    { id: 'e10', source: 'disc_customers',       target: 'disc_accounts',         type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e11', source: 'disc_accounts',        target: 'disc_cardholder_txns',  type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e12', source: 'disc_merchants',       target: 'disc_terminals',        type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e13', source: 'disc_merchants',       target: 'disc_network_txns',     type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e14', source: 'disc_terminals',       target: 'disc_network_txns',     type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e15', source: 'disc_merchants',       target: 'disc_settlements',      type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e16', source: 'disc_network_txns',    target: 'disc_chargebacks',      type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e17', source: 'disc_bin_table',       target: 'disc_network_txns',     type: 'cross', markerEnd: mk('discover'), data: { label: '1 : N', category: 'discover' }, animated: false },
    { id: 'e18', source: 'disc_cardholder_txns', target: 'disc_network_txns',     type: 'cross', markerEnd: mk('discover'), data: { label: '1 : 1', category: 'discover' }, animated: false },
    { id: 'e19', source: 'disc_merchants',       target: 'disc_fraud_patterns',   type: 'cross', markerEnd: mk('discover'), data: { label: 'N : M', category: 'discover' }, animated: false },
  ]

  const crossSystem: Edge[] = [
    { id: 'c1', source: 'cap_customers',    target: 'disc_customers',    type: 'cross', markerEnd: mk('cross'), data: { label: 'ER match', category: 'cross' }, animated: true },
    { id: 'c2', source: 'cap_accounts',     target: 'disc_network_txns', type: 'cross', markerEnd: mk('cross'), data: { label: 'pan_hash', category: 'cross' }, animated: true },
    { id: 'c3', source: 'cap_transactions', target: 'disc_network_txns', type: 'cross', markerEnd: mk('cross'), data: { label: 'auth_code', category: 'cross' }, animated: true },
    { id: 'c4', source: 'cap_transactions', target: 'disc_merchants',    type: 'cross', markerEnd: mk('cross'), data: { label: 'merchant_id', category: 'cross' }, animated: true },
    { id: 'c5', source: 'cap_accounts',     target: 'disc_bin_table',    type: 'cross', markerEnd: mk('cross'), data: { label: 'bin', category: 'cross' }, animated: true },
    { id: 'c6', source: 'cap_commercial',   target: 'disc_merchants',    type: 'cross', markerEnd: mk('cross'), data: { label: 'ein_hash', category: 'cross' }, animated: true },
  ]

  if (filter === 'internal') return [...internalCapOne, ...internalDiscover]
  if (filter === 'cross') return crossSystem
  return [...internalCapOne, ...internalDiscover, ...crossSystem]
}

// ── ER Diagram component ──────────────────────────────────────────────────────

export default function ERDiagram() {
  const [filter, setFilter] = useState<FilterMode>('all')

  const edges = useMemo(() => buildEdges(filter), [filter])

  const onInit = useCallback(() => {}, [])

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex items-center gap-4 px-2 py-3 border-b border-slate-200 bg-white shrink-0">
        <span className="text-xs font-medium text-slate-500">Show relationships:</span>
        <div className="flex gap-1">
          {([
            { v: 'all', label: 'All' },
            { v: 'internal', label: 'Internal only' },
            { v: 'cross', label: 'Cross-system only' },
          ] as const).map(opt => (
            <button
              key={opt.v}
              onClick={() => setFilter(opt.v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors border ${
                filter === opt.v
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-indigo-500 rounded"></span> Capital One internal</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-violet-500 rounded"></span> Discover internal</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-amber-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#F59E0B 0,#F59E0B 4px,transparent 4px,transparent 8px)' }}></span>
            Cross-system join
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="text-amber-600 font-mono text-[10px] bg-amber-100 px-1 rounded">PK</span> Primary key
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="text-indigo-600 font-mono text-[10px] bg-indigo-50 px-1 rounded">FK</span> Foreign key
          </span>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 bg-slate-50" style={{ minHeight: 0 }}>
        <ReactFlow
          nodes={NODES}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={onInit}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.2}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'cross' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={20} size={1} />
          <Controls className="!bg-white !border-slate-200 !shadow-sm" />
          <MiniMap
            className="!bg-white !border-slate-200"
            nodeColor={n => {
              const side = (n.data as unknown as TableNodeData).side
              return side === 'capone' ? '#6366F1' : side === 'discover' ? '#8B5CF6' : '#F59E0B'
            }}
            maskColor="rgba(248,250,252,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
