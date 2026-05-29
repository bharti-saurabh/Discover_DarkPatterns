import { useState } from 'react'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import DataHub from './components/DataHub/DataHub'
import DarkPatterns from './components/DarkPatterns/DarkPatterns'
import PlaybookView from './components/DarkPatterns/PlaybookView'
import PigButchering from './components/PigButchering/PigButchering'
import TeaserPanel from './components/TeaserPanel/TeaserPanel'

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dark-patterns')

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
              <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
                <span>FinCEN refs:</span>
                <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008" target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-amber-600 hover:text-amber-500">FIN-2014-A008 ↗</a>
                <a href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008" target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-amber-600 hover:text-amber-500">FIN-2020-A008 ↗</a>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PlaybookView />
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
