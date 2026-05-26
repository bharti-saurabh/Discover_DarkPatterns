import { useState } from 'react'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import DataHub from './components/DataHub/DataHub'
import DarkPatterns from './components/DarkPatterns/DarkPatterns'
import AgenticInvestigator from './components/AgenticInvestigator/AgenticInvestigator'

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('data-hub')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeSection === 'data-hub'            && <DataHub />}
        {activeSection === 'dark-patterns'       && <DarkPatterns />}
        {activeSection === 'agentic-investigator' && (
          <div className="flex flex-col h-full p-6 pb-0 overflow-hidden">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-900">Agentic Investigator</h1>
                <span className="text-[10px] font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  4-Agent Pipeline
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Select a case and launch the investigation. Three specialist agents run in parallel, then a Case Strategist synthesizes their findings into an actionable brief.
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <AgenticInvestigator />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
