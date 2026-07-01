"use client"

import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FAT_THRESHOLD_CAUTION,
  FAT_THRESHOLD_SAFE,
  getThresholdState,
} from "@/lib/nutrition"
import type { FatTotals } from "@/lib/types/food"

export type { FatTotals }

interface FatTrackerCardProps {
  totals: FatTotals
  /** Full meal totals before portion scaling (shown when under 100%). */
  fullTotals?: FatTotals
  portionPercent?: number
}

const thresholdConfig = {
  safe: {
    label: "Highly Safe / Ultra Low Fat",
    icon: CheckCircle2,
    barColour: "bg-[oklch(0.48_0.13_155)]",
    bgColour: "bg-[oklch(0.92_0.08_145)]",
    textColour: "text-[oklch(0.32_0.12_145)]",
    badgeBg: "bg-[oklch(0.88_0.1_145)]",
    borderColour: "border-[oklch(0.7_0.12_145)]",
    maxFat: FAT_THRESHOLD_SAFE,
  },
  caution: {
    label: "Caution / Moderate Fat Limit",
    icon: AlertCircle,
    barColour: "bg-[oklch(0.7_0.13_80)]",
    bgColour: "bg-[oklch(0.96_0.06_80)]",
    textColour: "text-[oklch(0.42_0.14_65)]",
    badgeBg: "bg-[oklch(0.92_0.09_80)]",
    borderColour: "border-[oklch(0.75_0.13_80)]",
    maxFat: FAT_THRESHOLD_CAUTION,
  },
  danger: {
    label: "High Risk Trigger Meal",
    icon: AlertTriangle,
    barColour: "bg-[oklch(0.65_0.18_27)]",
    bgColour: "bg-[oklch(0.96_0.04_25)]",
    textColour: "text-[oklch(0.45_0.18_27)]",
    badgeBg: "bg-[oklch(0.92_0.07_25)]",
    borderColour: "border-[oklch(0.7_0.16_27)]",
    maxFat: 15,
  },
}

export function FatTrackerCard({ totals, fullTotals, portionPercent = 100 }: FatTrackerCardProps) {
  const state = getThresholdState(totals.totalFat)
  const config = thresholdConfig[state]
  const Icon = config.icon
  const showPortionNote = portionPercent < 100 && fullTotals

  const maxDisplay = state === "danger" ? Math.max(totals.totalFat + 2, 15) : config.maxFat
  const progress = Math.min((totals.totalFat / maxDisplay) * 100, 100)

  const radius = 72
  const cx = 90
  const cy = 90
  const startAngle = -200
  const sweepAngle = 220
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arcX = (angle: number) => cx + radius * Math.cos(toRad(angle))
  const arcY = (angle: number) => cy + radius * Math.sin(toRad(angle))

  const endAngle = startAngle + (sweepAngle * progress) / 100
  const largeArc = (sweepAngle * progress) / 100 > 180 ? 1 : 0

  const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${radius} ${radius} 0 1 1 ${arcX(startAngle + sweepAngle)} ${arcY(startAngle + sweepAngle)}`
  const fillPath =
    progress > 0
      ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${radius} ${radius} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`
      : ""

  const arcColours = {
    safe: "#22c55e",
    caution: "#f59e0b",
    danger: "#ef4444",
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-5 transition-colors duration-500",
        config.bgColour,
        config.borderColour
      )}
    >
      <div className="flex flex-col gap-2 mb-3">
        <p className={cn("text-xs font-semibold uppercase tracking-wider", config.textColour)}>
          Live Fat Tracker
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-muted-foreground text-xs">
            {portionPercent < 100 ? "Your portion" : "Current meal total"}
          </p>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
              config.badgeBg,
              config.textColour
            )}
          >
            <Icon size={13} aria-hidden="true" />
            {config.label}
          </span>
        </div>
        {showPortionNote && fullTotals && (
          <p className="text-[11px] text-muted-foreground">
            Full meal: {fullTotals.totalFat.toFixed(1)}g fat · You will eat ({portionPercent}%):{" "}
            <span className="font-semibold text-foreground">{totals.totalFat.toFixed(1)}g fat</span>
          </p>
        )}
      </div>

      <div className="flex justify-center my-2">
        <svg
          viewBox="0 0 180 115"
          className="w-full max-w-[220px] h-auto"
          role="img"
          aria-label={`Fat gauge: ${totals.totalFat.toFixed(1)}g`}
        >
          <path
            d={trackPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-black/10"
          />
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={arcColours[state]}
              strokeWidth="12"
              strokeLinecap="round"
            />
          )}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-bold"
            style={{ fontSize: 28, fill: arcColours[state], fontFamily: "var(--font-sans)" }}
          >
            {totals.totalFat.toFixed(1)}
          </text>
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 11, fill: "oklch(0.52 0.01 145)", fontFamily: "var(--font-sans)" }}
          >
            grams fat
          </text>
        </svg>
      </div>

      <div className="flex justify-between text-xs px-1 mb-4 text-muted-foreground">
        <span>0g</span>
        <span className="text-[oklch(0.48_0.13_155)] font-medium">{FAT_THRESHOLD_SAFE}g safe</span>
        <span className="text-[oklch(0.7_0.13_80)] font-medium">{FAT_THRESHOLD_CAUTION}g limit</span>
        <span className="text-[oklch(0.45_0.18_27)] font-medium">{FAT_THRESHOLD_CAUTION}g+</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatBox
          label="Total Fat"
          value={totals.totalFat.toFixed(1)}
          unit="g"
          highlight
          colour={arcColours[state]}
        />
        <StatBox
          label="Saturated Fat"
          value={totals.saturatedFat.toFixed(1)}
          unit="g"
        />
        <StatBox
          label="Calories"
          value={Math.round(totals.calories).toString()}
          unit="kcal"
        />
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  unit,
  highlight,
  colour,
}: {
  label: string
  value: string
  unit: string
  highlight?: boolean
  colour?: string
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className="text-lg font-bold leading-none text-foreground"
        style={highlight && colour ? { color: colour } : undefined}
      >
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  )
}
