import { useState } from 'react'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import DataHub from './components/DataHub/DataHub'
import DarkPatterns from './components/DarkPatterns/DarkPatterns'
import PlaybookView from './components/DarkPatterns/PlaybookView'
import PlaybookViewInfographic from './components/DarkPatterns/PlaybookViewInfographic'
import PigButchering from './components/PigButchering/PigButchering'
import TeaserPanel from './components/TeaserPanel/TeaserPanel'
import straiveLogo from './assets/straive-logo.webp'

type AdvisoryView = 'infographic' | 'detail'

function TopBar() {
  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 shadow-sm z-30">
      <div className="flex items-center gap-4">
        <img src={straiveLogo} alt="Straive" className="h-8 w-auto object-contain" />
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 leading-tight">Payment Integrity Platform</span>
          <span className="text-[10px] text-slate-400 leading-tight">Capital One · Discover Network · FinCEN Advisory</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Synthetic data · Seed 42</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <span>Last scan: 2026-05-30 00:31 UTC</span>
      </div>
    </div>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dark-patterns')
  const [advisoryView, setAdvisoryView]   = useState<AdvisoryView>('infographic')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <TopBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar active={activeSection} onNavigate={setActiveSection} />
        <main className="flex-1 flex flex-col overflow-hidden">

          {activeSection === 'fincen-rulebook' && (
            <div className="flex flex-col h-full px-6 pt-4 pb-4 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-lg font-bold text-slate-900">FinCEN Advisory</h1>
                <span className="text-[10px] font-semibold bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Advisory-Driven Detection
                </span>
                <div className="ml-auto">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                    {([
                      { id: 'infographic', label: 'Visual' },
                      { id: 'detail',      label: 'Detail' },
                    ] as { id: AdvisoryView; label: string }[]).map((opt, i) => (
                      <button key={opt.id} onClick={() => setAdvisoryView(opt.id)}
                        className={[
                          'px-3 py-1.5 text-[10px] font-semibold transition-colors',
                          i > 0 ? 'border-l border-slate-200' : '',
                          advisoryView === opt.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 hover:text-slate-800',
                        ].join(' ')}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {advisoryView === 'infographic' ? <PlaybookViewInfographic /> : <PlaybookView />}
              </div>
            </div>
          )}

          {activeSection === 'dark-patterns'  && <DarkPatterns />}
          {activeSection === 'pig-butchering' && <PigButchering />}
          {activeSection === 'efe'            && <TeaserPanel useCase="efe" />}
          {activeSection === 'deepfake-fraud' && <TeaserPanel useCase="deepfake-fraud" />}
          {activeSection === 'data-hub'       && <DataHub />}

        </main>
      </div>
    </div>
  )
}
