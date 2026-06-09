import type { SarStatus, CrossCaseRef } from '../../data/darkPatternsData'

const SAR_CONFIG: Record<SarStatus['status'], { label: string; bg: string; text: string; border: string; dot: string }> = {
  'monitoring':  { label: 'Monitoring',    bg: 'bg-slate-100',  text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  'sar-review':  { label: 'SAR Review',    bg: 'bg-amber-50',   text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  'escalated':   { label: 'Escalated',     bg: 'bg-orange-50',  text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  'sar-filed':   { label: 'SAR Filed',     bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
}

const TAB_LABEL: Record<CrossCaseRef['tab'], string> = {
  'corridor': 'Geographic Corridors',
  'controller': 'Controller Networks',
  'front-business': 'Front Businesses',
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const today = new Date('2024-11-15')
  const due = new Date(deadline)
  const days = Math.round((due.getTime() - today.getTime()) / 86400000)
  const urgent = days <= 10
  return (
    <span className={`text-[10px] font-bold ${urgent ? 'text-red-600' : 'text-slate-500'}`}>
      {days > 0 ? `${days}d remaining` : 'OVERDUE'}
    </span>
  )
}

export default function SarPanel({
  sarStatus,
  crossCaseRefs,
}: {
  sarStatus: SarStatus
  crossCaseRefs: CrossCaseRef[]
}) {
  const cfg = SAR_CONFIG[sarStatus.status]

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3">
      {/* SAR Status */}
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} ${sarStatus.status === 'sar-review' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
          <span className={`text-[10px] font-mono font-semibold ${cfg.text} opacity-70`}>{sarStatus.filingType}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Deadline: {sarStatus.deadline}</span>
            <DeadlineCountdown deadline={sarStatus.deadline} />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className={`text-[10px] font-semibold ${cfg.text} mb-0.5`}>{sarStatus.team}</div>
            <p className={`text-[10px] leading-relaxed ${cfg.text} opacity-80`}>{sarStatus.notes}</p>
          </div>
        </div>
      </div>

      {/* Cross-case refs */}
      {crossCaseRefs.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[240px]">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Related Cases</div>
          {crossCaseRefs.map(ref => (
            <div key={ref.caseId} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span className="text-[11px] font-bold text-blue-900 font-mono">{ref.caseId}</span>
              </div>
              <div className="text-[9px] text-slate-400 font-medium">{TAB_LABEL[ref.tab]}</div>
              <p className="text-[10px] text-slate-600 leading-relaxed">{ref.relationship}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
