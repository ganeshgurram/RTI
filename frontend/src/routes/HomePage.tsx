import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FirstVisitGuide } from "@/components/FirstVisitGuide"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/auth/AuthContext"
import { usePortalLanguage } from "@/i18n"
import { MaterialIcon } from "@/routes/stitch-shell"

const actionCards = [
  { icon: "description", key: "request", destination: "/submit-request", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "gavel", key: "firstAppeal", destination: "/submit-first-appeal", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "manage_search", key: "status", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "balance", key: "secondAppeal", destination: "/second-appeal", iconClass: "bg-secondary text-secondary-foreground" },
]

const flowchartWidth = 1120
const flowchartHeight = 970

function ServiceUpdateNotice() {
  const { language } = usePortalLanguage()
  const messageViewportRef = useRef<HTMLDivElement>(null)
  const messageMeasureRef = useRef<HTMLSpanElement>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)
  const notice = language === "hi"
      ? {
        label: "सेवा अपडेट",
        message: "नया: आरटीआई सहायक वॉइस असिस्टेंट उपलब्ध है। माइक्रोफ़ोन दबाएँ और सामान्य आरटीआई प्रश्न पूछने के लिए ‘हे आरटीआई’ कहें।",
      }
    : {
        label: "Service update",
        message: "New: RTI Sahayak Voice Assistant is available. Select the microphone and say “Hey RTI” to ask general RTI questions.",
      }

  useLayoutEffect(() => {
    const viewport = messageViewportRef.current
    const message = messageMeasureRef.current
    if (!viewport || !message) return

    const measureOverflow = () => {
      const nextShouldMarquee = message.getBoundingClientRect().width > viewport.clientWidth + 1
      setShouldMarquee((current) => current === nextShouldMarquee ? current : nextShouldMarquee)
    }

    measureOverflow()
    const resizeObserver = new ResizeObserver(measureOverflow)
    resizeObserver.observe(viewport)

    return () => resizeObserver.disconnect()
  }, [notice.message])

  return (
    <aside aria-label={notice.label} className="bg-primary text-on-primary">
      <div className="mx-auto grid w-full max-w-container-max grid-cols-[minmax(0,1fr)] gap-y-1 px-margin-mobile py-2 text-sm leading-5 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center sm:gap-x-3 md:px-margin-desktop">
        <span className="inline-flex items-center gap-1.5 font-semibold text-on-primary"><MaterialIcon className="text-base">campaign</MaterialIcon>{notice.label}</span>
        <span aria-hidden="true" className="hidden h-4 border-l border-on-primary/30 sm:inline" />
        <div className="relative min-w-0 overflow-hidden text-on-primary/85" ref={messageViewportRef}>
          <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 invisible whitespace-nowrap" ref={messageMeasureRef}>{notice.message}</span>
          {shouldMarquee ? (
            <p className="service-update-message-marquee flex w-max whitespace-nowrap">
              <span className="pr-12">{notice.message}</span>
              <span aria-hidden="true" className="pr-12">{notice.message}</span>
            </p>
          ) : (
            <p className="w-max whitespace-nowrap">{notice.message}</p>
          )}
        </div>
      </div>
    </aside>
  )
}

const steps = [
  ["person", "home.lifecycle.steps.citizenTitle", "home.lifecycle.steps.citizenDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["account_balance", "home.lifecycle.steps.nodalTitle", "home.lifecycle.steps.nodalDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["assignment_ind", "home.lifecycle.steps.cpioTitle", "home.lifecycle.steps.cpioDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["mark_email_read", "home.lifecycle.steps.respondsTitle", "home.lifecycle.steps.respondsDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
]

type FlowNodeTone = "action" | "complaint" | "logic" | "notSatisfied" | "satisfied"

/**
 * A small set of applicant situations drives the highlight, while the map itself remains one
 * decision tree. Shared stages appear once, so users can follow the process without reading every
 * theoretical end-to-end permutation.
 */
type RouteId = "newRequest" | "replyIssue" | "noReply" | "transferred" | "appealIssue"

const routeOrder: RouteId[] = ["newRequest", "replyIssue", "noReply", "transferred", "appealIssue"]

type JourneyGuideId = RouteId

const journeyGuideOrder: JourneyGuideId[] = routeOrder

const journeyGuides: Record<JourneyGuideId, { descriptionKey: string; icon: string; route: RouteId; titleKey: string }> = {
  newRequest: { descriptionKey: "home.lifecycle.guides.newRequest.description", icon: "description", route: "newRequest", titleKey: "home.lifecycle.guides.newRequest.title" },
  replyIssue: { descriptionKey: "home.lifecycle.guides.replyIssue.description", icon: "reply", route: "replyIssue", titleKey: "home.lifecycle.guides.replyIssue.title" },
  noReply: { descriptionKey: "home.lifecycle.guides.noReply.description", icon: "schedule", route: "noReply", titleKey: "home.lifecycle.guides.noReply.title" },
  transferred: { descriptionKey: "home.lifecycle.guides.transferred.description", icon: "swap_horiz", route: "transferred", titleKey: "home.lifecycle.guides.transferred.title" },
  appealIssue: { descriptionKey: "home.lifecycle.guides.appealIssue.description", icon: "gavel", route: "appealIssue", titleKey: "home.lifecycle.guides.appealIssue.title" },
}

const directRoutes: RouteId[] = ["newRequest", "replyIssue", "noReply", "appealIssue"]
const replyRoutes: RouteId[] = ["newRequest", "replyIssue", "transferred", "appealIssue"]
const appealRoutes: RouteId[] = ["replyIssue", "noReply", "appealIssue"]

/**
 * Connectors are listed in the order a person encounters them. Filtering by a selected situation
 * therefore gives the light its traversal order without duplicating the visual decision tree.
 */
const flowEdges: { d: string; routes: RouteId[] }[] = [
  { d: "M 560 62 V 95", routes: routeOrder },
  { d: "M 695 115 H 805 V 155", routes: ["transferred"] },
  { d: "M 805 195 V 215", routes: ["transferred"] },
  { d: "M 560 135 V 260", routes: directRoutes },
  { d: "M 805 255 H 560 V 260", routes: ["transferred"] },
  { d: "M 560 300 V 320", routes: routeOrder },
  { d: "M 560 360 V 372 H 300 V 385", routes: replyRoutes },
  { d: "M 560 360 V 372 H 820 V 385", routes: ["noReply"] },
  { d: "M 300 425 V 445", routes: replyRoutes },
  { d: "M 820 425 V 445", routes: ["noReply"] },
  { d: "M 300 485 V 510", routes: ["newRequest", "transferred"] },
  { d: "M 300 485 V 505 H 560 V 525", routes: ["replyIssue", "appealIssue"] },
  { d: "M 820 485 V 505 H 560 V 525", routes: ["noReply"] },
  { d: "M 820 485 V 497 H 920 V 510", routes: ["noReply"] },
  { d: "M 920 550 V 570", routes: ["noReply"] },
  { d: "M 560 565 V 585", routes: appealRoutes },
  { d: "M 560 625 V 655", routes: appealRoutes },
  { d: "M 560 695 V 715", routes: appealRoutes },
  { d: "M 560 755 V 770 H 350 V 785", routes: ["replyIssue", "noReply"] },
  { d: "M 560 755 V 770 H 740 V 785", routes: ["appealIssue"] },
  { d: "M 740 825 V 840", routes: ["appealIssue"] },
  { d: "M 740 880 V 890 H 560 V 900", routes: ["appealIssue"] },
]

type FlowNodeSpec = {
  className: string
  descriptionKey?: string
  id: string
  routes: RouteId[]
} & (
  | { days: number; kind: "time" }
  | { kind: "node"; labelKey: string; tone?: FlowNodeTone }
)

/** The map has one visible node for every decision or statutory step, regardless of how it was reached. */
const flowNodes: FlowNodeSpec[] = [
  { id: "request", kind: "node", labelKey: "request", className: "left-[455px] top-[22px] w-[210px]", routes: routeOrder },
  { id: "authority", kind: "node", labelKey: "publicAuthority", className: "left-[425px] top-[95px] w-[270px]", routes: routeOrder },

  { id: "transferClock", kind: "time", days: 5, className: "left-[785px] top-[155px]", routes: ["transferred"] },
  { id: "transfer", kind: "node", labelKey: "transfer", className: "left-[745px] top-[215px] w-[120px]", routes: ["transferred"] },

  { id: "responseClock", descriptionKey: "responseClock", kind: "time", days: 30, className: "left-[540px] top-[260px]", routes: routeOrder },
  { id: "replyReceived", kind: "node", labelKey: "replyReceived", tone: "logic", className: "left-[465px] top-[320px] w-[190px]", routes: routeOrder },

  { id: "reply", descriptionKey: "directReply", kind: "node", labelKey: "reply", className: "left-[230px] top-[385px] w-[140px]", routes: replyRoutes },
  { id: "noReply", descriptionKey: "directNoReply", kind: "node", labelKey: "noReply", className: "left-[750px] top-[385px] w-[140px]", routes: ["noReply"] },
  { id: "informationComplete", kind: "node", labelKey: "informationComplete", tone: "logic", className: "left-[220px] top-[445px] w-[160px]", routes: replyRoutes },
  { id: "deemedRefusal", kind: "node", labelKey: "deemedRefusal", tone: "logic", className: "left-[750px] top-[445px] w-[140px]", routes: ["noReply"] },

  { id: "satisfied", descriptionKey: "directSatisfied", kind: "node", labelKey: "satisfied", tone: "satisfied", className: "left-[220px] top-[510px] w-[160px]", routes: ["newRequest", "transferred"] },
  { id: "firstAppealClock", kind: "time", days: 30, className: "left-[540px] top-[525px]", routes: appealRoutes },
  { id: "noTimeLimit", kind: "node", labelKey: "noTimeLimit", tone: "logic", className: "left-[860px] top-[510px] w-[120px]", routes: ["noReply"] },
  { id: "complaint", kind: "node", labelKey: "complaint", tone: "complaint", className: "left-[800px] top-[570px] w-[240px]", routes: ["noReply"] },

  { id: "firstAppeal", kind: "node", labelKey: "firstAppeal", className: "left-[465px] top-[585px] w-[190px]", routes: appealRoutes },
  { id: "appealDecisionClock", descriptionKey: "decisionClock", kind: "time", days: 45, className: "left-[540px] top-[655px]", routes: appealRoutes },
  { id: "appealDecision", descriptionKey: "decision", kind: "node", labelKey: "decision", className: "left-[490px] top-[715px] w-[140px]", routes: appealRoutes },
  { id: "appealSatisfied", kind: "node", labelKey: "satisfied", tone: "satisfied", className: "left-[275px] top-[785px] w-[150px]", routes: ["replyIssue", "noReply"] },
  { id: "appealUnresolved", kind: "node", labelKey: "appealUnresolved", tone: "notSatisfied", className: "left-[650px] top-[785px] w-[180px]", routes: ["appealIssue"] },
  { id: "secondAppealClock", kind: "time", days: 90, className: "left-[720px] top-[840px]", routes: ["appealIssue"] },
  { id: "secondAppeal", kind: "node", labelKey: "secondAppeal", className: "left-[420px] top-[900px] w-[280px]", routes: ["appealIssue"] },
]


/**
 * Every connector is drawn with `M`/`H`/`V` only, so the drawn length is a sum of axis-aligned runs
 * and can be totalled without touching the DOM. Only drawn runs count: the `M` jump that opens a
 * connector moves the pen without adding length, which is what makes the running totals below line
 * up with the distance the sweep has actually travelled.
 */
function measureOrthogonalPath(d: string) {
  let length = 0
  let x = 0
  let y = 0

  for (const token of d.match(/[MHV][^MHV]*/g) ?? []) {
    const values = token.slice(1).trim().split(/\s+/).map(Number)

    if (token[0] === "M") {
      ;[x, y] = values
    } else if (token[0] === "H") {
      length += Math.abs(values[0] - x)
      x = values[0]
    } else {
      length += Math.abs(values[0] - y)
      y = values[0]
    }
  }

  return length
}

const flowLightDash = 46
/** viewBox units per second, so the light travels at one speed no matter how long the route is. */
const flowLightSpeed = 420

/**
 * Each route as its connectors plus how far along the route each one begins, which is the phase the
 * travelling light needs, and as one combined path for the static trace underneath - the trace
 * carries no dash pattern, so it is unaffected by the per-subpath reset the light has to work with.
 */
const routeGeometry = Object.fromEntries(
  routeOrder.map((route) => {
    const segments: { d: string; start: number }[] = []
    let length = 0

    for (const edge of flowEdges) {
      if (edge.routes.includes(route)) {
        segments.push({ d: edge.d, start: length })
        length += measureOrthogonalPath(edge.d)
      }
    }

    return [
      route,
      {
        duration: length / flowLightSpeed,
        length,
        segments,
        trace: segments.map((segment) => segment.d).join(" "),
      },
    ]
  }),
) as Record<RouteId, { duration: number; length: number; segments: { d: string; start: number }[]; trace: string }>

const flowNodeToneClasses: Record<FlowNodeTone, string> = {
  action: "border-primary/70 bg-primary text-on-primary",
  complaint: "border-tertiary/70 bg-tertiary text-on-tertiary",
  logic: "border-outline bg-surface-container-lowest text-on-surface",
  notSatisfied: "border-state-error/70 bg-state-error text-on-primary",
  satisfied: "border-state-success/70 bg-state-success text-on-primary",
}

/**
 * Nodes are buttons purely so they can take hover and keyboard focus - there is nowhere to navigate
 * to. That also lets Base UI wire the description up as `aria-describedby`, so the same sentence a
 * mouse user reads in the tooltip is the one a screen reader announces.
 */
function FlowStep({
  children,
  className,
  description,
  heading,
  onActivate,
  onDismiss,
}: {
  children: React.ReactNode
  className: string
  description: string
  heading: string
  onActivate: () => void
  onDismiss: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            className={className}
            onBlur={onDismiss}
            onFocus={onActivate}
            onPointerEnter={onActivate}
            onPointerLeave={onDismiss}
            type="button"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="top">
        <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{heading}</span>
        <span className="text-xs leading-relaxed">{description}</span>
      </TooltipContent>
    </Tooltip>
  )
}

function FlowEdge({ path }: { path: string }) {
  return (
    <path
      d={path}
      fill="none"
      markerEnd="url(#flow-arrow)"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth="1.5"
    />
  )
}

export function HomePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const flowchartFrameRef = useRef<HTMLDivElement>(null)
  const stepperFrameRef = useRef<HTMLDivElement>(null)
  const [flowchartScale, setFlowchartScale] = useState(1)
  const [isHorizontalStepper, setIsHorizontalStepper] = useState(false)
  const [activeGuide, setActiveGuide] = useState<JourneyGuideId>("newRequest")
  const [hoveredRoute, setHoveredRoute] = useState<RouteId | null>(null)
  const [pinnedRoute, setPinnedRoute] = useState<RouteId | null>(null)
  const viewStatusPath = user ? "/request-history" : "/status"

  const activeRoute = hoveredRoute ?? pinnedRoute ?? journeyGuides[activeGuide].route
  const activeGeometry = routeGeometry[activeRoute]

  useEffect(() => {
    const frame = flowchartFrameRef.current

    if (!frame) {
      return
    }

    const updateScale = () => setFlowchartScale(Math.min(1, frame.clientWidth / flowchartWidth))
    const resizeObserver = new ResizeObserver(updateScale)

    resizeObserver.observe(frame)
    updateScale()

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const frame = stepperFrameRef.current

    if (!frame) {
      return
    }

    const mobileViewport = window.matchMedia("(max-width: 767px)")
    const updateStepperLayout = () => setIsHorizontalStepper(!mobileViewport.matches && frame.clientWidth >= 360)
    const resizeObserver = new ResizeObserver(updateStepperLayout)

    resizeObserver.observe(frame)
    mobileViewport.addEventListener("change", updateStepperLayout)
    updateStepperLayout()

    return () => {
      resizeObserver.disconnect()
      mobileViewport.removeEventListener("change", updateStepperLayout)
    }
  }, [])



  return (
    <>
        <section className="relative -mt-25 overflow-hidden bg-primary-container pb-24 pt-25 text-on-primary md:pb-32">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--primary-foreground)_1px,transparent_1px)] [background-size:24px_24px]" />
          <ServiceUpdateNotice />
          <div className="relative z-10 mx-auto flex max-w-container-max flex-col items-center px-margin-mobile pt-10 text-center md:px-margin-desktop md:pt-12">
            <h1 className="mb-4 max-w-4xl font-display-lg text-headline-lg-mobile font-bold tracking-tight md:text-display-lg">{t("home.title")}</h1>
            <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg opacity-90 md:text-xl">
              {t("home.subtitle")}
            </p>
          </div>
        </section>
        <section className="relative z-20 mx-auto -mt-10 mb-20 max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {actionCards.map(({ icon, key, destination: staticDestination, iconClass }) => {
              const destination = key === "status" ? viewStatusPath : staticDestination
              const title = t(`home.actions.${key}.title`)
              const cardContent = (
                <>
                  <div className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                  {/* Icon beside the title rather than stacked above it: the glyph renders at 24px,
                      so a 56px badge on its own row was costing ~80px of height per card. */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex size-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                      <MaterialIcon className="text-3xl">{icon}</MaterialIcon>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
                  </div>
                  <p className="mb-4 flex-grow font-body-md text-body-md text-on-surface-variant">{t(`home.actions.${key}.description`)}</p>
                  <div className="flex items-center gap-1 font-label-lg text-label-lg text-foreground transition-all group-hover:gap-2">
                    {t(`home.actions.${key}.cta`)} <MaterialIcon className="text-sm">arrow_right_alt</MaterialIcon>
                  </div>
                </>
              )
              const cardClassName = "group relative flex h-full flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md"

              return destination ? (
                <Link className={`${cardClassName} cursor-pointer`} key={title} to={destination}>
                  {cardContent}
                </Link>
              ) : (
                <div className={cardClassName} key={title}>
                  {cardContent}
                </div>
              )
            })}
          </div>
        </section>
        <FirstVisitGuide />
        <section className="border-t border-surface-variant bg-surface py-20">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">{t("home.lifecycle.sectionTitle")}</h2>
              <p className="mx-auto max-w-2xl font-body-md text-body-md text-on-surface-variant">{t("home.lifecycle.sectionDescription")}</p>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-12" ref={stepperFrameRef}>
                {isHorizontalStepper ? (
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-2">
                      {steps.map(([icon, title, body, className], index) => (
                        <div className="relative flex min-w-0 flex-col items-center text-center" key={title}>
                          {index < steps.length - 1 && (
                            // The 48px icon has a 24px radius. Inset the line a further 14px at
                            // each end so it visually connects the steps without ever touching an icon.
                            <div aria-hidden="true" className="absolute left-[calc(50%+38px)] right-[calc(-50%+30px)] top-6 h-px bg-outline-variant" />
                          )}
                          <div className={`z-10 flex size-12 items-center justify-center rounded-full border-2 transition-colors ${className}`}>
                            <MaterialIcon className="text-2xl">{icon}</MaterialIcon>
                          </div>
                          <h4 className="mt-3 font-label-lg text-xs leading-tight text-primary">{t(title)}</h4>
                          <p className="mt-2 text-[11px] leading-4 text-on-surface-variant">{t(body)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                      {steps.map(([icon, title, body, className], index) => (
                      <div className="relative flex items-start gap-4" key={title}>
                        {index < steps.length - 1 && (
                          // 14px clear of the current icon's bottom and the next icon's top.
                          <div aria-hidden="true" className="absolute bottom-[-6px] left-6 top-[62px] z-0 w-px bg-outline-variant" />
                        )}
                        <div className={`z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${className}`}>
                          <MaterialIcon className="text-2xl">{icon}</MaterialIcon>
                        </div>
                        <div className="min-w-0 pt-1">
                          <h4 className="font-headline-md text-base leading-tight text-primary">{t(title)}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{t(body)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="lg:col-span-12">
                <Card className="h-full gap-0 border border-outline-variant bg-surface-container-high py-0 shadow-none">
                  <CardHeader className="gap-3 border-b border-outline-variant px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="font-headline-md text-xl text-primary">{t("home.lifecycle.cardTitle")}</CardTitle>
                        <CardDescription className="mt-1 text-sm text-on-surface-variant">{t("home.lifecycle.cardDescription")}</CardDescription>
                      </div>
                      <Badge className="border-primary/20 bg-primary-fixed text-primary" variant="outline">{t("home.lifecycle.processMap")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-0">
                    <div className="border-b border-outline-variant px-6 py-5">
                      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div>
                          <p className="font-label-lg text-sm font-semibold text-primary">{t("home.lifecycle.guideTitle")}</p>
                          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{t("home.lifecycle.guideDescription")}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-medium text-primary">
                          {t("home.lifecycle.guideCurrent")}: {t(journeyGuides[activeGuide].titleKey)}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {journeyGuideOrder.map((guideId) => {
                          const guide = journeyGuides[guideId]
                          const isSelected = activeGuide === guideId

                          return (
                            <button
                              aria-pressed={isSelected}
                              className={[
                                "group flex min-h-[108px] items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected
                                  ? "border-primary bg-primary-fixed text-primary"
                                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40",
                              ].join(" ")}
                              key={guideId}
                              onClick={() => {
                                setActiveGuide(guideId)
                                setPinnedRoute(null)
                              }}
                              type="button"
                            >
                              <span className={[
                                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                                isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high text-primary",
                              ].join(" ")}>
                                <MaterialIcon className="text-base">{guide.icon}</MaterialIcon>
                              </span>
                              <span>
                                <span className="block text-sm font-semibold leading-tight">{t(guide.titleKey)}</span>
                                <span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">{t(guide.descriptionKey)}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-3 text-xs text-on-surface-variant">{t("home.lifecycle.mapHint")}</p>
                    </div>
                    <div className="px-4 pb-4 pt-2 sm:px-5">
                      <div
                        className="relative w-full"
                        ref={flowchartFrameRef}
                        style={{ height: `${flowchartHeight * flowchartScale}px` }}
                      >
                      <div
                        aria-label={t("home.lifecycle.cardTitle")}
                        className="absolute left-1/2 top-0 h-[970px] w-[1120px] origin-top"
                        role="group"
                        style={{ transform: `translateX(-50%) scale(${flowchartScale})` }}
                      >
                        <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 1120 970">
                          <defs>
                            <marker id="flow-arrow" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                              <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" />
                            </marker>
                          </defs>
                          <g className="text-outline opacity-30">
                            {flowEdges.map((edge) => (
                              <FlowEdge key={edge.d} path={edge.d} />
                            ))}
                          </g>
                          {/* The wire, then the spark. The palette is greyscale apart from the
                              status colours, so the gold of --flow-light is the only hue on the
                              map that means motion rather than an outcome. */}
                          <path
                            className="text-primary"
                            d={activeGeometry.trace}
                            fill="none"
                            opacity="0.5"
                            stroke="currentColor"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            strokeWidth="2.5"
                          />
                          {activeGeometry.segments.map((segment, index) => (
                            <path
                              className="rti-flow-light text-flow-light"
                              d={segment.d}
                              fill="none"
                              key={`${activeRoute}-${index}`}
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="3.5"
                              style={{
                                "--rti-flow-dash": `${flowLightDash}px`,
                                "--rti-flow-length": `${activeGeometry.length}px`,
                                "--rti-flow-start": `${segment.start}px`,
                                animationDuration: `${activeGeometry.duration}s`,
                              } as CSSProperties}
                            />
                          ))}
                        </svg>

                        {flowNodes.map((node) => {
                          const isOnActiveRoute = node.routes.includes(activeRoute)
                          const focusRoute = isOnActiveRoute ? activeRoute : node.routes[0]
                          const activate = () => setHoveredRoute(focusRoute)
                          const dismiss = () => setHoveredRoute(null)
                          const emphasis = isOnActiveRoute
                            ? "opacity-100 ring-2 ring-primary/60 ring-offset-1 ring-offset-surface-container-high"
                            : "opacity-40 saturate-50"
                          const description = t(`home.lifecycle.nodes.${node.descriptionKey ?? node.id}`)

                          if (node.kind === "time") {
                            return (
                              <FlowStep
                                className={`absolute flex w-[100px] cursor-help items-center gap-2 rounded-full transition-[opacity,box-shadow] duration-200 focus-visible:outline-none ${node.className} ${
                                  isOnActiveRoute ? "opacity-100" : "opacity-40 saturate-50"
                                }`}
                                description={description}
                                heading={`${node.days} ${t("home.lifecycle.graph.days")}`}
                                key={node.id}
                                onActivate={activate}
                                onDismiss={dismiss}
                              >
                                <span className={`flex size-10 items-center justify-center rounded-full bg-on-surface text-sm font-bold text-surface-container-lowest shadow-sm transition-shadow ${isOnActiveRoute ? "ring-2 ring-primary/60" : ""}`}>
                                  {node.days}
                                </span>
                                <span className="text-sm font-medium text-on-surface-variant">{t("home.lifecycle.graph.days")}</span>
                              </FlowStep>
                            )
                          }

                          const label = t(`home.lifecycle.graph.${node.labelKey}`)

                          return (
                            <FlowStep
                              className={`absolute flex h-10 cursor-help items-center justify-center rounded-md border px-3 text-center text-sm font-semibold uppercase leading-tight shadow-sm transition-[opacity,box-shadow] duration-200 focus-visible:outline-none ${flowNodeToneClasses[node.tone ?? "action"]} ${node.className} ${emphasis}`}
                              description={description}
                              heading={label}
                              key={node.id}
                              onActivate={activate}
                              onDismiss={dismiss}
                            >
                              <span className="whitespace-pre-line">{label}</span>
                            </FlowStep>
                          )
                        })}
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
