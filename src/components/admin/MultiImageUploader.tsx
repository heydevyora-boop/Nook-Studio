import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage } from '../../services/upload'
import { ApiClientError } from '../../lib/api'

interface MultiImageUploaderProps {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
}

/** Gallery of images with add/remove, used for a project's additional `images`. */
export default function MultiImageUploader({ label, value, onChange }: MultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setIsUploading(true)
    try {
      const result = await uploadImage(file)
      onChange([...value, result.url])
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Image upload failed'
      toast.error(message)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index))

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
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, index) => (
          <div key={url + index} className="relative aspect-square bg-brand-sand/50 border border-brand-line group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="Remove image"
              className="absolute top-1 right-1 p-1 bg-brand-dark/80 text-brand-cream opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="aspect-square flex items-center justify-center border border-dashed border-brand-line bg-brand-sand/30 text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" strokeWidth={1.25} />
          )}
        </button>
      </div>
    </div>
  )
}
