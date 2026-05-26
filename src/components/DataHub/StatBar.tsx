interface Stat {
  label: string
  value: string
  sub?: string
  accent?: string
}

const STATS: Stat[] = [
  { label: 'Capital One Customers',   value: '5,000',   sub: 'Cap One cardholders',    accent: 'indigo' },
  { label: 'Capital One Transactions',value: '50,000',  sub: 'Issuer auth records',     accent: 'indigo' },
  { label: 'Discover Customers',      value: '4,000',   sub: 'Discover cardholders',    accent: 'violet' },
  { label: 'Network Transactions',      value: '100,000', sub: 'All issuers on network',  accent: 'violet' },
  { label: 'Resolvable Entities',       value: '~2,000',  sub: 'Same person, both CRMs',  accent: 'amber' },
  { label: 'Tables',                    value: '16',      sub: '6 issuer · 10 network',   accent: 'slate' },
]

const ACCENT_COLORS: Record<string, { num: string; label: string; border: string }> = {
  indigo: { num: 'text-indigo-700', label: 'text-indigo-500', border: 'border-indigo-200' },
  violet: { num: 'text-violet-700', label: 'text-violet-500', border: 'border-violet-200' },
  amber:  { num: 'text-amber-700',  label: 'text-amber-500',  border: 'border-amber-200' },
  slate:  { num: 'text-slate-700',  label: 'text-slate-500',  border: 'border-slate-200' },
}

export default function StatBar() {
  return (
    <div className="grid grid-cols-6 gap-4 mb-6">
      {STATS.map(stat => {
        const ac = ACCENT_COLORS[stat.accent ?? 'slate']
        return (
          <div key={stat.label} className={`bg-white rounded-xl border ${ac.border} px-4 py-3`}>
            <div className={`text-2xl font-bold ${ac.num} leading-none`}>{stat.value}</div>
            <div className={`text-[11px] font-medium ${ac.label} mt-1 leading-tight`}>{stat.label}</div>
            {stat.sub && <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>}
          </div>
        )
      })}
    </div>
  )
}
