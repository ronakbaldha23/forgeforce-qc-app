import type { InspectionItemHistoryDto, ItemResult } from '../../types'

const RESULT_LABEL: Record<ItemResult, string> = { pass: 'Pass', fail: 'Fail', na: 'N/A' }

function ResultBadge({ result }: { result: ItemResult | null }) {
  if (!result) return <span className="text-slate-400">(unset)</span>
  const color =
    result === 'pass'
      ? 'text-emerald-700'
      : result === 'fail'
        ? 'text-red-700'
        : 'text-slate-500'
  return <span className={`font-medium ${color}`}>{RESULT_LABEL[result]}</span>
}

export function HistoryTimeline({ entries }: { entries: InspectionItemHistoryDto[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No history yet.</p>
  }

  return (
    <ul className="flex flex-col gap-2 border-l-2 border-slate-200 pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <p>
            <ResultBadge result={entry.previous_result} /> &rarr; <ResultBadge result={entry.new_result} />
          </p>
          <p className="text-slate-500">
            {entry.changed_by ?? 'Unknown user'} &middot; {new Date(entry.changed_at).toLocaleString()}
          </p>
          {entry.change_reason && <p className="italic text-slate-500">Reason: {entry.change_reason}</p>}
        </li>
      ))}
    </ul>
  )
}
