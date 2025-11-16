import { Plus, Trash2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatRelativeTime } from "@/utils/formatters"
import type { ChatSession } from "@/api/chat"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewChat: () => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  // Ensure sessions is always an array
  const safeSessions = Array.isArray(sessions) ? sessions : []

  return (
    <div className="w-[280px] min-w-[280px] md:w-1/4 md:min-w-[320px] border-r bg-muted/30 flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {safeSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No chat history</p>
              <p className="text-xs mt-2">Start a new conversation to get started</p>
            </div>
          ) : (
            safeSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-colors",
                  activeSessionId === session.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="pr-8">
                  <p
                    className={cn(
                      "font-medium text-sm truncate",
                      activeSessionId === session.id && "text-primary-foreground"
                    )}
                  >
                    {session.title || "New Chat"}
                  </p>
                  {session.preview && (
                    <p
                      className={cn(
                        "text-xs mt-1 truncate",
                        activeSessionId === session.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {session.preview}
                    </p>
                  )}
                  <p
                    className={cn(
                      "text-xs mt-1",
                      activeSessionId === session.id
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                    activeSessionId === session.id && "text-primary-foreground hover:bg-primary-foreground/20"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

