import { useState } from 'react'
import StatBar from './StatBar'
import SchemaPanel from './SchemaPanel'
import JoinKeyPanel from './JoinKeyPanel'
import ERDiagram from './ERDiagram'
import { CAP_SCHEMA, DISC_SCHEMA } from './schemaConfig'
import { useGeneratedData } from '../../data/useGeneratedData'

type Tab = 'schema' | 'er'

export default function DataHub() {
  const [tab, setTab] = useState<Tab>('schema')
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set())
  const [activeJoinKey, setActiveJoinKey] = useState<string | null>(null)
  const { data, loading, load } = useGeneratedData()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="px-8 pt-6 pb-0 shrink-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore both institutions' schemas, preview synthetic data, and trace cross-institution join paths.
            </p>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {([
              { id: 'schema', label: 'Schema Explorer' },
              { id: 'er',     label: 'ER Diagram' },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-sm font-medium px-4 py-1.5 rounded-md transition-colors ${
                  tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <StatBar />

        {/* Legend — schema tab only */}
        {tab === 'schema' && (
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-xs font-medium text-slate-500">Field tags:</span>
            {[
              { label: 'PII',   bg: 'bg-rose-50',    text: 'text-rose-700' },
              { label: 'ID',    bg: 'bg-indigo-50',  text: 'text-indigo-700' },
              { label: 'FIN',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: 'RISK',  bg: 'bg-amber-50',   text: 'text-amber-700' },
              { label: 'BEHAV', bg: 'bg-purple-50',  text: 'text-purple-700' },
              { label: 'NET',   bg: 'bg-sky-50',     text: 'text-sky-700' },
              { label: 'TIME',  bg: 'bg-slate-100',  text: 'text-slate-600' },
            ].map(t => (
              <span key={t.label} className={`text-[10px] font-semibold ${t.bg} ${t.text} px-2 py-0.5 rounded`}>{t.label}</span>
            ))}
            <span className="text-slate-300 mx-1">|</span>
            <span className="flex items-center gap-1 text-[11px] text-amber-600">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Join key field
            </span>
            <span className="text-slate-300 mx-1">|</span>
            <span className="text-[11px] text-slate-400">Click a table → Schema / Data tabs to preview rows</span>
          </div>
        )}
      </div>

      {/* Schema Explorer */}
      {tab === 'schema' && (
        <div className="flex-1 overflow-hidden px-8 pb-6">
          <div className="grid grid-cols-[1fr_260px_1fr] gap-5 h-full">
            <div className="flex flex-col min-h-0 overflow-hidden">
              <SchemaPanel
                tables={CAP_SCHEMA}
                side="A"
                highlightedFields={highlightedFields}
                onTableSelect={() => {}}
                data={data}
                loadingData={loading}
                onRequestData={load}
              />
            </div>
            <div className="flex flex-col min-h-0 overflow-hidden">
              <JoinKeyPanel
                onHighlight={setHighlightedFields}
                activeJoinKey={activeJoinKey}
                onJoinKeySelect={setActiveJoinKey}
              />
            </div>
            <div className="flex flex-col min-h-0 overflow-hidden">
              <SchemaPanel
                tables={DISC_SCHEMA}
                side="B"
                highlightedFields={highlightedFields}
                onTableSelect={() => {}}
                data={data}
                loadingData={loading}
                onRequestData={load}
              />
            </div>
          </div>
        </div>
      )}

      {/* ER Diagram */}
      {tab === 'er' && (
        <div className="flex-1 overflow-hidden px-8 pb-6">
          <div className="h-full rounded-xl border border-slate-200 overflow-hidden">
            <ERDiagram />
          </div>
        </div>
      )}
    </div>
  )
}
