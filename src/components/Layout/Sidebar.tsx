import { useState, type ReactNode } from 'react'
import { useApiConfig } from '../../hooks/useApiConfig'

export type Section = 'fincen-rulebook' | 'dark-patterns' | 'pig-butchering' | 'efe' | 'deepfake-fraud' | 'fraud-intelligence' | 'data-hub'

interface NavItem {
  id: Section
  label: string
  sublabel: string
  icon: ReactNode
  available: boolean
  preview?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'fincen-rulebook',
    label: 'FinCEN Advisory',
    sublabel: '9 rules — HT · Crypto · Elder · AI',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'dark-patterns',
    label: 'Dark Patterns',
    sublabel: 'FinCEN trafficking signals',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'pig-butchering',
    label: 'Pig Butchering',
    sublabel: 'Crypto investment scam detection',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    id: 'efe',
    label: 'Elder Exploitation',
    sublabel: 'EFE pattern detection',
    available: true,
    preview: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'deepfake-fraud',
    label: 'Deepfake Fraud',
    sublabel: 'GenAI identity attack detection',
    available: true,
    preview: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    id: 'fraud-intelligence',
    label: 'Fraud Intelligence',
    sublabel: 'Cross-network ring detection',
    available: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: 'data-hub',
    label: 'Data Hub',
    sublabel: 'Schema & data explorer',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
]

interface Props {
  active: Section
  onNavigate: (s: Section) => void
}

function LLMConfigModal({ onClose }: { onClose: () => void }) {
  const { config, save, isConfigured } = useApiConfig()
  const [draft, setDraft] = useState({ ...config })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    save(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">LLM Configuration</div>
              <div className="text-xs text-slate-400">Stored locally in your browser</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">API Key <span className="text-rose-500">*</span></label>
            <input
              type="password"
              value={draft.apiKey}
              onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
              placeholder="sk-ant-api03-… or JWT token"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Base URL <span className="text-slate-400">(optional — for proxies)</span></label>
            <input
              type="text"
              value={draft.baseUrl}
              onChange={e => setDraft(d => ({ ...d, baseUrl: e.target.value }))}
              placeholder="https://llmfoundry.straive.com/anthropic"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Model</label>
            <select
              value={draft.model}
              onChange={e => setDraft(d => ({ ...d, model: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="claude-opus-4-7">Claude Opus 4.7 (most capable)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (balanced)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fastest)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <span className="text-xs text-slate-500">{isConfigured ? 'Configured' : 'Not configured'}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draft.apiKey.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-blue-800 text-white font-medium hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ active, onNavigate }: Props) {
  const [showConfig, setShowConfig] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { isConfigured } = useApiConfig()

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-64'} min-h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200`}>
      {showConfig && <LLMConfigModal onClose={() => setShowConfig(false)} />}

      {/* Collapse toggle */}
      <div className={`border-b border-slate-100 flex items-center py-2 ${collapsed ? 'justify-center px-2' : 'justify-end px-3'}`}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => item.available && onNavigate(item.id)}
              disabled={!item.available}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center rounded-lg text-left transition-colors',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-blue-50 text-blue-900'
                  : item.available
                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed',
              ].join(' ')}
            >
              <span className={`shrink-0 ${isActive ? 'text-blue-800' : ''}`}>{item.icon}</span>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-none truncate">{item.label}</div>
                    <div className="text-xs mt-0.5 opacity-70 truncate">{item.sublabel}</div>
                  </div>
                  {!item.available && (
                    <span className="ml-auto text-[10px] font-medium text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">Soon</span>
                  )}
                  {item.available && item.preview && !isActive && (
                    <span className="ml-auto text-[9px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">Preview</span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-200 py-3 space-y-1 ${collapsed ? 'px-2' : 'px-2'}`}>
        <button
          onClick={() => setShowConfig(true)}
          title={collapsed ? 'LLM Settings' : undefined}
          className={`w-full flex items-center rounded-lg transition-colors hover:bg-slate-50 text-slate-600 hover:text-slate-900 ${collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {!collapsed && (
            <>
              <span className="text-sm font-medium flex-1">LLM Settings</span>
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
