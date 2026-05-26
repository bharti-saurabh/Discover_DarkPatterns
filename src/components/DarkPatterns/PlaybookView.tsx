import { useState } from 'react'
import { PLAYBOOK_RULES, type PlaybookRule, type DataField } from '../../data/playbookData'
import { FINCEN_CATEGORIES } from '../../data/darkPatternsData'

const SOURCE_BADGE: Record<DataField['source'], { badge: string; badgeText: string; label: string }> = {
  capone:   { badge: 'bg-indigo-100', badgeText: 'text-indigo-600', label: 'Cap One' },
  discover: { badge: 'bg-violet-100', badgeText: 'text-violet-600', label: 'Discover' },
  both:     { badge: 'bg-slate-200',  badgeText: 'text-slate-500',  label: 'Both' },
}

const FIELD_TYPE_ICONS: Record<DataField['type'], string> = {
  transaction: 'T',
  merchant:    'M',
  device:      'D',
  geographic:  'G',
  temporal:    '⏱',
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 border-t border-dashed border-slate-200" />
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span className="text-[8px] font-bold text-white uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 border-t border-dashed border-slate-200" />
    </div>
  )
}

function AlgorithmDiagram({ rule }: { rule: PlaybookRule }) {
  const capone   = rule.script.tables.filter(t => t.source === 'capone')
  const discover = rule.script.tables.filter(t => t.source === 'discover')
  const combined = rule.script.tables.filter(t => t.source === 'combined')

  return (
    <div className="space-y-3">

      {/* ① Input datasets */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Input Datasets</div>

        {/* Table chips grouped by source */}
        <div className="space-y-1.5 mb-3">
          {capone.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider w-14 shrink-0">Cap One</span>
              {capone.map(t => (
                <span key={t.name} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">{t.name}</span>
              ))}
            </div>
          )}
          {discover.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold text-violet-400 uppercase tracking-wider w-14 shrink-0">Discover</span>
              {discover.map(t => (
                <span key={t.name} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">{t.name}</span>
              ))}
            </div>
          )}
          {combined.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider w-14 shrink-0">Bridge</span>
              {combined.map(t => (
                <span key={t.name} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">{t.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Data fields — flat list, 2-column grid */}
        <div className="border-t border-slate-200 pt-2.5">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Fields</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {rule.dataFields.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="shrink-0 w-4 h-4 rounded bg-slate-200 text-slate-500 text-[7px] font-bold flex items-center justify-center mt-0.5">
                  {FIELD_TYPE_ICONS[f.type]}
                </span>
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold text-slate-700 leading-tight">{f.name}</div>
                  <div className="text-[8px] text-slate-400 leading-tight">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FlowArrow label="Detection Flow" />

      {/* ② Algorithm steps */}
      <div className="bg-slate-900 rounded-xl p-3 space-y-2">
        {rule.computationalSteps.map((step, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 w-4 h-4 rounded bg-indigo-700 text-white text-[7px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-[9px] text-slate-300 leading-relaxed font-mono">{step}</p>
          </div>
        ))}
      </div>

      <FlowArrow label="Classify" />

      {/* ③ Classification output */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <div className="text-[8px] font-bold uppercase tracking-widest text-red-600">Flagged</div>
          </div>
          <p className="text-[9px] font-mono text-red-800 leading-snug">{rule.script.classification.flagged}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="text-[8px] font-bold uppercase tracking-widest text-amber-600">Review</div>
          </div>
          <p className="text-[9px] font-mono text-amber-800 leading-snug">{rule.script.classification.review}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="text-[8px] font-bold uppercase tracking-widest text-emerald-600">Pass</div>
          </div>
          <p className="text-[9px] font-mono text-emerald-800 leading-snug">{rule.script.classification.pass}</p>
        </div>
      </div>
    </div>
  )
}

function Toggle({
  options,
  active,
  onSelect,
}: {
  options: { value: string; label: string; color?: string }[]
  active: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {options.map((opt, i) => {
        const isActive = active === opt.value
        const activeClass = opt.color ?? 'bg-slate-800'
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={[
              'px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors',
              i > 0 ? 'border-l border-slate-200' : '',
              isActive ? `${activeClass} text-white` : 'bg-white text-slate-400 hover:text-slate-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function RuleDetail({ rule }: { rule: PlaybookRule }) {
  const cat = FINCEN_CATEGORIES[rule.categoryId]
  const [codeLang, setCodeLang] = useState<'primary' | 'alt'>('primary')
  const [viewMode, setViewMode] = useState<'code' | 'diagram'>('code')

  const activeLang = codeLang === 'primary' ? rule.script.language : rule.script.altLanguage
  const activeCode = codeLang === 'primary' ? rule.script.code     : rule.script.altCode

  const langColor = (lang: string) => lang === 'python' ? 'bg-emerald-600' : 'bg-blue-600'

  return (
    <div className="space-y-4 overflow-y-auto scrollbar-thin pr-1 h-full">

      {/* Header — advisory card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-amber-700 font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                Rule {rule.ruleId}
              </span>
              <a
                href={rule.advisoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-amber-600 hover:text-amber-500 underline underline-offset-2"
              >
                {rule.advisoryRef} ↗
              </a>
              <span className="text-[10px] text-amber-600">fincen.gov</span>
            </div>
            <div className="text-xs font-semibold text-amber-900 mb-1">{rule.advisoryTitle}</div>
            <p className="text-[10px] text-amber-700 leading-relaxed">{rule.advisoryGuidance}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs font-bold text-slate-700">{cat.label}</div>
          </div>
        </div>
      </div>

      {/* Detection objective + algorithm */}
      <div className="grid grid-cols-[1fr_1.3fr] gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detection Objective</div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{rule.detectionObjective}</p>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Data Inputs</div>
            <div className="space-y-1.5">
              {rule.dataFields.map((field, i) => {
                const src = SOURCE_BADGE[field.source]
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-4 h-4 rounded bg-slate-200 text-slate-500 text-[8px] font-bold flex items-center justify-center mt-0.5">
                      {FIELD_TYPE_ICONS[field.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-700 truncate">{field.name}</span>
                        <span className={`shrink-0 text-[8px] font-bold px-1 py-0.5 rounded ${src.badge} ${src.badgeText}`}>{src.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-snug">{field.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detection Algorithm</div>
          <div className="space-y-2.5">
            {rule.computationalSteps.map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded bg-indigo-700 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detection implementation */}
      <div className="space-y-2.5">
        {/* Header row with both toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detection Implementation</div>

          {/* Language toggle — only visible in code view */}
          {viewMode === 'code' && (
            <Toggle
              active={codeLang}
              onSelect={v => setCodeLang(v as 'primary' | 'alt')}
              options={[
                { value: 'primary', label: rule.script.language.toUpperCase(), color: langColor(rule.script.language) },
                { value: 'alt',     label: rule.script.altLanguage.toUpperCase(), color: langColor(rule.script.altLanguage) },
              ]}
            />
          )}

          {/* View mode toggle — always visible */}
          <div className="ml-auto">
            <Toggle
              active={viewMode}
              onSelect={v => setViewMode(v as 'code' | 'diagram')}
              options={[
                { value: 'code',    label: 'Code' },
                { value: 'diagram', label: 'Diagram' },
              ]}
            />
          </div>
        </div>

        {viewMode === 'code' ? (
          <>
            {/* Table sources */}
            <div className="flex flex-wrap gap-1.5">
              {rule.script.tables.map(t => (
                <span key={t.name} className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                  t.source === 'capone'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : t.source === 'discover'
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>{t.name}</span>
              ))}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                activeLang === 'python' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>{activeLang}</span>
            </div>

            {/* Code block */}
            <pre className="bg-slate-950 rounded-xl p-4 overflow-x-auto overflow-y-auto max-h-80 scrollbar-thin">
              <code className="text-[9px] text-slate-200 font-mono leading-relaxed whitespace-pre">
                {activeCode}
              </code>
            </pre>

            {/* Classification legend */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'FLAGGED', value: rule.script.classification.flagged, cls: 'bg-red-50 border-red-200 text-red-800' },
                { label: 'REVIEW',  value: rule.script.classification.review,  cls: 'bg-amber-50 border-amber-200 text-amber-800' },
                { label: 'PASS',    value: rule.script.classification.pass,    cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              ].map(row => (
                <div key={row.label} className={`border rounded-lg p-2.5 ${row.cls}`}>
                  <div className="text-[8px] font-bold uppercase tracking-widest mb-1 opacity-60">{row.label}</div>
                  <p className="text-[9px] font-mono leading-snug">{row.value}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <AlgorithmDiagram rule={rule} />
        )}
      </div>

    </div>
  )
}

export default function PlaybookView() {
  const [selectedId, setSelectedId] = useState(PLAYBOOK_RULES[0].categoryId)
  const selected = PLAYBOOK_RULES.find(r => r.categoryId === selectedId)!

  return (
    <div className="grid grid-cols-[210px_1fr] gap-5 h-full min-h-0">
      {/* Rule list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-thin pr-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
          FinCEN Advisory → Detection Rule
        </div>
        {PLAYBOOK_RULES.map(rule => {
          const cat = FINCEN_CATEGORIES[rule.categoryId]
          const isSelected = selectedId === rule.categoryId
          return (
            <button
              key={rule.categoryId}
              onClick={() => setSelectedId(rule.categoryId)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold font-mono text-slate-400">
                  {rule.ruleId}
                </span>
                <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                  {rule.categoryId}
                </span>
                <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {rule.triggeredCases.length}
                </span>
              </div>
              <div className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {cat.label}
              </div>
              <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                {rule.advisoryRef}
              </div>
            </button>
          )
        })}

        <div className="mt-2 pt-3 border-t border-slate-100 px-1 space-y-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Advisory Sources</div>
          <a
            href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2014-a008"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[9px] text-amber-600 hover:text-amber-500 underline underline-offset-1 leading-snug"
          >
            FIN-2014-A008 — Human Trafficking Financial Red Flags ↗
          </a>
          <a
            href="https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2020-a008"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[9px] text-amber-600 hover:text-amber-500 underline underline-offset-1 leading-snug"
          >
            FIN-2020-A008 — Supplemental Trafficking Advisory ↗
          </a>
          <div className="text-[9px] text-slate-400 leading-snug pt-1">
            Rules HT-1 through HT-6 derived from FinCEN advisory guidance. All case data is synthetic and for demonstration purposes.
          </div>
        </div>
      </div>

      {/* Rule detail */}
      <div className="min-h-0 overflow-hidden">
        <RuleDetail key={selected.categoryId} rule={selected} />
      </div>
    </div>
  )
}
