"use client"

import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortionPreset } from "@/lib/nutrition"

const PRESET_OPTIONS: { id: PortionPreset; label: string }[] = [
  { id: "whole", label: "Whole serving" },
  { id: "75", label: "75%" },
  { id: "50", label: "50%" },
  { id: "25", label: "25%" },
  { id: "custom", label: "Custom" },
]

interface MealPortionSelectorProps {
  preset: PortionPreset
  customPercent: number
  onPresetChange: (preset: PortionPreset) => void
  onCustomPercentChange: (percent: number) => void
}

export function MealPortionSelector({
  preset,
  customPercent,
  onPresetChange,
  onCustomPercentChange,
}: MealPortionSelectorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <PieChart size={16} className="text-primary shrink-0" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">
          What portion of the meal will you eat?
        </h3>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Meal portion"
      >
        {PRESET_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={preset === id}
            onClick={() => onPresetChange(id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              preset === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <label htmlFor="custom-portion" className="text-xs text-muted-foreground shrink-0">
            Custom amount
          </label>
          <input
            id="custom-portion"
            type="number"
            inputMode="decimal"
            min={1}
            max={100}
            value={customPercent}
            onChange={(e) => onCustomPercentChange(Number(e.target.value))}
            className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Custom portion percentage"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Fat, saturated fat, and calories are scaled to the portion you will actually eat.
      </p>
    </div>
  )
}
