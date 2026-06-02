import { useState } from 'react'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import DataHub from './components/DataHub/DataHub'
import DarkPatterns from './components/DarkPatterns/DarkPatterns'
import PlaybookView from './components/DarkPatterns/PlaybookView'
import PlaybookViewInfographic from './components/DarkPatterns/PlaybookViewInfographic'
import PigButchering from './components/PigButchering/PigButchering'
import TeaserPanel from './components/TeaserPanel/TeaserPanel'

type AdvisoryView = 'infographic' | 'detail'

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dark-patterns')
  const [advisoryView, setAdvisoryView]   = useState<AdvisoryView>('infographic')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeSection === 'fincen-rulebook' && (
          <div className="flex flex-col h-full px-6 pt-4 pb-4 overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-lg font-bold text-slate-900">FinCEN Advisory</h1>
              <span className="text-[10px] font-semibold bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                Advisory-Driven Detection
              </span>
              <div className="ml-auto flex items-center gap-2">
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
        {activeSection === 'dark-patterns'    && <DarkPatterns />}
        {activeSection === 'pig-butchering'   && <PigButchering />}
        {activeSection === 'efe'              && <TeaserPanel useCase="efe" />}
        {activeSection === 'deepfake-fraud'   && <TeaserPanel useCase="deepfake-fraud" />}
        {activeSection === 'data-hub'         && <DataHub />}
      </main>
    </div>
  )
}
