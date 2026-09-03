import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { RtiRequest } from "@/requests/RequestContext"
import { getRequestDeadline } from "@/services/statutory-deadlines"
import { MaterialIcon } from "@/routes/stitch-shell"

type TimelineState = "complete" | "current" | "upcoming"

type TimelineStage = {
  date?: string
  icon: string
  key: "submitted" | "verification" | "assigned" | "reply" | "appeal"
  state: TimelineState
}

const replyStatuses = new Set(["Reply received", "Satisfied"])
const appealStatuses = new Set(["First Appeal", "First Appeal Filed", "Second Appeal"])

function timelineFor(request: RtiRequest, today: Date): TimelineStage[] {
  const deadline = getRequestDeadline({ request, today })
  const hasMovedPastVerification = request.status !== "Pending Verification"
  const hasReachedAssignment = request.status !== "Pending Verification"
  const hasReply = replyStatuses.has(request.status)
  const hasAppeal = appealStatuses.has(request.status)
  const appealIsAvailable = !hasAppeal && (request.status === "Reply received" || (deadline?.kind === "pioReply" && deadline.hasLapsed))

  return [
    { key: "submitted", icon: "send", state: "complete", date: request.submittedOn },
    {
      key: "verification",
      icon: request.isBplApplicant ? "verified" : "payments",
      state: hasMovedPastVerification ? "complete" : "current",
      date: hasMovedPastVerification ? request.lastUpdated : undefined,
    },
    {
      key: "assigned",
      icon: "assignment_ind",
      state: hasReachedAssignment
        ? (request.status === "Processing" ? "current" : "complete")
        : "upcoming",
      date: hasReachedAssignment && request.status !== "Processing" ? request.lastUpdated : undefined,
    },
    {
      key: "reply",
      icon: "mark_email_read",
      state: hasReply || hasAppeal
        ? "complete"
        : request.status === "Processing" ? "current" : "upcoming",
      date: hasReply ? request.lastUpdated : undefined,
    },
    {
      key: "appeal",
      icon: "gavel",
      state: hasAppeal ? "complete" : appealIsAvailable ? "current" : "upcoming",
      date: hasAppeal ? request.lastUpdated : undefined,
    },
  ]
}

const stateClasses: Record<TimelineState, string> = {
  complete: "border-state-success bg-state-success text-on-primary",
  current: "border-primary bg-primary text-on-primary ring-4 ring-primary/10",
  upcoming: "border-outline-variant bg-surface-container-lowest text-on-surface-variant",
}

export function RequestTimeline({ request }: { request: RtiRequest }) {
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const stages = timelineFor(request, today)

  return (
    <section aria-labelledby={`request-timeline-${request.id}`}>
      <div className="mb-4 flex items-center gap-2">
        <MaterialIcon className="text-primary">account_tree</MaterialIcon>
        <h2 className="font-headline-md text-lg text-primary" id={`request-timeline-${request.id}`}>{t("timeline.title")}</h2>
      </div>
      <ol className="space-y-0">
        {stages.map((stage, index) => (
          <li className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0" key={stage.key}>
            {index < stages.length - 1 ? <span aria-hidden="true" className={`absolute left-[1.1875rem] top-10 h-[calc(100%_-_1.5rem)] w-px ${stage.state === "complete" ? "bg-state-success/50" : "bg-outline-variant"}`} /> : null}
            <span className={`relative z-10 flex size-10 items-center justify-center rounded-full border ${stateClasses[stage.state]}`}>
              <MaterialIcon className="text-xl">{stage.icon}</MaterialIcon>
            </span>
            <div className="min-w-0 pt-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3 className={`text-sm font-semibold ${stage.state === "upcoming" ? "text-on-surface-variant" : "text-on-surface"}`}>{t(`timeline.${stage.key}.title`)}</h3>
                {stage.state === "current" ? <span className="text-xs font-medium text-primary">{t("timeline.current")}</span> : null}
              </div>
              <p className="mt-0.5 text-sm leading-5 text-on-surface-variant">
                {t(`timeline.${stage.key}.${stage.key === "verification" && request.isBplApplicant ? "bplDescription" : "description"}`)}
              </p>
              {stage.date ? <p className="mt-1 text-xs text-outline">{stage.date}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
