import { useEffect, useRef, useState } from "react"
import { MessageSquare, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChatSidebar } from "./ChatSidebar"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { useChat } from "@/hooks/useChat"
import { EmptyState } from "@/components/common/EmptyState"
import { cn } from "@/lib/utils"

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const {
    sessions,
    activeSessionId,
    messages,
    isTyping,
    setActiveSession,
    sendMessage,
    deleteSession,
    createNewSession,
    isLoading,
    isDeleting,
  } = useChat()

  // Ensure sessions and messages are always arrays
  const safeSessions = Array.isArray(sessions) ? sessions : []
  const safeMessages = Array.isArray(messages) ? messages : []
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevIsDeletingRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [safeMessages, isTyping])

  // Close delete dialog after successful deletion
  useEffect(() => {
    // Only close if we were deleting (true) and now we're not (false)
    if (prevIsDeletingRef.current && !isDeleting && deleteDialogOpen) {
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
    prevIsDeletingRef.current = isDeleting
  }, [isDeleting, deleteDialogOpen])

  const handleSend = (message: string, file?: File) => {
    if (!message.trim() && !file) return
    sendMessage({
      message: message.trim(),
      sessionId: activeSessionId || undefined,
      file,
    })
  }

  const handleNewChat = () => {
    createNewSession(undefined)
  }

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId)
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete)
      // Don't close dialog immediately - let the mutation's onSuccess handle it
    }
  }

  const handleClearChat = () => {
    setClearDialogOpen(true)
  }

  const confirmClearChat = () => {
    setActiveSession(null)
    setClearDialogOpen(false)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-background relative">
      <div
        className={cn(
          "absolute inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          "absolute md:relative z-20 h-full transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <ChatSidebar
          sessions={safeSessions}
          activeSessionId={activeSessionId}
          onNewChat={() => {
            handleNewChat()
            setSidebarOpen(false)
          }}
          onSelectSession={(id) => {
            handleSelectSession(id)
            setSidebarOpen(false)
          }}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {activeSessionId && (
          <div className="border-b p-4 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {safeSessions.find((s) => s.id === activeSessionId)?.title || "Chat"}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
            >
              Clear Chat
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {!activeSessionId && safeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden mb-4"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <EmptyState
                  icon={MessageSquare}
                  heading="Start a conversation"
                  description="Type a message below to start chatting about your invoices and expenses"
                />
              </div>
            ) : safeMessages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                heading="Start a conversation"
                description="Ask me anything about your invoices and expenses"
                className="py-12"
              />
            ) : (
              <>
                {safeMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && (
                  <div className="flex gap-4 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">AI</span>
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone and all
              messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear this chat? You will return to the home screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearChat}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

