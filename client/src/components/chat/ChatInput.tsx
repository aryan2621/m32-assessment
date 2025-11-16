import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Send, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ChatInputProps {
  onSend: (message: string, file?: File) => void
  isLoading?: boolean
  disabled?: boolean
}

const suggestedPrompts = [
  "Show me this month's expenses",
  "Which vendor charged the most?",
  "Analyze my spending trends",
  "What are my top expense categories?",
]

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]
      if (allowedTypes.includes(file.type)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB")
          return
        }
        setSelectedFile(file)
      } else {
        toast.error("Please select a PDF or image file (JPEG, PNG, WebP)")
      }
    }
  }

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSend(message.trim() || `Uploaded file: ${selectedFile?.name}`, selectedFile || undefined)
      setMessage("")
      setSelectedFile(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-background p-4">
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Paperclip className="h-4 w-4" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setSelectedFile(null)}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {message.length === 0 && !selectedFile && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setMessage(prompt)}
              disabled={disabled || isLoading}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isLoading}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-[60px]"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your invoices and expenses..."
            className="min-h-[60px] max-h-[200px] resize-none pr-12 text-base"
            disabled={disabled || isLoading}
            rows={1}
          />
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}
            </div>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || isLoading || (!message.trim() && !selectedFile)}
          size="lg"
          className="h-[60px] px-6"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

