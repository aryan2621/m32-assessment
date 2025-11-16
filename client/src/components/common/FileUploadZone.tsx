import { useRef, useState } from "react"
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  className?: string
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

export function FileUploadZone({
  onFileSelect,
  className,
  disabled = false,
}: FileUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PDF or image file (JPEG, PNG, WebP)"
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB"
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]

    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div
          onClick={handleClick}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Click to upload invoice
          </p>
          <p className="text-sm text-muted-foreground">
            PDF or image files (JPEG, PNG, WebP) - max 10MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <FileText className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

