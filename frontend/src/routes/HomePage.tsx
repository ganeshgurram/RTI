import { useEffect, useRef, useState } from "react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/auth/AuthContext"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const actionCards = [
  { icon: "description", key: "request", destination: "/submit-request", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "gavel", key: "firstAppeal", destination: "/submit-first-appeal", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "manage_search", key: "status", iconClass: "bg-secondary text-secondary-foreground" },
  { icon: "balance", key: "secondAppeal", destination: "/second-appeal", iconClass: "bg-secondary text-secondary-foreground" },
]

const flowchartWidth = 1120
const flowchartHeight = 970

const steps = [
  ["person", "home.lifecycle.steps.citizenTitle", "home.lifecycle.steps.citizenDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["account_balance", "home.lifecycle.steps.nodalTitle", "home.lifecycle.steps.nodalDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["assignment_ind", "home.lifecycle.steps.cpioTitle", "home.lifecycle.steps.cpioDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["mark_email_read", "home.lifecycle.steps.respondsTitle", "home.lifecycle.steps.respondsDescription", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
]

type FlowNodeTone = "action" | "complaint" | "logic" | "notSatisfied" | "satisfied"

/**
 * The five end-to-end journeys a request can take through the map. Every connector belongs to at
 * least one of them, so lighting each route in turn eventually traces the whole diagram.
 */
type RouteId = "answered" | "transferred" | "appealRefused" | "ignored" | "complaint"

const routeOrder: RouteId[] = ["answered", "transferred", "appealRefused", "ignored", "complaint"]

/**
 * Connectors, in source order, sorted by the y of where each one starts. Because the map only ever
 * flows downwards, that ordering is a topological sort of the whole graph at once - so filtering
 * this list by route yields that route's connectors already in traversal order, with no per-route
 * sequencing to keep in sync.
 */
const flowEdges: { d: string; routes: RouteId[] }[] = [
  { d: "M 560 62 V 78 H 113 V 100", routes: ["answered"] },
  { d: "M 560 62 V 100", routes: ["transferred", "appealRefused", "complaint"] },
  { d: "M 560 62 V 78 H 935 V 100", routes: ["ignored"] },
  { d: "M 113 140 V 160", routes: ["answered"] },
  { d: "M 560 140 V 160", routes: ["transferred", "appealRefused", "complaint"] },
  { d: "M 935 140 V 160", routes: ["ignored"] },
  { d: "M 113 200 V 225", routes: ["answered"] },
  { d: "M 560 200 V 220 H 395 V 245", routes: ["transferred", "appealRefused"] },
  { d: "M 560 200 V 220 H 677 V 245", routes: ["complaint"] },
  { d: "M 935 200 V 365 H 770 V 380", routes: ["ignored"] },
  { d: "M 395 285 V 300", routes: ["transferred", "appealRefused"] },
  { d: "M 677 285 V 300", routes: ["complaint"] },
  { d: "M 395 340 V 355", routes: ["transferred", "appealRefused"] },
  { d: "M 677 340 V 365 H 770 V 380", routes: ["complaint"] },
  { d: "M 395 395 V 415", routes: ["transferred", "appealRefused"] },
  { d: "M 770 420 V 450 H 678 V 480", routes: ["ignored"] },
  { d: "M 770 420 V 450 H 920 V 480", routes: ["complaint"] },
  { d: "M 395 455 V 530 H 560 V 550", routes: ["transferred", "appealRefused"] },
  { d: "M 920 520 V 535", routes: ["complaint"] },
  { d: "M 678 520 V 530 H 560 V 550", routes: ["ignored"] },
  { d: "M 560 590 V 605 H 405 V 620", routes: ["transferred", "appealRefused"] },
  { d: "M 560 590 V 605 H 720 V 620", routes: ["ignored"] },
  { d: "M 405 660 V 680", routes: ["transferred", "appealRefused"] },
  { d: "M 720 660 V 680", routes: ["ignored"] },
  { d: "M 405 720 V 755 H 330 V 785", routes: ["transferred"] },
  { d: "M 405 720 V 755 H 535 V 785", routes: ["appealRefused"] },
  { d: "M 720 720 V 750", routes: ["ignored"] },
  { d: "M 720 790 V 895 H 560 V 910", routes: ["ignored"] },
  { d: "M 535 825 V 845", routes: ["appealRefused"] },
  { d: "M 535 885 V 895 H 560 V 910", routes: ["appealRefused"] },
]

type FlowNodeSpec = {
  className: string
  id: string
  routes: RouteId[]
} & (
  | { days: number; kind: "time" }
  | { kind: "node"; labelKey: string; tone?: FlowNodeTone }
)

/** `routes` is listed in `routeOrder` order so that `routes[0]` is the route a node falls back to. */
const flowNodes: FlowNodeSpec[] = [
  { id: "request", kind: "node", labelKey: "request", className: "left-[455px] top-[22px] w-[210px]", routes: routeOrder },

  { id: "directClock", kind: "time", days: 30, className: "left-[93px] top-[100px]", routes: ["answered"] },
  { id: "directReply", kind: "node", labelKey: "reply", className: "left-[43px] top-[160px] w-[140px]", routes: ["answered"] },
  { id: "directSatisfied", kind: "node", labelKey: "satisfied", tone: "satisfied", className: "left-[33px] top-[225px] w-[160px]", routes: ["answered"] },

  { id: "transferClock", kind: "time", days: 5, className: "left-[540px] top-[100px]", routes: ["transferred", "appealRefused", "complaint"] },
  { id: "transfer", kind: "node", labelKey: "transfer", className: "left-[490px] top-[160px] w-[140px]", routes: ["transferred", "appealRefused", "complaint"] },

  { id: "transferReplyClock", kind: "time", days: 30, className: "left-[375px] top-[245px]", routes: ["transferred", "appealRefused"] },
  { id: "transferReply", kind: "node", labelKey: "reply", className: "left-[330px] top-[300px] w-[130px]", routes: ["transferred", "appealRefused"] },
  { id: "transferNotSatisfied", kind: "node", labelKey: "notSatisfied", tone: "notSatisfied", className: "left-[310px] top-[355px] w-[170px]", routes: ["transferred", "appealRefused"] },
  { id: "firstAppealClock", kind: "time", days: 30, className: "left-[375px] top-[415px]", routes: ["transferred", "appealRefused"] },

  { id: "transferNoReplyClock", kind: "time", days: 30, className: "left-[657px] top-[245px]", routes: ["complaint"] },
  { id: "transferNoReply", kind: "node", labelKey: "noReply", className: "left-[605px] top-[300px] w-[144px]", routes: ["complaint"] },

  { id: "directNoReplyClock", kind: "time", days: 30, className: "left-[915px] top-[100px]", routes: ["ignored"] },
  { id: "directNoReply", kind: "node", labelKey: "noReply", className: "left-[865px] top-[160px] w-[140px]", routes: ["ignored"] },

  { id: "deemedRefusal", kind: "node", labelKey: "and", tone: "logic", className: "left-[735px] top-[380px] w-[70px]", routes: ["ignored", "complaint"] },
  { id: "deemedAppealClock", kind: "time", days: 30, className: "left-[658px] top-[480px]", routes: ["ignored"] },
  { id: "noTimeLimit", kind: "node", labelKey: "noTimeLimit", tone: "logic", className: "left-[860px] top-[480px] w-[120px]", routes: ["complaint"] },
  { id: "complaint", kind: "node", labelKey: "complaint", tone: "complaint", className: "left-[800px] top-[535px] w-[240px]", routes: ["complaint"] },

  { id: "firstAppeal", kind: "node", labelKey: "firstAppeal", className: "left-[465px] top-[550px] w-[190px]", routes: ["transferred", "appealRefused", "ignored"] },
  { id: "decisionClock", kind: "time", days: 45, className: "left-[385px] top-[620px]", routes: ["transferred", "appealRefused"] },
  { id: "decision", kind: "node", labelKey: "decision", className: "left-[335px] top-[680px] w-[140px]", routes: ["transferred", "appealRefused"] },
  { id: "appealSatisfied", kind: "node", labelKey: "satisfied", tone: "satisfied", className: "left-[255px] top-[785px] w-[150px]", routes: ["transferred"] },
  { id: "appealNotSatisfied", kind: "node", labelKey: "notSatisfied", tone: "notSatisfied", className: "left-[450px] top-[785px] w-[170px]", routes: ["appealRefused"] },
  { id: "secondAppealClock", kind: "time", days: 90, className: "left-[515px] top-[845px]", routes: ["appealRefused"] },

  { id: "noDecisionClock", kind: "time", days: 45, className: "left-[700px] top-[620px]", routes: ["ignored"] },
  { id: "noDecision", kind: "node", labelKey: "noDecision", className: "left-[645px] top-[680px] w-[150px]", routes: ["ignored"] },
  { id: "noDecisionSecondAppealClock", kind: "time", days: 90, className: "left-[700px] top-[750px]", routes: ["ignored"] },
  { id: "secondAppeal", kind: "node", labelKey: "secondAppeal", className: "left-[420px] top-[910px] w-[280px]", routes: ["appealRefused", "ignored"] },
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
  const { openRequestGuidelines } = useRequestGuidelines()
  const { t } = useTranslation()
  const flowchartFrameRef = useRef<HTMLDivElement>(null)
  const stepperFrameRef = useRef<HTMLDivElement>(null)
  const [flowchartScale, setFlowchartScale] = useState(1)
  const [isHorizontalStepper, setIsHorizontalStepper] = useState(false)
  const [cycleIndex, setCycleIndex] = useState(0)
  const [hoveredRoute, setHoveredRoute] = useState<RouteId | null>(null)
  const [pinnedRoute, setPinnedRoute] = useState<RouteId | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const viewStatusPath = user ? "/request-history" : "/status"

  const activeRoute = hoveredRoute ?? pinnedRoute ?? routeOrder[cycleIndex]
  const activeGeometry = routeGeometry[activeRoute]
  const isCyclePaused = hoveredRoute !== null || pinnedRoute !== null || prefersReducedMotion

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

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotionPreference = () => setPrefersReducedMotion(reducedMotion.matches)

    updateMotionPreference()
    reducedMotion.addEventListener("change", updateMotionPreference)

    return () => reducedMotion.removeEventListener("change", updateMotionPreference)
  }, [])

  // Hold each route on screen for one full sweep of the light, then hand over to the next one.
  useEffect(() => {
    if (isCyclePaused) {
      return
    }

    const timer = window.setTimeout(
      () => setCycleIndex((index) => (index + 1) % routeOrder.length),
      (routeGeometry[routeOrder[cycleIndex]].duration + 0.7) * 1000,
    )

    return () => window.clearTimeout(timer)
  }, [cycleIndex, isCyclePaused])

  return (
    <>
        <section className="relative -mt-25 overflow-hidden bg-primary-container pb-24 pt-41 text-on-primary md:pb-32 md:pt-49">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--primary-foreground)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-10 mx-auto flex max-w-container-max flex-col items-center px-margin-mobile text-center md:px-margin-desktop">
            <h1 className="mb-4 max-w-4xl font-display-lg text-headline-lg-mobile font-bold tracking-tight md:text-display-lg">{t("home.title")}</h1>
            <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg opacity-90 md:text-xl">
              {t("home.subtitle")}
            </p>
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-8 py-3 font-label-lg text-label-lg text-on-secondary shadow-md transition-colors hover:bg-secondary/90 sm:w-auto" onClick={() => openRequestGuidelines()} type="button">
                {t("home.submitRequest")} <MaterialIcon className="text-sm">arrow_forward</MaterialIcon>
              </button>
              <Link className="w-full rounded-lg border border-surface-container-highest/30 bg-surface-container/10 px-8 py-3 font-label-lg text-label-lg text-on-primary backdrop-blur-sm transition-colors hover:bg-surface-container/20 sm:w-auto" to={viewStatusPath}>
                {t("nav.viewStatus")}
              </Link>
            </div>
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
                    <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant px-6 py-4">
                      {routeOrder.map((route) => {
                        const isActive = activeRoute === route
                        const isPinned = pinnedRoute === route

                        return (
                          <button
                            aria-pressed={isPinned}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? "border-primary bg-primary-fixed text-primary"
                                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                            }`}
                            key={route}
                            onBlur={() => setHoveredRoute(null)}
                            onClick={() => setPinnedRoute(isPinned ? null : route)}
                            onFocus={() => setHoveredRoute(route)}
                            onPointerEnter={() => setHoveredRoute(route)}
                            onPointerLeave={() => setHoveredRoute(null)}
                            type="button"
                          >
                            <span aria-hidden="true" className={`size-2 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-outline-variant"}`} />
                            {t(`home.lifecycle.routes.${route}`)}
                          </button>
                        )
                      })}
                      <span className="ml-auto hidden text-xs text-on-surface-variant lg:inline">{t("home.lifecycle.routeHint")}</span>
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
                          const description = t(`home.lifecycle.nodes.${node.id}`)

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
