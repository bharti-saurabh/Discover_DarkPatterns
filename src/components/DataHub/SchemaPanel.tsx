import { useState } from 'react'
import type { TableDef } from './schemaConfig'
import { TAG_COLORS } from './schemaConfig'
import type { AllData } from '../../data/types'
import { getTableRows } from '../../data/useGeneratedData'

interface Props {
  tables: TableDef[]
  side: 'A' | 'B'
  highlightedFields: Set<string>
  onTableSelect: (tableId: string | null) => void
  data: AllData | null
  loadingData: boolean
  onRequestData: () => void
}

const SIDE_COLORS = {
  A: { header: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  B: { header: 'bg-violet-600', badge: 'bg-violet-100 text-violet-700' },
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K'
  return n.toString()
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return `[${v.slice(0, 2).join(', ')}${v.length > 2 ? '…' : ''}]`
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return v.toLocaleString()
  const s = String(v)
  return s.length > 28 ? s.slice(0, 26) + '…' : s
}

interface DataPreviewProps {
  table: TableDef
  data: AllData
}

function DataPreview({ table, data }: DataPreviewProps) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = getTableRows(data, table.id as any)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(Math.min(rows.length, 100) / PAGE_SIZE)
  const cols = table.fields.map(f => f.name)

  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] font-semibold text-slate-600">
          Showing rows {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </button>
          <span className="text-[10px] text-slate-400 tabular-nums">{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-52">
        <table className="text-[10px] w-full border-collapse">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr>
              {cols.map(col => (
                <th key={col} className="px-2 py-1.5 text-left font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {cols.map(col => (
                  <td key={col} className="px-2 py-1 text-slate-600 border-b border-slate-100 whitespace-nowrap font-mono">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SchemaPanel({ tables, side, highlightedFields, onTableSelect, data, loadingData, onRequestData }: Props) {
  const [expandedTable, setExpandedTable] = useState<string | null>(tables[0]?.id ?? null)
  const [previewTable, setPreviewTable] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'schema' | 'data'>>({})
  const colors = SIDE_COLORS[side]

  function toggleTable(id: string) {
    const next = expandedTable === id ? null : id
    setExpandedTable(next)
    onTableSelect(next)
  }

  function handleDataTab(tableId: string) {
    setActiveTab(prev => ({ ...prev, [tableId]: 'data' }))
    setPreviewTable(tableId)
    if (!data && !loadingData) onRequestData()
  }

  function handleSchemaTab(tableId: string) {
    setActiveTab(prev => ({ ...prev, [tableId]: 'schema' }))
    setPreviewTable(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`${colors.header} text-white px-4 py-3 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium opacity-75 uppercase tracking-wider">
              {side === 'A' ? 'Capital One' : 'Discover'}
            </div>
            <div className="text-sm font-semibold mt-0.5">
              {side === 'A' ? 'Issuer Data' : 'Bank & Network Data'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-75">Tables</div>
            <div className="text-lg font-bold">{tables.length}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin border border-t-0 border-slate-200 rounded-b-xl bg-white divide-y divide-slate-100">
        {tables.map(table => {
          const isExpanded = expandedTable === table.id
          const hasHighlight = table.fields.some(f => highlightedFields.has(`${table.id}.${f.name}`))
          const joinFieldCount = table.fields.filter(f => f.joinKey).length
          const tab = activeTab[table.id] ?? 'schema'
          const showPreview = isExpanded && tab === 'data' && previewTable === table.id

          return (
            <div key={table.id} className={hasHighlight ? 'bg-amber-50/40' : ''}>
              {/* Table row header */}
              <button
                onClick={() => toggleTable(table.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className={`transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-semibold text-slate-800 truncate block">{table.label}</span>
                  <span className="text-xs text-slate-400 truncate block mt-0.5">{table.description}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {joinFieldCount > 0 && (
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      {joinFieldCount} join{joinFieldCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                    {formatCount(table.recordCount)}
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3">
                  {/* Schema / Data tabs */}
                  <div className="flex gap-0 mb-2 border border-slate-200 rounded-lg overflow-hidden w-fit">
                    <button
                      onClick={() => handleSchemaTab(table.id)}
                      className={`text-[11px] font-medium px-3 py-1.5 transition-colors ${tab === 'schema' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Schema
                    </button>
                    <button
                      onClick={() => handleDataTab(table.id)}
                      className={`text-[11px] font-medium px-3 py-1.5 transition-colors ${tab === 'data' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {loadingData && previewTable === table.id ? 'Loading…' : 'Data'}
                    </button>
                  </div>

                  {/* Schema view */}
                  {tab === 'schema' && (
                    <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 border-b border-slate-200 bg-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Field</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tag</span>
                      </div>
                      {table.fields.map(field => {
                        const key = `${table.id}.${field.name}`
                        const isHighlighted = highlightedFields.has(key)
                        const tc = TAG_COLORS[field.tag]
                        return (
                          <div
                            key={field.name}
                            title={field.description}
                            className={[
                              'grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-1.5 border-b border-slate-100 last:border-0 transition-colors cursor-default',
                              isHighlighted ? 'bg-amber-100/70' : 'hover:bg-white',
                            ].join(' ')}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {field.joinKey && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                              )}
                              <span className="font-mono text-[11px] text-slate-700 truncate">{field.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">{field.type}</span>
                            <span className={`text-[9px] font-semibold ${tc.bg} ${tc.text} px-1.5 py-0.5 rounded shrink-0`}>
                              {tc.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Data preview */}
                  {showPreview && (
                    data
                      ? <DataPreview table={table} data={data} />
                      : (
                        <div className="mt-2 flex items-center justify-center py-8 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            Generating data…
                          </div>
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
