import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { defectsApi } from '../../lib/api/defects'
import { HttpError } from '../../lib/http'
import type { AttachmentDto } from '../../types'
import { Button } from '@/components/ui/button'

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
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? <Loader2 className="animate-spin" /> : <Camera />}
        {isUploading ? 'Uploading…' : 'Add photo'}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
