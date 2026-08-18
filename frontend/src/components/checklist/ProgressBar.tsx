export function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100)

  return (
    <div>
      <div className="flex justify-between text-sm text-slate-500">
        <span>Progress</span>
        <span>
          {answered}/{total} items
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-slate-900 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
