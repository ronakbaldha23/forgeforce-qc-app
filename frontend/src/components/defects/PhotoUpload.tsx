import { useRef, useState } from 'react'
import { defectsApi } from '../../lib/api/defects'
import { HttpError } from '../../lib/http'
import type { AttachmentDto } from '../../types'

export function PhotoUpload({
  defectId,
  onUploaded,
}: {
  defectId: number
  onUploaded: (attachment: AttachmentDto) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setIsUploading(true)
    setError(null)
    try {
      const attachment = await defectsApi.uploadPhoto(defectId, file)
      onUploaded(attachment)
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Photo upload failed.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="min-h-[44px] rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 active:bg-slate-100 disabled:opacity-50"
      >
        {isUploading ? 'Uploading…' : '📷 Add photo'}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
