"use client"

import {
  LayoutDashboard,
  ChefHat,
  Shuffle,
  BookHeart,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: ChefHat, label: "Meal Creator", id: "creator" },
  { icon: Shuffle, label: "Random Meal Ideas", id: "random", mobileLabel: "Random Ideas" },
  { icon: BookHeart, label: "Saved Meals", id: "saved" },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface SidebarNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground min-h-screen sticky top-0 self-start">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck size={20} className="text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sidebar-foreground leading-tight text-sm">
              GallSafe
            </p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">
              Low-Fat Planner
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
          {navItems.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === id
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {label === "Saved Meals" ? "Saved Safe Meals" : label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 leading-relaxed">
            Track fat, stay safe.
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch bg-sidebar border-t border-sidebar-border safe-bottom"
        aria-label="Main navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
          {navItems.map(({ icon: Icon, label, id, mobileLabel }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                activeTab === id
                  ? "text-primary"
                  : "text-sidebar-foreground/50"
              )}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon
                size={22}
                aria-hidden="true"
                className={cn(
                  "transition-transform",
                  activeTab === id && "scale-110"
                )}
              />
              <span>{mobileLabel ?? label}</span>
            </button>
          ))}
      </nav>
    </>
  )
}
