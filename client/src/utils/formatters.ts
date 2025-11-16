import { format, parseISO } from "date-fns"

export function formatDate(date: string | Date, formatStr: string = "MMM dd, yyyy"): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, formatStr)
  } catch {
    return String(date)
  }
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return formatDate(dateObj)
  } catch {
    return String(date)
  }
}

