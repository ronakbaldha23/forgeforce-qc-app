import { useState } from 'react'
import { aiApi } from '../../lib/api/ai'
import { HttpError } from '../../lib/http'
import type { AiSuggestionDto } from '../../types'

const STATUS_LABEL: Record<AiSuggestionDto['status'], string> = {
  pending: 'Awaiting review',
  accepted: 'Accepted by reviewer',
  edited: 'Edited and accepted',
  rejected: 'Rejected',
}

export function AiSummaryPanel({ inspectionId }: { inspectionId: number }) {
  const [suggestion, setSuggestion] = useState<AiSuggestionDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const updated = await aiApi.review(suggestion.id, status)
    setSuggestion(updated)
  }

  return (
    <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-indigo-900">AI-generated summary</h2>
        {!suggestion && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="min-h-[40px] rounded-md bg-indigo-600 px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLoading ? 'Generating…' : 'Generate summary'}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-indigo-700">
        For review only — not an official QC record until a reviewer explicitly accepts it below.
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {suggestion && (
        <div className="mt-3">
          <pre className="whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-slate-800">
            {suggestion.suggested_text}
          </pre>
          <p className="mt-2 text-xs font-medium text-indigo-700">{STATUS_LABEL[suggestion.status]}</p>
          {suggestion.status === 'pending' && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleReview('accepted')}
                className="min-h-[40px] flex-1 rounded-md bg-emerald-600 text-sm font-medium text-white"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleReview('rejected')}
                className="min-h-[40px] flex-1 rounded-md border border-slate-300 text-sm text-slate-600"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
