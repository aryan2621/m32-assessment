import ReactMarkdown from "react-markdown";
import { formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/api/chat";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessageProps {
  message: ChatMessageType;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">AI</span>
        </div>
      )}

      <div
        className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2">{children}</ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted-foreground/20 p-2 rounded text-xs overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted-foreground/20 p-2 rounded text-xs overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {message.createdAt ? (
            <span>{formatRelativeTime(message.createdAt)}</span>
          ) : null}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-semibold">
            {user ? getInitials(user.name) : "U"}
          </span>
        </div>
      )}
    </div>
  );
}
