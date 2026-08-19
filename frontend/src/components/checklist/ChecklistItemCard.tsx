import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { HistoryTimeline } from '../history/HistoryTimeline'
import { inspectionItemsApi } from '../../lib/api/inspectionItems'
import { HttpError } from '../../lib/http'
import type { InspectionItemHistoryDto, InspectionItemResultDto, InspectionStatus, ItemResult } from '../../types'
import { DefectSection } from '../defects/DefectSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const RESULT_STYLES: Record<ItemResult, { active: string; label: string }> = {
  pass: { active: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600', label: 'Pass' },
  fail: { active: 'border-red-600 bg-red-600 text-white hover:bg-red-600', label: 'Fail' },
  na: { active: 'border-slate-500 bg-slate-500 text-white hover:bg-slate-500', label: 'N/A' },
}

export function ChecklistItemCard({
  item,
  inspectionStatus,
  onSaved,
}: {
  item: InspectionItemResultDto
  inspectionStatus: InspectionStatus
  onSaved: (updated: InspectionItemResultDto) => void
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
      const updated = await inspectionItemsApi.update(item.id, {
        result: selected,
        comment: comment || null,
        change_reason: needsReason ? changeReason : null,
      })
      setChangeReason('')
      onSaved(updated)
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
    <Card className="p-4 shadow-sm">
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">{item.template_item.label}</h3>
            {item.template_item.help_text && (
              <p className="text-sm text-muted-foreground">{item.template_item.help_text}</p>
            )}
          </div>
          {item.result !== null && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 p-0 text-xs"
              onClick={() => {
                setShowHistory((s) => !s)
                if (!history) void loadHistory()
              }}
            >
              History
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(['pass', 'fail', 'na'] as ItemResult[]).map((r) => (
            <Button
              key={r}
              type="button"
              variant="outline"
              onClick={() => setSelected(r)}
              className={cn(
                'h-14 rounded-md border-2 text-base font-semibold',
                selected === r ? RESULT_STYLES[r].active : 'text-muted-foreground',
              )}
            >
              {RESULT_STYLES[r].label}
            </Button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional)"
          className="mt-3 min-h-14"
        />

        {needsReason && (
          <Textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Required: why are you changing an already-submitted result?"
            className="mt-2 min-h-12 border-amber-400 bg-amber-50"
          />
        )}

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <Button type="button" onClick={handleSave} disabled={!canSave || isSaving} className="mt-3 h-12 w-full">
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? 'Saving…' : 'Save'}
        </Button>

        {showHistory && (
          <div className="mt-3">
            {history ? <HistoryTimeline entries={history} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
          </div>
        )}

        {item.result === 'fail' && <DefectSection inspectionItemResultId={item.id} defects={item.defects} />}
      </CardContent>
    </Card>
  )
}
