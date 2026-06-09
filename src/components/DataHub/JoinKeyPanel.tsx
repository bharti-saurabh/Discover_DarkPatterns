import { useState } from 'react'
import type { JoinKey } from './schemaConfig'
import { JOIN_KEYS } from './schemaConfig'

type Category = 'hard' | 'soft' | 'behavioral'

interface Props {
  onHighlight: (fields: Set<string>) => void
  activeJoinKey: string | null
  onJoinKeySelect: (id: string | null) => void
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; dot: string; desc: string }> = {
  hard:       { label: 'Hard Joins', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', desc: 'Deterministic — same value on both sides' },
  soft:       { label: 'Soft Joins', color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   desc: 'Fuzzy — probabilistic match signals' },
  behavioral: { label: 'Behavioral', color: 'bg-rose-100 text-rose-700 border-rose-200',           dot: 'bg-rose-500',    desc: 'Pattern-matched — no shared field' },
}

function ConfidenceBar({ value, category }: { value: number; category: Category }) {
  const colors = { hard: 'bg-emerald-500', soft: 'bg-amber-500', behavioral: 'bg-rose-500' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${colors[category]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function JoinKeyPanel({ onHighlight, activeJoinKey, onJoinKeySelect }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('hard')

  const filtered = JOIN_KEYS.filter(k => k.category === activeCategory)

  function selectKey(key: JoinKey | null) {
    if (!key) {
      onJoinKeySelect(null)
      onHighlight(new Set())
      return
    }
    const newActive = key.id === activeJoinKey ? null : key.id
    onJoinKeySelect(newActive)
    if (newActive) {
      onHighlight(new Set([
        `${key.leftTable}.${key.leftField}`,
        `${key.rightTable}.${key.rightField}`,
      ]))
    } else {
      onHighlight(new Set())
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 rounded-t-xl">
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider">Join Keys</span>
        </div>
        <p className="text-xs text-slate-400">Click a key to highlight the linked fields in both schemas</p>
      </div>

      {/* Category tabs */}
      <div className="flex border-x border-slate-200 bg-slate-50">
        {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat]
          const count = JOIN_KEYS.filter(k => k.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); selectKey(null) }}
              className={[
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
                activeCategory === cat
                  ? 'border-slate-800 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${cfg.dot}`}></span>
              {cfg.label}
              <span className="ml-1 text-slate-400">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Category description */}
      <div className="px-4 py-2 bg-slate-50 border-x border-slate-200">
        <p className="text-[11px] text-slate-500 italic">{CATEGORY_CONFIG[activeCategory].desc}</p>
      </div>

      {/* Join key cards */}
      <div className="flex-1 overflow-y-auto scrollbar-thin border border-t-0 border-slate-200 rounded-b-xl bg-white divide-y divide-slate-100">
        {filtered.map(key => {
          const isActive = key.id === activeJoinKey
          return (
            <button
              key={key.id}
              onClick={() => selectKey(key)}
              className={[
                'w-full text-left px-4 py-3 transition-colors hover:bg-slate-50',
                isActive ? 'bg-slate-800 text-white hover:bg-slate-700' : '',
              ].join(' ')}
            >
              {/* Signal name */}
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {key.signal}
                </span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                  isActive ? 'bg-white/20 text-white border-white/30' : CATEGORY_CONFIG[key.category].color
                }`}>
                  {key.category}
                </span>
              </div>

              {/* Field path */}
              <div className={`flex items-center gap-1.5 font-mono text-[10px] mb-2 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded truncate max-w-[35%]">
                  {key.leftTable.replace('cap_','').replace('disc_','')}
                  <span className="opacity-60">.</span>
                  {key.leftField}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
                </svg>
                <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded truncate max-w-[35%]">
                  {key.rightTable.replace('cap_','').replace('disc_','')}
                  <span className="opacity-60">.</span>
                  {key.rightField}
                </span>
              </div>

              {/* Confidence bar */}
              <ConfidenceBar value={key.confidence} category={key.category} />

              {/* Description — shown when active */}
              {isActive && (
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{key.description}</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
