import { useState } from 'react'
import { HistoryTimeline } from '../history/HistoryTimeline'
import { inspectionItemsApi } from '../../lib/api/inspectionItems'
import { HttpError } from '../../lib/http'
import type { InspectionItemHistoryDto, InspectionItemResultDto, InspectionStatus, ItemResult } from '../../types'
import { DefectSection } from '../defects/DefectSection'

const RESULT_STYLES: Record<ItemResult, { active: string; label: string }> = {
  pass: { active: 'border-emerald-600 bg-emerald-600 text-white', label: 'Pass' },
  fail: { active: 'border-red-600 bg-red-600 text-white', label: 'Fail' },
  na: { active: 'border-slate-500 bg-slate-500 text-white', label: 'N/A' },
}

export function ChecklistItemCard({
  item,
  inspectionStatus,
  onSaved,
}: {
  item: InspectionItemResultDto
  inspectionStatus: InspectionStatus
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<ItemResult | null>(item.result)
  const [comment, setComment] = useState(item.comment ?? '')
  const [changeReason, setChangeReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<InspectionItemHistoryDto[] | null>(null)

  const dirty = selected !== item.result || comment !== (item.comment ?? '')
  const needsReason = inspectionStatus === 'submitted' && item.result !== null && selected !== item.result
  const canSave = dirty && selected !== null && (!needsReason || changeReason.trim().length > 0)

  async function handleSave() {
    if (!selected) return
    setIsSaving(true)
    setError(null)
    try {
      await inspectionItemsApi.update(item.id, {
        result: selected,
        comment: comment || null,
        change_reason: needsReason ? changeReason : null,
      })
      setChangeReason('')
      onSaved()
      if (showHistory) void loadHistory()
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save.')
    } finally {
      setIsSaving(false)
    }
  }

  async function loadHistory() {
    const entries = await inspectionItemsApi.history(item.id)
    setHistory(entries)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{item.template_item.label}</h3>
          {item.template_item.help_text && <p className="text-sm text-slate-500">{item.template_item.help_text}</p>}
        </div>
        {item.has_history && (
          <button
            type="button"
            onClick={() => {
              setShowHistory((s) => !s)
              if (!history) void loadHistory()
            }}
            className="shrink-0 text-xs font-medium text-slate-500 underline"
          >
            History
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(['pass', 'fail', 'na'] as ItemResult[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelected(r)}
            className={`min-h-[56px] rounded-md border-2 text-base font-semibold ${
              selected === r ? RESULT_STYLES[r].active : 'border-slate-200 text-slate-600'
            }`}
          >
            {RESULT_STYLES[r].label}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment (optional)"
        className="mt-3 min-h-[56px] w-full rounded-md border border-slate-300 p-2 text-sm"
      />

      {needsReason && (
        <textarea
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          placeholder="Required: why are you changing an already-submitted result?"
          className="mt-2 min-h-[48px] w-full rounded-md border border-amber-400 bg-amber-50 p-2 text-sm"
        />
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="mt-3 min-h-[48px] w-full rounded-md bg-slate-900 text-sm font-medium text-white disabled:opacity-40"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>

      {showHistory && (
        <div className="mt-3">
          {history ? <HistoryTimeline entries={history} /> : <p className="text-sm text-slate-400">Loading…</p>}
        </div>
      )}

      {item.result === 'fail' && (
        <DefectSection inspectionItemResultId={item.id} defects={item.defects} />
      )}
    </div>
  )
}
