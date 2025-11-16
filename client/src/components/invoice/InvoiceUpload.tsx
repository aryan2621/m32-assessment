import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploadZone } from "@/components/common/FileUploadZone"
import { Button } from "@/components/ui/button"
import { useInvoices } from "@/hooks/useInvoices"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { SSEEvent } from "@/api/invoice"

interface InvoiceUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceUpload({ open, onOpenChange }: InvoiceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const { uploadInvoice, isUploading } = useInvoices(undefined, 1, 20, false)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setProgress(0)
    setProgressMessage("")
  }

  const handleProgress = (event: SSEEvent) => {
    if (event.progress !== undefined) {
      setProgress(event.progress)
    }
    if (event.message) {
      setProgressMessage(event.message)
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      setProgress(0)
      setProgressMessage("Starting upload...")
      uploadInvoice(selectedFile, (event) => {
        handleProgress(event)
        if (event.type === "success") {
          setTimeout(() => {
            setSelectedFile(null)
            setProgress(0)
            setProgressMessage("")
            onOpenChange(false)
          }, 1500)
        }
      })
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null)
      setProgress(0)
      setProgressMessage("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload Invoice</DialogTitle>
          <DialogDescription>
            Upload an invoice PDF or image (max 10MB) to automatically extract details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <FileUploadZone
            onFileSelect={handleFileSelect}
            disabled={isUploading}
          />
          {selectedFile && !isUploading && (
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                className="flex-1"
                size="lg"
              >
                Upload and Process
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          )}
          {isUploading && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <LoadingSpinner text={progressMessage || "Processing invoice..."} />
              <div className="w-full space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground">
                  {progressMessage || "This may take a few moments"}
                </p>
              </div>
            </div>
          )}
          {!isUploading && !selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Supported formats: PDF, JPEG, PNG, WebP (max 10MB)</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

