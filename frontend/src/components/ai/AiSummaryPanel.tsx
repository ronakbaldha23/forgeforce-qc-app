import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { aiApi } from '../../lib/api/ai'
import { HttpError } from '../../lib/http'
import type { AiSuggestionDto } from '../../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const STATUS_LABEL: Record<AiSuggestionDto['status'], string> = {
  pending: 'Awaiting review',
  accepted: 'Accepted by reviewer',
  edited: 'Edited and accepted',
  rejected: 'Rejected',
}

export function AiSummaryPanel({ inspectionId }: { inspectionId: number }) {
  const [suggestion, setSuggestion] = useState<AiSuggestionDto | null>(null)
  const [isCheckingExisting, setIsCheckingExisting] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    aiApi
      .getForInspection(inspectionId)
      .then((existing) => {
        if (!cancelled) setSuggestion(existing)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingExisting(false)
      })
    return () => {
      cancelled = true
    }
  }, [inspectionId])

  async function handleGenerate() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await aiApi.generateDefectSummary(inspectionId)
      setSuggestion(result)
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not generate summary.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReview(status: 'accepted' | 'rejected') {
    if (!suggestion) return
    setIsReviewing(true)
    try {
      const updated = await aiApi.review(suggestion.id, status)
      setSuggestion(updated)
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <Card className="mt-6 border-indigo-200 bg-indigo-50">
      <CardHeader className="flex-row items-center justify-between p-4 pb-0">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-indigo-900">
          <Sparkles className="size-4" /> AI-generated summary
        </h2>
        {!isCheckingExisting && !suggestion && (
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="h-10 bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? 'Generating…' : 'Generate summary'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-xs text-indigo-700">
          For review only — not an official QC record until a reviewer explicitly accepts it below.
        </p>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        {isCheckingExisting && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700">
            <Loader2 className="size-3.5 animate-spin" /> Checking for an existing summary…
          </p>
        )}

        {suggestion && (
          <div className="mt-3">
            <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-sm text-foreground">
              {suggestion.suggested_text}
            </pre>
            <p className="mt-2 text-xs font-medium text-indigo-700">{STATUS_LABEL[suggestion.status]}</p>
            {suggestion.status === 'pending' && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleReview('accepted')}
                  disabled={isReviewing}
                  className="h-10 flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isReviewing && <Loader2 className="animate-spin" />}
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReview('rejected')}
                  disabled={isReviewing}
                  className="h-10 flex-1"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
