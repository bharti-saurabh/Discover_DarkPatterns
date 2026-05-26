import { useState, useEffect, useRef } from 'react'
import {
  CORRIDOR_CASES, CONTROLLER_CASES, FRONT_BUSINESS_CASES,
  FINCEN_CATEGORIES,
} from '../../data/darkPatternsData'
import {
  AGENTS, findingsForCase, hitCasesForAgent,
  type AgentFinding,
} from '../../data/agentData'

// ── Types ──────────────────────────────────────────────────────────────────────

type EntityType = 'cardholder' | 'merchant' | 'controller'

interface CaseEntry {
  id: string
  entityType: EntityType
  label: string
  sub: string
  riskScore: number
  flaggedCategories: string[]
}

// ── Derived case list ──────────────────────────────────────────────────────────

const ALL_CASES: CaseEntry[] = [
  ...CORRIDOR_CASES.map(c => ({
    id: c.id, entityType: 'cardholder' as const,
    label: c.cardholderIdA, sub: c.corridorLabel,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
  })),
  ...CONTROLLER_CASES.map(c => ({
    id: c.id, entityType: 'controller' as const,
    label: `Controller · ${c.accounts.length} accounts`, sub: `${c.accounts.length} accounts · ${c.totalCashOut.toLocaleString()} cash-out`,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
  })),
  ...FRONT_BUSINESS_CASES.map(c => ({
    id: c.id, entityType: 'merchant' as const,
    label: c.merchantName, sub: `${c.city}, ${c.state} · MCC ${c.mcc}`,
    riskScore: c.riskScore, flaggedCategories: c.flaggedCategories,
  })),
]

function getCaseData(id: string) {
  return (
    CORRIDOR_CASES.find(c => c.id === id) ||
    CONTROLLER_CASES.find(c => c.id === id) ||
    FRONT_BUSINESS_CASES.find(c => c.id === id) ||
    null
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-red-600' : score >= 80 ? 'bg-orange-500' : 'bg-amber-500'
  return (
    <span className={`${color} text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono`}>
      {score}
    </span>
  )
}

function PulseDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  )
}

// ── Agent Monitor (left panel) ─────────────────────────────────────────────────

function AgentMonitor({
  selectedCaseId,
  onSelectCase,
}: {
  selectedCaseId: string | null
  onSelectCase: (id: string) => void
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>('mcc')

  function toggleAgent(id: string) {
    setExpandedAgent(prev => prev === id ? null : id)
  }

  const entityTypeLabel: Record<EntityType, string> = {
    cardholder: 'Cardholder',
    merchant: 'Merchant',
    controller: 'Controller',
  }

  return (
    <div className="w-[210px] shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <PulseDot />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agent Monitor</span>
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5">Continuously scanning · 7 agents active</div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {AGENTS.map(agent => {
          const hitCases = hitCasesForAgent(agent.id)
          const isExpanded = expandedAgent === agent.id
          const hasHits = hitCases.length > 0

          return (
            <div key={agent.id} className="border-b border-slate-100">
              <button
                onClick={() => toggleAgent(agent.id)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <PulseDot color={hasHits ? 'bg-emerald-500' : 'bg-slate-300'} />
                    <span className="text-[10px] font-semibold text-slate-800 truncate">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasHits && (
                      <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                        {hitCases.length}
                      </span>
                    )}
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] font-bold text-indigo-500 font-mono">{agent.htRule}</span>
                  <span className="text-[8px] text-slate-400">·</span>
                  <span className="text-[8px] text-slate-400 truncate">{agent.scanCount} {agent.scanLabel}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {hitCases.length === 0 ? (
                    <div className="px-4 py-2 text-[8px] text-slate-400 italic">No hits detected</div>
                  ) : (
                    hitCases.map(caseId => {
                      const entry = ALL_CASES.find(c => c.id === caseId)
                      if (!entry) return null
                      const isSelected = selectedCaseId === caseId
                      return (
                        <button
                          key={caseId}
                          onClick={() => onSelectCase(caseId)}
                          className={`w-full text-left px-4 py-2 transition-colors border-b border-slate-100 last:border-0 ${
                            isSelected ? 'bg-red-50' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9px] font-bold font-mono ${isSelected ? 'text-red-700' : 'text-slate-700'}`}>
                              {caseId}
                            </span>
                            <RiskBadge score={entry.riskScore} />
                          </div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{entityTypeLabel[entry.entityType]}</div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
        <div className="text-[8px] text-slate-400">Last full scan</div>
        <div className="text-[8px] font-mono text-slate-600">2024-11-15 00:31 UTC</div>
      </div>
    </div>
  )
}

// ── Case Detail (center panel) ─────────────────────────────────────────────────

function CaseDetail({ caseId }: { caseId: string }) {
  const entry = ALL_CASES.find(c => c.id === caseId)!
  const data = getCaseData(caseId)!

  const capOneSignal = (data as any).capOneSignal as string
  const discoverSignal = (data as any).discoverSignal as string
  const combinedInsight = (data as any).combinedInsight as string

  const findings = findingsForCase(caseId)
  const strategist = findings.find(f => f.agentId === 'strategist')
  const nonStrategist = findings.filter(f => f.agentId !== 'strategist')

  return (
    <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4 space-y-4">

      {/* Entity header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {entry.entityType === 'cardholder' ? 'Cardholder' : entry.entityType === 'merchant' ? 'Merchant' : 'Controller Network'}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-500">{caseId}</span>
            </div>
            <div className="text-base font-bold text-slate-900">{entry.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{entry.sub}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[8px] text-slate-400 mb-1">Risk Score</div>
            <div className={`text-2xl font-bold font-mono ${entry.riskScore >= 90 ? 'text-red-600' : 'text-orange-500'}`}>
              {entry.riskScore}
            </div>
          </div>
        </div>

        {/* FinCEN categories */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {entry.flaggedCategories.map(catId => {
            const cat = FINCEN_CATEGORIES[catId]
            return (
              <span key={catId} className="text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                {catId} · {cat?.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Agent signal summary */}
      {nonStrategist.length > 0 && (
        <div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Signals</div>
          <div className="grid grid-cols-2 gap-2">
            {nonStrategist.map(f => {
              const agent = AGENTS.find(a => a.id === f.agentId)!
              return (
                <div key={f.agentId} className={`border rounded-xl p-3 ${
                  f.verdict === 'FLAGGED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold text-indigo-600 font-mono">{agent.htRule}</span>
                      <span className={`text-[9px] font-semibold ${f.verdict === 'FLAGGED' ? 'text-red-700' : 'text-amber-700'}`}>
                        {agent.name}
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      f.verdict === 'FLAGGED' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                    }`}>{f.verdict}</span>
                  </div>
                  <p className="text-[9px] text-slate-700 leading-snug">{f.finding}</p>
                  <div className="text-[8px] text-slate-400 mt-1.5 font-mono">{f.confidence}% confidence</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Combined insight */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <div className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5">Institution A Signal</div>
          <p className="text-[9px] text-indigo-900 leading-relaxed">{capOneSignal}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
          <div className="text-[8px] font-bold text-violet-600 uppercase tracking-wider mb-1.5">Institution B Signal</div>
          <p className="text-[9px] text-violet-900 leading-relaxed">{discoverSignal}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3">
          <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Combined Insight</div>
          <p className="text-[9px] text-slate-200 leading-relaxed">{combinedInsight}</p>
        </div>
      </div>

      {/* Strategist verdict */}
      {strategist && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PulseDot color="bg-red-500" />
            <span className="text-[10px] font-bold text-white">Case Strategist Verdict</span>
            <span className="ml-auto text-[8px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
              {strategist.verdict}
            </span>
          </div>
          <p className="text-[10px] text-slate-200 leading-relaxed">{strategist.finding}</p>
          <div className="text-[8px] text-slate-400 mt-2 font-mono">{strategist.confidence}% confidence</div>
        </div>
      )}
    </div>
  )
}

// ── Agent Reasoning Panel (right) ─────────────────────────────────────────────

function CoTStepRow({ step, delay }: { step: AgentFinding['steps'][number]; delay: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return <div className="h-6" />

  return (
    <div className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
      <span className={`shrink-0 mt-0.5 w-3 h-3 rounded-full flex items-center justify-center ${
        step.triggered ? 'bg-red-500' : 'bg-slate-600'
      }`}>
        {step.triggered
          ? <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        }
      </span>
      <div className="min-w-0">
        <div className="text-[8px] text-slate-400 leading-tight">{step.text}</div>
        {step.metric && (
          <div className={`text-[9px] font-mono font-semibold leading-tight mt-0.5 ${step.triggered ? 'text-red-400' : 'text-slate-500'}`}>
            → {step.metric}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentReasoningPanel({ caseId }: { caseId: string }) {
  const findings = findingsForCase(caseId).filter(f => f.agentId !== 'strategist')
  const strategist = findingsForCase(caseId).find(f => f.agentId === 'strategist')
  const panelRef = useRef<HTMLDivElement>(null)

  // Reset scroll on case change
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [caseId])

  let globalDelay = 0

  return (
    <div
      ref={panelRef}
      className="w-[250px] shrink-0 border-l border-slate-200 bg-slate-950 overflow-y-auto"
    >
      <div className="px-3 py-2.5 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
        <div className="flex items-center gap-1.5">
          <PulseDot color="bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Agent Reasoning</span>
        </div>
        <div className="text-[8px] text-slate-500 mt-0.5">{caseId} · {findings.length + (strategist ? 1 : 0)} agents</div>
      </div>

      <div className="p-3 space-y-4">
        {findings.map(f => {
          const agent = AGENTS.find(a => a.id === f.agentId)!
          const agentDelay = globalDelay
          globalDelay += f.steps.length * 250 + 400

          return (
            <div key={f.agentId}>
              {/* Agent header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[8px] font-bold font-mono text-indigo-400">{agent.htRule}</span>
                <span className="text-[9px] font-semibold text-slate-300">{agent.name}</span>
                <span className={`ml-auto text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                  f.verdict === 'FLAGGED' ? 'bg-red-900 text-red-400' : 'bg-amber-900 text-amber-400'
                }`}>{f.verdict}</span>
              </div>

              {/* CoT steps */}
              <div className="space-y-1.5 pl-1">
                {f.steps.map((step, i) => (
                  <CoTStepRow
                    key={i}
                    step={step}
                    delay={agentDelay + i * 280}
                  />
                ))}
              </div>

              {/* Finding */}
              <div className="mt-2 pl-1 border-l-2 border-indigo-700">
                <p className="text-[8px] text-slate-300 leading-snug pl-1.5 italic">{f.finding}</p>
              </div>
            </div>
          )
        })}

        {/* Strategist */}
        {strategist && (() => {
          const stratDelay = globalDelay
          return (
            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <PulseDot color="bg-red-500" />
                <span className="text-[9px] font-semibold text-white">Case Strategist</span>
                <span className="ml-auto text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-red-900 text-red-400">
                  {strategist.verdict}
                </span>
              </div>
              <div className="space-y-1.5 pl-1">
                {strategist.steps.map((step, i) => (
                  <CoTStepRow key={i} step={step} delay={stratDelay + i * 280} />
                ))}
              </div>
              <div className="mt-2 pl-1 border-l-2 border-red-700">
                <p className="text-[8px] text-red-300 leading-snug pl-1.5 italic font-semibold">{strategist.finding}</p>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <div className="text-sm font-semibold text-slate-700 mb-1">Select a case to investigate</div>
      <div className="text-[10px] text-slate-400 max-w-48 leading-relaxed">
        Expand an agent on the left to see detected cases, then click one to view the full evidence and reasoning chain.
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DarkPatterns() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  function handleSelectCase(id: string) {
    // Reset then re-select to trigger animation replay
    setSelectedCaseId(null)
    requestAnimationFrame(() => setSelectedCaseId(id))
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Agent Monitor */}
      <AgentMonitor
        selectedCaseId={selectedCaseId}
        onSelectCase={handleSelectCase}
      />

      {/* Center: Case Detail or empty */}
      {selectedCaseId
        ? <CaseDetail key={selectedCaseId} caseId={selectedCaseId} />
        : <EmptyState />
      }

      {/* Right: Agent Reasoning — slides in when case selected */}
      {selectedCaseId && (
        <AgentReasoningPanel key={selectedCaseId} caseId={selectedCaseId} />
      )}
    </div>
  )
}
