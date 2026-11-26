import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage } from '../../services/upload'
import { ApiClientError } from '../../lib/api'

interface ImageUploaderProps {
  label: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  error?: string
}

/** Single-image upload slot: shows the current image, or a dropzone-style button to upload one. */
export default function ImageUploader({ label, value, onChange, onRemove, error }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setIsUploading(true)
    try {
      const result = await uploadImage(file)
      onChange(result.url)
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Image upload failed'
      toast.error(message)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-brand-muted block mb-1.5">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {value ? (
        <div className="relative w-full aspect-video bg-brand-sand/50 border border-brand-line overflow-hidden group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs uppercase tracking-wider bg-brand-cream text-brand-dark"
            >
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label="Remove image"
                className="p-1.5 bg-brand-cream text-brand-dark"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-brand-cream animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full aspect-video flex flex-col items-center justify-center gap-2 border border-dashed border-brand-line bg-brand-sand/30 text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6" strokeWidth={1.25} />
              <span className="text-xs uppercase tracking-wider">Upload image</span>
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
