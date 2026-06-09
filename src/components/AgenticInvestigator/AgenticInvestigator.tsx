import { useState, useRef, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import {
  AGENT_CASES, AGENT_CONFIGS,
  buildPhase1Prompt, buildStrategistPrompt,
  type AgentCase, type AgentConfig,
} from '../../data/agentCases'
import { useApiConfig, type ApiConfig } from '../../hooks/useApiConfig'

type AgentId = 'evidence' | 'patterns' | 'network' | 'strategy'
type AgentStatus = 'idle' | 'waiting' | 'running' | 'done' | 'error'
type Mode = 'brief' | 'investigating'

const TYPE_COLORS: Record<string, string> = {
  'bust-out':           'bg-red-100 text-red-700 border-red-200',
  'synthetic-identity': 'bg-purple-100 text-purple-700 border-purple-200',
  'refund-fraud':       'bg-orange-100 text-orange-700 border-orange-200',
  'structuring':        'bg-blue-100 text-blue-700 border-blue-200',
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtElapsed(startMs: number, endMs?: number): string {
  const elapsed = Math.floor(((endMs ?? Date.now()) - startMs) / 1000)
  if (elapsed <= 0) return '0s'
  const m = Math.floor(elapsed / 60)
  return m > 0 ? `${m}m ${elapsed % 60}s` : `${elapsed}s`
}

// ── Left sidebar ──────────────────────────────────────────────────────────────

function CaseSidebar({ cases, selectedId, onSelect, disabled }: {
  cases: AgentCase[]; selectedId: string; onSelect: (id: string) => void; disabled: boolean
}) {
  return (
    <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investigation Cases</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cases.map(c => (
          <button
            key={c.id}
            onClick={() => !disabled && onSelect(c.id)}
            disabled={disabled}
            className={`w-full text-left rounded-lg border p-3 transition-all ${
              selectedId === c.id
                ? 'bg-slate-800 border-slate-700'
                : disabled
                  ? 'bg-white border-slate-200 opacity-40 cursor-not-allowed'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-mono text-[10px] font-semibold ${selectedId === c.id ? 'text-slate-400' : 'text-slate-400'}`}>{c.id}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                c.riskLevel === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}>{c.riskLevel.toUpperCase()}</span>
            </div>
            <div className={`text-xs font-bold mb-1 ${selectedId === c.id ? 'text-white' : 'text-slate-800'}`}>{c.title}</div>
            <div className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border inline-block mb-1.5 ${
              selectedId === c.id ? 'bg-slate-700 border-slate-600 text-slate-300' : TYPE_COLORS[c.type]
            }`}>{c.typeLabel}</div>
            <div className={`flex gap-2 text-[9px] ${selectedId === c.id ? 'text-slate-400' : 'text-slate-400'}`}>
              <span>{c.entities.accounts} accounts</span>
              <span className={`font-semibold ${selectedId === c.id ? 'text-amber-400' : 'text-amber-600'}`}>{fmt$(c.entities.estimatedExposure)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── API config panel ──────────────────────────────────────────────────────────

const MODELS = [
  { id: 'claude-opus-4-7',   label: 'Claude Opus 4.7  (best quality)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6  (faster)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5  (fastest)' },
]

function ApiConfigPanel({ current, onSave }: { current: ApiConfig; onSave: (c: ApiConfig) => void }) {
  const [apiKey,  setApiKey]  = useState(current.apiKey)
  const [baseUrl, setBaseUrl] = useState(current.baseUrl)
  const [model,   setModel]   = useState(current.model)
  const [visible, setVisible] = useState(false)
  const canSave = apiKey.trim().length > 10

  function handleSave() {
    onSave({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model })
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setVisible(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
          </svg>
          <span className="text-xs font-semibold text-slate-700">API Configuration</span>
          {current.apiKey.length > 10
            ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Configured ✓</span>
            : <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Not configured</span>
          }
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-slate-400 transition-transform ${visible ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {visible && (
        <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-… or your proxy JWT token"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Base URL <span className="text-slate-400 font-normal">(optional — leave blank for api.anthropic.com)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://llmfoundry.straive.com/anthropic"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-400">Saved to browser localStorage — never sent to any server other than the API endpoint above.</p>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ml-4 ${
                canSave ? 'bg-blue-800 text-white hover:bg-blue-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Case brief (pre-launch) ───────────────────────────────────────────────────

function CaseBriefView({ c, onLaunch, hasKey, apiConfig, onSaveConfig }: {
  c: AgentCase; onLaunch: () => void; hasKey: boolean
  apiConfig: ApiConfig; onSaveConfig: (c: ApiConfig) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Case file header */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs text-slate-500">{c.id}</span>
                <span className="text-slate-600">·</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TYPE_COLORS[c.type]}`}>{c.typeLabel}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{c.title}</h2>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ml-4 ${
              c.riskLevel === 'critical' ? 'bg-red-600' : 'bg-amber-500'
            } text-white`}>
              {c.riskLevel.toUpperCase()} RISK
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{c.summary}</p>
        </div>
        {/* Entity metrics */}
        <div className="grid grid-cols-4 border-t border-slate-800">
          {[
            { label: 'Flagged Accounts', value: c.entities.accounts },
            { label: 'Merchants Involved', value: c.entities.merchants },
            { label: 'Shared Devices', value: c.entities.devices },
            { label: 'Est. Exposure', value: fmt$(c.entities.estimatedExposure), highlight: true },
          ].map((m, i) => (
            <div key={m.label} className={`px-4 py-3 ${i < 3 ? 'border-r border-slate-800' : ''}`}>
              <div className="text-[10px] text-slate-500 mb-0.5">{m.label}</div>
              <div className={`text-lg font-bold ${m.highlight ? 'text-amber-400' : 'text-white'}`}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data source columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-800 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-200" />
            <span className="text-xs font-bold text-white">Capital One — Issuer Data</span>
          </div>
          <pre className="p-4 text-[10px] text-blue-950 leading-relaxed font-mono bg-blue-50 whitespace-pre-wrap overflow-x-auto">
            {c.caponeContext}
          </pre>
        </div>
        <div className="border border-violet-200 rounded-xl overflow-hidden">
          <div className="bg-violet-600 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-200" />
            <span className="text-xs font-bold text-white">Discover — Network Data</span>
          </div>
          <pre className="p-4 text-[10px] text-violet-900 leading-relaxed font-mono bg-violet-50 whitespace-pre-wrap overflow-x-auto">
            {c.discoverContext}
          </pre>
        </div>
      </div>

      {/* Agent info */}
      <div className="grid grid-cols-4 gap-3">
        {AGENT_CONFIGS.map(a => (
          <div key={a.id} className={`rounded-lg border ${a.color.border} ${a.color.bg} p-3`}>
            <div className={`text-[10px] font-bold ${a.color.text} mb-0.5`}>
              {a.phase === 2 ? '⬡ ' : '◎ '}{a.title}
            </div>
            <div className={`text-[9px] ${a.color.text} opacity-70`}>{a.role}</div>
          </div>
        ))}
      </div>

      <ApiConfigPanel current={apiConfig} onSave={onSaveConfig} />

      <button
        onClick={onLaunch}
        disabled={!hasKey}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          hasKey
            ? 'bg-blue-800 hover:bg-blue-900 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Launch 4-Agent Investigation
      </button>
    </div>
  )
}

// ── Agent card (during investigation) ────────────────────────────────────────

function AgentCard({ config, status, output, startMs, endMs, tick }: {
  config: AgentConfig; status: AgentStatus; output: string
  startMs?: number; endMs?: number; tick: number
}) {
  const c = config.color
  void tick // used by parent to trigger re-render for elapsed timer

  return (
    <div className={`rounded-xl border-2 ${c.border} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className={`${c.header} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {status === 'running' && <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />}
          {status === 'done'    && <span className="text-white text-xs shrink-0">✓</span>}
          {status === 'waiting' && <span className="w-2 h-2 rounded-full bg-white/30 shrink-0" />}
          <span className="text-white text-xs font-bold">{config.title}</span>
        </div>
        <div className="text-white/60 text-[10px] font-mono">
          {status === 'running' && startMs ? fmtElapsed(startMs) : null}
          {status === 'done' && startMs ? fmtElapsed(startMs, endMs) : null}
          {status === 'waiting' ? 'queued' : null}
        </div>
      </div>
      {/* Role strip */}
      <div className={`${c.bg} ${c.text} px-3 py-1 text-[9px] font-semibold border-b ${c.border}`}>
        {config.role}
      </div>
      {/* Body */}
      <div className={`flex-1 ${c.bg} p-3 overflow-y-auto`} style={{ minHeight: 140, maxHeight: 260 }}>
        {status === 'waiting' && (
          <div className="flex items-center gap-2 mt-2">
            {[0,1,2].map(i => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-','bg-')} opacity-40 animate-bounce`}
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
            <span className={`text-[10px] ${c.text} opacity-60`}>Waiting for Phase 1…</span>
          </div>
        )}
        {(status === 'running' || status === 'done') && (
          <p className={`text-[11px] leading-relaxed whitespace-pre-wrap ${c.text}`}>
            {output || <span className="opacity-40">Analyzing…</span>}
            {status === 'running' && <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Pipeline status bar ───────────────────────────────────────────────────────

function PipelineBar({ statuses }: { statuses: Record<AgentId, AgentStatus> }) {
  const steps: { id: AgentId; label: string; phase: 1 | 2 }[] = [
    { id: 'evidence', label: 'Evidence', phase: 1 },
    { id: 'patterns', label: 'Patterns', phase: 1 },
    { id: 'network',  label: 'Network',  phase: 1 },
    { id: 'strategy', label: 'Strategist', phase: 2 },
  ]
  const phase1Done = (['evidence', 'patterns', 'network'] as AgentId[]).every(id => statuses[id] === 'done')

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4 flex-wrap">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pipeline</span>
      {steps.map((step, i) => {
        const s = statuses[step.id]
        const config = AGENT_CONFIGS.find(a => a.id === step.id)!
        const isDone = s === 'done'
        const isRunning = s === 'running'
        const c = config.color
        return (
          <div key={step.id} className="flex items-center gap-1.5">
            {i === 3 && (
              <div className={`flex items-center gap-1 transition-colors ${phase1Done ? 'text-slate-400' : 'text-slate-200'}`}>
                <div className="w-8 h-px bg-current" />
                <span className="text-[8px]">▶</span>
              </div>
            )}
            {i > 0 && i < 3 && <div className="w-4 h-px bg-slate-200" />}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              isDone    ? 'bg-white border-slate-300 text-slate-600' :
              isRunning ? `${c.header} text-white border-transparent` :
                          'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />}
              {isDone    && <span className="text-emerald-500 text-[10px] shrink-0">✓</span>}
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Handoff divider ───────────────────────────────────────────────────────────

function HandoffDivider({ phase1Done }: { phase1Done: boolean }) {
  return (
    <div className={`flex items-center gap-3 my-4 transition-opacity duration-700 ${phase1Done ? 'opacity-100' : 'opacity-30'}`}>
      <div className="flex-1 h-px bg-slate-300" />
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold transition-colors ${
        phase1Done ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'
      }`}>
        {phase1Done ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Findings handed off → Case Strategist
          </>
        ) : (
          'Phase 2 synthesis pending…'
        )}
      </div>
      <div className="flex-1 h-px bg-slate-300" />
    </div>
  )
}

// ── Investigation brief ───────────────────────────────────────────────────────

function InvestigationBrief({ output, c }: { output: string; c: AgentCase }) {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="bg-red-700 px-5 py-3 flex items-center gap-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span className="text-sm font-bold text-white">Investigation Brief</span>
        <span className="text-white/50 text-xs font-mono">{c.id} · {c.title}</span>
        <span className="ml-auto text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wide">
          Case Strategist · Final Output
        </span>
      </div>
      <div className="p-5">
        <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{output}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const INIT_STATUS: Record<AgentId, AgentStatus> = {
  evidence: 'idle', patterns: 'idle', network: 'idle', strategy: 'idle',
}

export default function AgenticInvestigator() {
  const [selectedId, setSelectedId] = useState(AGENT_CASES[0].id)
  const [mode, setMode] = useState<Mode>('brief')
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, AgentStatus>>({ ...INIT_STATUS })
  const [outputs, setOutputs] = useState<Record<AgentId, string>>({
    evidence: '', patterns: '', network: '', strategy: '',
  })
  const [startMs, setStartMs] = useState<Partial<Record<AgentId, number>>>({})
  const [endMs, setEndMs] = useState<Partial<Record<AgentId, number>>>({})
  const [tick, setTick] = useState(0)

  const abortRef = useRef(false)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const { config: apiConfig, save: saveApiConfig, isConfigured: hasKey } = useApiConfig()

  const selectedCase = AGENT_CASES.find(c => c.id === selectedId)!

  // Tick timer for elapsed display
  useEffect(() => {
    const anyRunning = Object.values(agentStatus).some(s => s === 'running')
    if (anyRunning) {
      tickTimer.current = setInterval(() => setTick(t => t + 1), 1000)
    } else {
      if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null }
    }
    return () => { if (tickTimer.current) clearInterval(tickTimer.current) }
  }, [agentStatus])

  function resetAll() {
    setAgentStatus({ ...INIT_STATUS })
    setOutputs({ evidence: '', patterns: '', network: '', strategy: '' })
    setStartMs({})
    setEndMs({})
  }

  async function streamAgent(
    client: Anthropic,
    config: AgentConfig,
    prompt: string,
  ): Promise<string> {
    const now = Date.now()
    setStartMs(prev => ({ ...prev, [config.id]: now }))
    setAgentStatus(prev => ({ ...prev, [config.id]: 'running' }))

    let full = ''
    try {
      const stream = client.messages.stream({
        model: apiConfig.model,
        max_tokens: config.id === 'strategy' ? 1000 : 750,
        system: config.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })
      for await (const event of stream) {
        if (abortRef.current) break
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text
          const captured = full
          setOutputs(prev => ({ ...prev, [config.id]: captured }))
        }
      }
      setEndMs(prev => ({ ...prev, [config.id]: Date.now() }))
      setAgentStatus(prev => ({ ...prev, [config.id]: 'done' }))
    } catch (e) {
      console.error(`Agent ${config.id} error:`, e)
      setEndMs(prev => ({ ...prev, [config.id]: Date.now() }))
      setAgentStatus(prev => ({ ...prev, [config.id]: 'error' }))
    }
    return full
  }

  async function launchInvestigation() {
    if (!hasKey) return
    abortRef.current = false
    resetAll()
    setMode('investigating')

    const client = new Anthropic({
      apiKey: apiConfig.apiKey,
      baseURL: apiConfig.baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    })
    const phase1Configs = AGENT_CONFIGS.filter(a => a.phase === 1)
    const stratConfig   = AGENT_CONFIGS.find(a => a.id === 'strategy')!

    // Mark strategist as waiting immediately
    setAgentStatus(prev => ({ ...prev, strategy: 'waiting' }))

    // Phase 1: all three in parallel
    const phase1Results = await Promise.all(
      phase1Configs.map(cfg =>
        streamAgent(client, cfg, buildPhase1Prompt(cfg, selectedCase))
      )
    )

    if (abortRef.current) return

    // Brief visual pause so the handoff is noticeable
    await new Promise(r => setTimeout(r, 800))

    // Collect phase 1 text
    const findings: Record<string, string> = {}
    phase1Configs.forEach((cfg, i) => { findings[cfg.id] = phase1Results[i] })

    // Phase 2: strategist
    await streamAgent(client, stratConfig, buildStrategistPrompt(selectedCase, findings))
  }

  function handleCaseSelect(id: string) {
    setSelectedId(id)
    setMode('brief')
    resetAll()
    abortRef.current = true
  }

  const isInvestigating = mode === 'investigating'
  const phase1Done = (['evidence', 'patterns', 'network'] as AgentId[]).every(
    id => agentStatus[id] === 'done'
  )
  const stratDone = agentStatus.strategy === 'done'
  const phase1Configs = AGENT_CONFIGS.filter(a => a.phase === 1)
  const stratConfig   = AGENT_CONFIGS.find(a => a.id === 'strategy')!

  return (
    <div className="flex h-full min-h-0">
      <CaseSidebar
        cases={AGENT_CASES}
        selectedId={selectedId}
        onSelect={handleCaseSelect}
        disabled={isInvestigating}
      />

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Brief mode */}
        {mode === 'brief' && (
          <CaseBriefView
            c={selectedCase}
            onLaunch={launchInvestigation}
            hasKey={hasKey}
            apiConfig={apiConfig}
            onSaveConfig={saveApiConfig}
          />
        )}

        {/* Investigating mode */}
        {mode === 'investigating' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-0">
            {/* Compact case header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { abortRef.current = true; setMode('brief'); resetAll() }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Back to case brief"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{selectedCase.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedCase.riskLevel === 'critical' ? 'bg-red-600' : 'bg-amber-500'
                    } text-white`}>{selectedCase.riskLevel.toUpperCase()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{selectedCase.id} · {selectedCase.typeLabel}</div>
                </div>
              </div>
              {!stratDone && (
                <button
                  onClick={() => { abortRef.current = true; setMode('brief'); resetAll() }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Stop
                </button>
              )}
              {stratDone && (
                <button
                  onClick={() => { resetAll(); launchInvestigation() }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition-colors"
                >
                  Re-run
                </button>
              )}
            </div>

            {/* Pipeline status */}
            <PipelineBar statuses={agentStatus} />

            {/* Phase 1 label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase 1 — Parallel Analysis</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Phase 1 agents */}
            <div className="grid grid-cols-3 gap-3 mb-0">
              {phase1Configs.map(cfg => (
                <AgentCard
                  key={cfg.id}
                  config={cfg}
                  status={agentStatus[cfg.id]}
                  output={outputs[cfg.id]}
                  startMs={startMs[cfg.id]}
                  endMs={endMs[cfg.id]}
                  tick={tick}
                />
              ))}
            </div>

            {/* Handoff divider */}
            <HandoffDivider phase1Done={phase1Done} />

            {/* Phase 2 label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase 2 — Synthesis</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Strategist */}
            <AgentCard
              config={stratConfig}
              status={agentStatus.strategy}
              output={outputs.strategy}
              startMs={startMs.strategy}
              endMs={endMs.strategy}
              tick={tick}
            />

            {/* Investigation brief (appears when done) */}
            {stratDone && outputs.strategy && (
              <div className="mt-4">
                <InvestigationBrief output={outputs.strategy} c={selectedCase} />
              </div>
            )}

            <div className="h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
