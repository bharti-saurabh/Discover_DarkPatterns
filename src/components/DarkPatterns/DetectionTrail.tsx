import { useState } from 'react'
import type { DetectionStep } from '../../data/darkPatternsData'

const SOURCE_CONFIG = {
  capone:   { label: 'Cap One',  bg: 'bg-blue-100', text: 'text-blue-900', dot: 'bg-blue-600' },
  discover: { label: 'Discover', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  combined: { label: 'Combined', bg: 'bg-slate-700',  text: 'text-slate-200',  dot: 'bg-slate-400' },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 95 ? 'bg-blue-600' : value >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function DetectionTrail({ steps }: { steps: DetectionStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const alertStep = steps.find(s => s.isAlert)

  return (
    <div className="bg-slate-950 rounded-xl p-4 mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 text-left"
      >
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse [animation-delay:0.4s]" />
        </div>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Agent Detection Trail</span>
        <span className="text-[10px] text-slate-500 ml-1">{steps.length} steps</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`ml-auto shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Collapsed: show alert outcome only */}
      {!expanded && alertStep && (
        <div className="mt-3 bg-red-950 border border-red-800 rounded-lg p-3 flex items-start gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                Alert Generated
              </span>
              <span className="text-[10px] text-red-400">Confidence: {alertStep.confidence}%</span>
              <span className="text-[10px] text-slate-600 ml-auto font-mono">{alertStep.timestamp.split(' ')[1]}</span>
            </div>
            <p className="text-[11px] text-red-200 leading-relaxed line-clamp-2">{alertStep.finding}</p>
          </div>
        </div>
      )}

      {/* Expanded: full timeline */}
      {expanded && (
        <div className="relative mt-4">
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-700" />
          <div className="space-y-0">
            {steps.map((step, i) => {
              const src = SOURCE_CONFIG[step.source]
              return (
                <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.isAlert
                      ? 'bg-red-600 border-2 border-red-400'
                      : 'bg-slate-800 border border-slate-600'
                  }`}>
                    {step.isAlert ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
                    )}
                  </div>
                  <div className={`flex-1 rounded-lg p-3 ${step.isAlert ? 'bg-red-950 border border-red-800' : 'bg-slate-900 border border-slate-800'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-[11px] font-bold ${step.isAlert ? 'text-red-300' : 'text-slate-200'}`}>
                        {step.agent}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${src.bg} ${src.text}`}>
                          {src.label}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">{step.timestamp.split(' ')[1]}</span>
                      </div>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${step.isAlert ? 'text-red-200' : 'text-slate-400'}`}>
                      {step.finding}
                    </p>
                    {!step.isAlert && <ConfidenceBar value={step.confidence} />}
                    {step.isAlert && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                          Alert Generated
                        </span>
                        <span className="text-[9px] text-red-400">Confidence: {step.confidence}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
