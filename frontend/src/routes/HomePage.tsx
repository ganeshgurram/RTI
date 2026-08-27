import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/auth/AuthContext"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesDialog"
import { MaterialIcon } from "@/routes/stitch-shell"

const actionCards = [
  ["description", "Submit Request", "File a new RTI application online to seek information from Ministries/Departments of the Government of India.", "Start Application", "bg-secondary text-secondary-foreground"],
  ["gavel", "Submit First Appeal", "File a first appeal if you are not satisfied with the reply to your RTI application or have not received a response.", "File Appeal", "bg-secondary text-secondary-foreground"],
  ["manage_search", "View Status", "Track the current status of your previously submitted RTI application or first appeal using your registration number.", "View Status", "bg-secondary text-secondary-foreground"],
  ["balance", "Submit Second Appeal", "Submit a second appeal to the Commission if you are not satisfied with the decision of the First Appellate Authority.", "Submit Second Appeal", "bg-secondary text-secondary-foreground"],
]

const flowchartWidth = 1120
const flowchartHeight = 970

const steps = [
  ["person", "1. Citizen Submits Request", "Applicant files RTI request online and pays the prescribed fee through the secure portal.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["account_balance", "2. Nodal Officer Receives", "Nodal Officer of the concerned Ministry/Department receives and validates the request.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["assignment_ind", "3. Forwarded to CPIO", "The request is assigned to the Central Public Information Officer (CPIO) for processing.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["mark_email_read", "4. CPIO Responds", "CPIO provides the requested information to the citizen within the statutory 30-day period.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
]

type FlowNodeTone = "action" | "complaint" | "logic" | "notSatisfied" | "satisfied"

const flowNodeToneClasses: Record<FlowNodeTone, string> = {
  action: "border-primary/70 bg-primary text-on-primary",
  complaint: "border-tertiary/70 bg-tertiary text-on-tertiary",
  logic: "border-outline bg-surface-container-lowest text-on-surface",
  notSatisfied: "border-state-error/70 bg-state-error text-on-primary",
  satisfied: "border-state-success/70 bg-state-success text-on-primary",
}

function FlowNode({
  label,
  className,
  tone = "action",
}: {
  label: string
  className: string
  tone?: FlowNodeTone
}) {
  return (
    <div className={`absolute flex h-10 items-center justify-center rounded-md border px-3 text-center text-sm font-semibold uppercase leading-tight shadow-sm ${flowNodeToneClasses[tone]} ${className}`}>
      <span className="whitespace-pre-line">{label}</span>
    </div>
  )
}

function TimeNode({ days, className }: { days: number; className: string }) {
  return (
    <div className={`absolute flex w-[100px] items-center gap-2 ${className}`}>
      <span className="flex size-10 items-center justify-center rounded-full bg-on-surface text-sm font-bold text-surface-container-lowest shadow-sm">{days}</span>
      <span className="text-sm font-medium text-on-surface-variant">Days</span>
    </div>
  )
}

function StatusNode({ label, className, status }: { label: string; className: string; status: "satisfied" | "notSatisfied" }) {
  return <FlowNode className={className} label={label} tone={status} />
}

function FlowEdge({ path, arrow = true }: { path: string; arrow?: boolean }) {
  return (
    <path
      d={path}
      fill="none"
      markerEnd={arrow ? "url(#flow-arrow)" : undefined}
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
  const flowchartFrameRef = useRef<HTMLDivElement>(null)
  const stepperFrameRef = useRef<HTMLDivElement>(null)
  const [flowchartScale, setFlowchartScale] = useState(1)
  const [isHorizontalStepper, setIsHorizontalStepper] = useState(false)
  const viewStatusPath = user ? "/request-history" : "/status"

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
        <section className="relative -mt-25 overflow-hidden bg-primary-container pb-24 pt-41 text-on-primary md:pb-32 md:pt-49">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--primary-foreground)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-10 mx-auto flex max-w-container-max flex-col items-center px-margin-mobile text-center md:px-margin-desktop">
            <h1 className="mb-4 max-w-4xl font-display-lg text-headline-lg-mobile font-bold tracking-tight text-shadow md:text-display-lg">Right to Information Online</h1>
            <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg text-on-primary-container opacity-90 md:text-xl">
              An initiative of Department of Personnel & Training, Government of India, empowering citizens to seek information and promote transparency in governance.
            </p>
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-8 py-3 font-label-lg text-label-lg text-on-secondary shadow-md transition-colors hover:bg-secondary/90 sm:w-auto" onClick={() => openRequestGuidelines()} type="button">
                Submit a Request <MaterialIcon className="text-sm">arrow_forward</MaterialIcon>
              </button>
              <Link className="w-full rounded-lg border border-surface-container-highest/30 bg-surface-container/10 px-8 py-3 font-label-lg text-label-lg text-on-primary backdrop-blur-sm transition-colors hover:bg-surface-container/20 sm:w-auto" to={viewStatusPath}>
                View Status
              </Link>
            </div>
          </div>
        </section>
        <section className="relative z-20 mx-auto -mt-10 mb-20 max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {actionCards.map(([icon, title, body, cta, iconClass]) => {
              const destination = title === "Submit Request"
                ? "/submit-request"
                : title === "Submit First Appeal"
                  ? "/submit-first-appeal"
                : title === "View Status"
                  ? viewStatusPath
                  : title === "Submit Second Appeal"
                    ? "/second-appeal"
                    : null
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
                  <p className="mb-4 flex-grow font-body-md text-body-md text-on-surface-variant">{body}</p>
                  <div className="flex items-center gap-1 font-label-lg text-label-lg text-foreground transition-all group-hover:gap-2">
                    {cta} <MaterialIcon className="text-sm">arrow_right_alt</MaterialIcon>
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
              <h2 className="mb-4 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">RTI Request Life Cycle</h2>
              <p className="mx-auto max-w-2xl font-body-md text-body-md text-on-surface-variant">Understanding the process of your Right to Information application from submission to resolution.</p>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-12" ref={stepperFrameRef}>
                {isHorizontalStepper ? (
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-2">
                      {steps.map(([icon, title, body, className], index) => (
                        <div className="relative flex min-w-0 flex-col items-center text-center" key={title}>
                          {index < steps.length - 1 && (
                            <div aria-hidden="true" className="absolute left-[calc(50%+24px)] right-[calc(-50%+16px)] top-6 h-px bg-outline-variant" />
                          )}
                          <div className={`z-10 flex size-12 items-center justify-center rounded-full border-2 transition-colors ${className}`}>
                            <MaterialIcon className="text-2xl">{icon}</MaterialIcon>
                          </div>
                          <h4 className="mt-3 font-label-lg text-xs leading-tight text-primary">{title}</h4>
                          <p className="mt-2 text-[11px] leading-4 text-on-surface-variant">{body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {steps.map(([icon, title, body, className], index) => (
                      <div className="relative flex items-start gap-4" key={title}>
                        {index < steps.length - 1 && (
                          <div aria-hidden="true" className="absolute bottom-[-20px] left-6 top-12 z-0 w-px bg-outline-variant" />
                        )}
                        <div className={`z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${className}`}>
                          <MaterialIcon className="text-2xl">{icon}</MaterialIcon>
                        </div>
                        <div className="min-w-0 pt-1">
                          <h4 className="font-headline-md text-base leading-tight text-primary">{title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{body}</p>
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
                        <CardTitle className="font-headline-md text-xl text-primary">RTI Request Lifecycle</CardTitle>
                        <CardDescription className="mt-1 text-sm text-on-surface-variant">Timeline and escalation process under the Right to Information framework.</CardDescription>
                      </div>
                      <Badge className="border-primary/20 bg-primary-fixed text-primary" variant="outline">Process map</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-0">
                    <div className="px-4 pb-4 pt-2 sm:px-5">
                      <div
                        className="relative w-full"
                        ref={flowchartFrameRef}
                        style={{ height: `${flowchartHeight * flowchartScale}px` }}
                      >
                      <div
                        aria-label="RTI request lifecycle flowchart"
                        className="absolute left-1/2 top-0 h-[970px] w-[1120px] origin-top"
                        role="img"
                        style={{ transform: `translateX(-50%) scale(${flowchartScale})` }}
                      >
                        <svg aria-hidden="true" className="absolute inset-0 size-full text-outline" viewBox="0 0 1120 970">
                          <defs>
                            <marker id="flow-arrow" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3">
                              <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" />
                            </marker>
                          </defs>
                          <FlowEdge path="M 560 62 V 78 H 113 V 100" />
                          <FlowEdge path="M 560 62 V 100" />
                          <FlowEdge path="M 560 62 V 78 H 935 V 100" />
                          <FlowEdge path="M 113 140 V 160" />
                          <FlowEdge path="M 113 200 V 225" />
                          <FlowEdge path="M 560 140 V 160" />
                          <FlowEdge path="M 560 200 V 220 H 395 V 245" />
                          <FlowEdge path="M 560 200 V 220 H 677 V 245" />
                          <FlowEdge path="M 395 285 V 300" />
                          <FlowEdge path="M 395 340 V 355" />
                          <FlowEdge path="M 395 395 V 415" />
                          <FlowEdge path="M 677 285 V 300" />
                          <FlowEdge path="M 677 340 V 365 H 770 V 380" />
                          <FlowEdge path="M 935 140 V 160" />
                          <FlowEdge path="M 935 200 V 365 H 770 V 380" />
                          <FlowEdge path="M 770 420 V 450 H 678 V 480" />
                          <FlowEdge path="M 770 420 V 450 H 920 V 480" />
                          <FlowEdge path="M 920 520 V 535" />
                          <FlowEdge path="M 678 520 V 530 H 560 V 550" />
                          <FlowEdge path="M 395 455 V 530 H 560 V 550" />
                          <FlowEdge path="M 560 590 V 605 H 405 V 620" />
                          <FlowEdge path="M 560 590 V 605 H 720 V 620" />
                          <FlowEdge path="M 405 660 V 680" />
                          <FlowEdge path="M 405 720 V 755 H 330 V 785" />
                          <FlowEdge path="M 405 720 V 755 H 535 V 785" />
                          <FlowEdge path="M 535 825 V 845" />
                          <FlowEdge path="M 720 660 V 680" />
                          <FlowEdge path="M 720 720 V 750" />
                          <FlowEdge path="M 720 790 V 895 H 560 V 910" />
                          <FlowEdge path="M 535 885 V 895 H 560 V 910" />
                        </svg>

                        <FlowNode className="left-[455px] top-[22px] w-[210px]" label="RTI Request" />

                        <TimeNode className="left-[93px] top-[100px]" days={30} />
                        <FlowNode className="left-[43px] top-[160px] w-[140px]" label="Reply" />
                        <StatusNode className="left-[33px] top-[225px] w-[160px]" label="Satisfied" status="satisfied" />

                        <TimeNode className="left-[540px] top-[100px]" days={5} />
                        <FlowNode className="left-[490px] top-[160px] w-[140px]" label="Transfer" />
                        <TimeNode className="left-[375px] top-[245px]" days={30} />
                        <FlowNode className="left-[330px] top-[300px] w-[130px]" label="Reply" />
                        <StatusNode className="left-[310px] top-[355px] w-[170px]" label="Not Satisfied" status="notSatisfied" />
                        <TimeNode className="left-[375px] top-[415px]" days={30} />

                        <TimeNode className="left-[657px] top-[245px]" days={30} />
                        <FlowNode className="left-[605px] top-[300px] w-[144px]" label="No Reply" />

                        <TimeNode className="left-[915px] top-[100px]" days={30} />
                        <FlowNode className="left-[865px] top-[160px] w-[140px]" label="No Reply" />
                        <FlowNode className="left-[735px] top-[380px] w-[70px]" label="And" tone="logic" />
                        <TimeNode className="left-[658px] top-[480px]" days={30} />
                        <FlowNode className="left-[860px] top-[480px] w-[120px]" label={"No Time\nLimit"} tone="logic" />
                        <FlowNode className="left-[800px] top-[535px] w-[240px]" label="Section 18 Complaint to CIC" tone="complaint" />

                        <FlowNode className="left-[465px] top-[550px] w-[190px]" label="First Appeal" />
                        <TimeNode className="left-[385px] top-[620px]" days={45} />
                        <FlowNode className="left-[335px] top-[680px] w-[140px]" label="Decision" />
                        <StatusNode className="left-[255px] top-[785px] w-[150px]" label="Satisfied" status="satisfied" />
                        <StatusNode className="left-[450px] top-[785px] w-[170px]" label="Not Satisfied" status="notSatisfied" />
                        <TimeNode className="left-[515px] top-[845px]" days={90} />

                        <TimeNode className="left-[700px] top-[620px]" days={45} />
                        <FlowNode className="left-[645px] top-[680px] w-[150px]" label="No Decision" />
                        <TimeNode className="left-[700px] top-[750px]" days={90} />
                        <FlowNode className="left-[420px] top-[910px] w-[280px]" label="Second Appeal to CIC / SIC" />
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
