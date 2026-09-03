import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRequestGuidelines, type FirstAppealPrefill } from "@/request-guidelines/RequestGuidelinesContext"
import { statutoryLimits, type DeadlineTone, type RequestDeadline } from "@/services/statutory-deadlines"

/**
 * Tone is decided in the service, from who is in default rather than from the sign of a number, so
 * these only have to render it. The opacities follow the pending / at-risk / failed set already
 * used by the payment reconciliation screens.
 */
const toneClasses: Record<DeadlineTone, string> = {
  error: "border-state-error/25 bg-state-error/10 text-state-error",
  info: "border-primary/20 bg-primary-fixed text-primary",
  neutral: "border-outline-variant bg-surface-container text-on-surface-variant",
  warning: "border-state-warning/30 bg-state-warning/12 text-state-warning",
}

const toneIcons: Record<DeadlineTone, string> = {
  error: "event_busy",
  info: "schedule",
  neutral: "history",
  warning: "hourglass_bottom",
}

/** The sentence explaining a clock, keyed by the stage it has reached. */
const bodyKeys: Record<RequestDeadline["kind"], { lapsed: string; running: string }> = {
  appealWindow: { lapsed: "deadline.appealWindowClosed", running: "deadline.appealWindow" },
  faaDecision: { lapsed: "deadline.faaDecisionOverdue", running: "deadline.faaDecision" },
  faaExtended: { lapsed: "deadline.faaDecisionLapsed", running: "deadline.faaDecisionOverdue" },
  pioReply: { lapsed: "deadline.pioReplyLapsed", running: "deadline.pioReply" },
}

/** The limits the Act sets that this portal cannot count down, because it never asked. */
const referenceLimits = [
  { key: "lifeOrLiberty", labelKey: "deadline.refLifeOrLiberty" },
  { key: "apioReply", labelKey: "deadline.refApioReply" },
  { key: "thirdParty", labelKey: "deadline.refThirdParty" },
  { key: "secondAppeal", labelKey: "deadline.refSecondAppeal" },
] as const

function Glyph({ className = "", name }: { className?: string; name: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>
}

/** The countdown as a pill, for list rows and beside a heading. */
function DeadlineChip({ className, deadline }: { className?: string; deadline: RequestDeadline }) {
  const { t } = useTranslation()
  const overdueBy = Math.abs(deadline.daysRemaining)

  // A closed filing window is the applicant's own timing, not a default, so it is never described
  // to them as being "overdue".
  const label = deadline.hasLapsed
    ? t(deadline.kind === "appealWindow" ? "deadline.windowClosed" : "deadline.overdue", { count: overdueBy })
    : deadline.daysRemaining === 0
      ? t("deadline.dueToday")
      : t("deadline.daysLeft", { count: deadline.daysRemaining })

  return (
    <Badge className={cn(toneClasses[deadline.tone], className)} variant="outline">
      <Glyph className="text-sm" name={toneIcons[deadline.tone]} />
      {label}
    </Badge>
  )
}

/**
 * The full explanation: the clock, what the Act calls it, and - once a public authority has missed
 * its own limit - the rights that lapse hands the applicant. `showAppealAction` is off wherever an
 * appeal link would be noise, such as on the appeal lookup itself.
 */
function DeadlineNotice({
  appealFor,
  deadline,
  showAppealAction = true,
}: {
  appealFor?: FirstAppealPrefill
  deadline: RequestDeadline
  showAppealAction?: boolean
}) {
  const { t } = useTranslation()
  const { openRequestGuidelines } = useRequestGuidelines()
  const body = bodyKeys[deadline.kind][deadline.hasLapsed ? "lapsed" : "running"]

  // Only a missed PIO reply converts into entitlements. A late appellate decision opens the second
  // appeal instead, which the sentence for that stage already says.
  const showRights = deadline.kind === "pioReply" && deadline.hasLapsed

  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">{t("deadline.heading")}</p>
        <DeadlineChip deadline={deadline} />
      </div>

      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t(body, { date: deadline.dueOn })}</p>
      <p className="mt-1 text-xs text-outline">{t("deadline.section", { section: deadline.section })}</p>

      {showRights ? (
        <div className="mt-4 rounded-lg border border-state-success/25 bg-state-success/10 p-4">
          <p className="text-sm font-semibold text-state-success">{t("deadline.rightsTitle")}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-on-surface-variant">
            {["deadline.rightsFree", "deadline.rightsDeemed", "deadline.rightsAppeal"].map((key) => (
              <li className="flex gap-2" key={key}>
                <Glyph className="mt-0.5 shrink-0 text-base text-state-success" name="check_circle" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          {showAppealAction ? (
            // Both routes go through the guidelines: the appeal journey has its own acknowledgement,
            // and jumping past it would be the one shortcut this flow must not take.
            appealFor ? (
              <Button
                className="mt-4"
                onClick={() => openRequestGuidelines({ appeal: appealFor, journey: "firstAppeal" })}
                size="sm"
                type="button"
              >
                <Glyph className="text-base" name="gavel" />
                {t("deadline.fileAppeal")}
              </Button>
            ) : (
              <Link className={cn(buttonVariants({ size: "sm" }), "mt-4")} to="/submit-first-appeal">
                <Glyph className="text-base" name="gavel" />
                {t("deadline.fileAppeal")}
              </Link>
            )
          ) : null}
        </div>
      ) : null}

      <details className="group mt-4">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
          <Glyph className="text-base transition-transform group-open:rotate-180" name="expand_more" />
          {t("deadline.otherLimitsTitle")}
        </summary>
        <dl className="mt-2 space-y-2 border-t border-outline-variant pt-3">
          {referenceLimits.map(({ key, labelKey }) => (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5" key={key}>
              <dt className="text-xs text-on-surface-variant">{t(labelKey)}</dt>
              <dd className="text-xs font-medium text-on-surface">
                {statutoryLimits[key].label}
                <span className="ml-2 font-normal text-outline">{t("deadline.section", { section: statutoryLimits[key].section })}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-5 text-outline">{t("deadline.otherLimitsNote")}</p>
      </details>
    </section>
  )
}

export { DeadlineChip, DeadlineNotice }
