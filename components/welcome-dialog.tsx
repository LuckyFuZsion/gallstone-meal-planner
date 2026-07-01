"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeDialogProps {
  open: boolean
  onSubmit: (name: string) => void
}

export function WelcomeDialog({ open, onSubmit }: WelcomeDialogProps) {
  const [name, setName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.preventDefault()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-description"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shrink-0">
            <ShieldCheck size={22} className="text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 id="welcome-title" className="text-lg font-semibold text-foreground">
              Welcome to GallSafe
            </h2>
            <p className="text-xs text-muted-foreground">Your low-fat meal planner</p>
          </div>
        </div>

        <p id="welcome-description" className="text-sm text-muted-foreground leading-relaxed mb-5">
          GallSafe helps you plan gallstone-friendly meals by tracking fat per serving. What should
          we call you?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Your name</span>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              autoComplete="given-name"
              maxLength={40}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            type="submit"
            disabled={!name.trim()}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              name.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Get started
          </button>
        </form>
      </div>
    </div>
  )
}
