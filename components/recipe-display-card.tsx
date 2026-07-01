"use client"

import { ChefHat, Clock, ShieldCheck, AlertCircle, Check, X } from "lucide-react"
import type { GeneratedRecipe, RecipeContent } from "@/lib/types/recipe"
import { cn } from "@/lib/utils"
import { getThresholdState } from "@/lib/nutrition"

export type SubstitutionChoice = "pending" | "accepted" | "rejected"

interface RecipeDisplayCardProps {
  recipe: GeneratedRecipe
  substitutionChoice: SubstitutionChoice | null
  onAcceptSubstitution?: () => void
  onRejectSubstitution?: () => void
  className?: string
}

function parseFatGrams(totalFat: string): number | null {
  const match = totalFat.match(/([\d.]+)/)
  if (!match) return null
  const n = Number.parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

function fatBadgeClass(fatGrams: number | null): string {
  const fatState = fatGrams !== null ? getThresholdState(fatGrams) : "safe"
  if (fatState === "safe") return "text-[oklch(0.4_0.13_155)] bg-[oklch(0.9_0.08_145)]"
  if (fatState === "caution") return "text-[oklch(0.42_0.14_65)] bg-[oklch(0.93_0.1_80)]"
  return "text-[oklch(0.45_0.18_27)] bg-[oklch(0.93_0.07_25)]"
}

function RecipeBody({ content }: { content: RecipeContent }) {
  const fatGrams = parseFatGrams(content.totalFat)
  const fatClass = fatBadgeClass(fatGrams)

  return (
    <>
      <header className="border-b border-[oklch(0.88_0.06_155)] bg-card/80 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <ChefHat size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-base leading-snug">{content.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} aria-hidden="true" />
                {content.cookTime}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", fatClass)}>
                {content.totalFat} fat / serving
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <section aria-labelledby="recipe-ingredients-heading">
          <h4
            id="recipe-ingredients-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Ingredients
          </h4>
          <ul className="space-y-1.5">
            {content.ingredients.map((item, index) => (
              <li key={index} className="text-sm text-foreground leading-snug flex gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recipe-instructions-heading">
          <h4
            id="recipe-instructions-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Instructions
          </h4>
          <ol className="space-y-2">
            {content.instructions.map((step, index) => (
              <li key={index} className="text-sm text-foreground leading-snug flex gap-2">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-[oklch(0.88_0.06_155)] bg-card/60 px-4 py-3">
        <p className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
          <ShieldCheck size={14} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-medium">Safety note:</strong> {content.safetyNote}
          </span>
        </p>
      </footer>
    </>
  )
}

export function RecipeDisplayCard({
  recipe,
  substitutionChoice,
  onAcceptSubstitution,
  onRejectSubstitution,
  className,
}: RecipeDisplayCardProps) {
  const needsChoice =
    recipe.substitutionApplied && substitutionChoice === "pending"

  const displayContent: RecipeContent =
    substitutionChoice === "rejected" && recipe.withoutSubstitution
      ? recipe.withoutSubstitution
      : recipe

  const showRejectedBanner =
    substitutionChoice === "rejected" && recipe.withoutSubstitution

  const showAcceptedBanner =
    substitutionChoice === "accepted" && recipe.substitutionApplied

  return (
    <article
      className={cn(
        "rounded-2xl border border-[oklch(0.82_0.08_155)] bg-[oklch(0.97_0.03_155)] overflow-hidden",
        className
      )}
      aria-label={`Generated recipe: ${recipe.title}`}
    >
      {needsChoice && (
        <div
          role="region"
          aria-labelledby="substitution-choice-heading"
          className="border-b border-[oklch(0.82_0.1_80)] bg-[oklch(0.97_0.04_80)] px-4 py-4 space-y-3"
        >
          <p
            id="substitution-choice-heading"
            className="flex items-start gap-2 text-xs text-[oklch(0.42_0.1_65)] leading-relaxed"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Suggested swap:</strong> The AI wants to adjust an
              ingredient to keep this meal under your 5g gallstone trigger limit. Choose before
              viewing the full recipe.
              {recipe.substitutionReason ? (
                <span className="mt-1 block text-[oklch(0.38_0.08_65)]">
                  {recipe.substitutionReason}
                </span>
              ) : null}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAcceptSubstitution}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check size={14} aria-hidden="true" />
              Use suggested swap
            </button>
            <button
              type="button"
              onClick={onRejectSubstitution}
              disabled={!recipe.withoutSubstitution}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                recipe.withoutSubstitution
                  ? "border-border bg-card text-foreground hover:bg-muted"
                  : "border-border bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <X size={14} aria-hidden="true" />
              Keep my original ingredients
            </button>
          </div>
          {!recipe.withoutSubstitution && (
            <p className="text-[10px] text-muted-foreground">
              Original-ingredient version unavailable — accept the swap or generate again.
            </p>
          )}
        </div>
      )}

      {showAcceptedBanner && (
        <div className="border-b border-[oklch(0.82_0.1_80)] bg-[oklch(0.97_0.04_80)] px-4 py-2.5">
          <p className="text-[10px] text-[oklch(0.42_0.1_65)]">
            <strong className="font-semibold">Using suggested swap.</strong>{" "}
            {recipe.substitutionReason}
          </p>
        </div>
      )}

      {showRejectedBanner && (
        <div className="border-b border-[oklch(0.82_0.1_80)] bg-[oklch(0.97_0.04_80)] px-4 py-2.5">
          <p className="text-[10px] text-[oklch(0.42_0.1_65)]">
            <strong className="font-semibold">Using your original ingredients.</strong> Fat may
            exceed the 5g target — check the safety note below.
          </p>
        </div>
      )}

      {!needsChoice && <RecipeBody content={displayContent} />}
    </article>
  )
}
