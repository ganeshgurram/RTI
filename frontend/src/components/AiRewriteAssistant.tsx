import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MaterialIcon } from "@/routes/stitch-shell"
import { rewriteRtiDraft, type RtiDraftType } from "@/services/ai-rewrite"

type AiRewriteAssistantProps = {
  draft: string
  maxLength: number
  onUseRewrite: (rewrite: string) => void
  type: RtiDraftType
}

export function AiRewriteAssistant({ draft, maxLength, onUseRewrite, type }: AiRewriteAssistantProps) {
  const { i18n, t } = useTranslation()
  const safetyIdentifier = useRef(`rti-sahayak-${crypto.randomUUID()}`)
  const [suggestion, setSuggestion] = useState("")
  const [isRewriting, setIsRewriting] = useState(false)
  const [error, setError] = useState("")

  // A suggestion belongs to one exact draft. Editing the request starts a fresh revision rather
  // than leaving an old suggestion available to overwrite the applicant's newer work.
  useEffect(() => {
    setSuggestion("")
    setError("")
  }, [draft])

  const handleRewrite = async () => {
    if (!draft.trim()) {
      setError(t("aiRewrite.empty"))
      return
    }

    setError("")
    setSuggestion("")
    setIsRewriting(true)

    try {
      const rewrite = await rewriteRtiDraft({
        draft,
        language: i18n.language.startsWith("hi") ? "hi" : "en",
        maxLength,
        safetyIdentifier: safetyIdentifier.current,
        type,
      })
      setSuggestion(rewrite)
    } catch {
      setError(t("aiRewrite.error"))
    } finally {
      setIsRewriting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-on-surface-variant">{t("aiRewrite.helper")}</p>
        <Button disabled={isRewriting || !draft.trim()} onClick={handleRewrite} size="sm" type="button" variant="outline">
          <MaterialIcon className="text-base">auto_fix_high</MaterialIcon>
          {isRewriting ? t("aiRewrite.rewriting") : t("aiRewrite.action")}
        </Button>
      </div>

      {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}

      {suggestion ? (
        <section aria-live="polite" className="rounded-lg border border-primary/25 bg-primary-fixed/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <MaterialIcon className="text-lg">auto_fix_high</MaterialIcon>
            {t("aiRewrite.suggestion")}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{suggestion}</p>
          <p className="mt-3 text-xs text-on-surface-variant">{t("aiRewrite.review")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => onUseRewrite(suggestion)} size="sm" type="button">
              {t("aiRewrite.useRewrite")}
            </Button>
            <Button onClick={() => setSuggestion("")} size="sm" type="button" variant="outline">
              {t("aiRewrite.keepOriginal")}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
