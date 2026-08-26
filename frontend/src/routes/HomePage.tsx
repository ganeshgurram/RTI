import { Link } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

const lifecycleImage =
  "https://lh3.googleusercontent.com/aida/AEtjO1XPWtnb1Mt9gIdZnJ9xW7aDk5fXFpzSTTK7QdqtXw1cdoHNjyZnxggOUe5VoeZPfAR4Y1z3ECEQngY8lFQVOHyZ1qD8LzGVZc-IF90rEzNzQfnpAWniQRyUyjQ1qsEWcjWpnqIewL4qo6fTyxomu8FbT6ftTCJ938ZKkN6fk8bXf6zzJ-I7vIYtyZimWN5wSF2HbUTg8d7TQ2AAIoDBQbz5okjxHePjetklCUdvpU0RfMyz2WBxEna0L1aY"

const actionCards = [
  ["description", "Submit Request", "File a new RTI application online to seek information from Ministries/Departments of the Government of India.", "Start Application", "bg-primary-fixed/30 text-primary"],
  ["gavel", "Submit First Appeal", "File a first appeal if you are not satisfied with the reply to your RTI application or have not received a response.", "File Appeal", "bg-secondary text-secondary-foreground"],
  ["manage_search", "View Status", "Track the current status of your previously submitted RTI application or first appeal using your registration number.", "Submit Second Appeal", "bg-tertiary-fixed-dim/30 text-tertiary"],
  ["balance", "Submit Second Appeal", "Submit a second appeal to the Commission if you are not satisfied with the decision of the First Appellate Authority.", "Submit Second Appeal", "bg-secondary text-secondary-foreground"],
]

const steps = [
  ["person", "1. Citizen Submits Request", "Applicant files RTI request online and pays the prescribed fee through the secure portal.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["account_balance", "2. Nodal Officer Receives", "Nodal Officer of the concerned Ministry/Department receives and validates the request.", "border-primary bg-primary-fixed/20 text-primary group-hover:bg-primary group-hover:text-on-primary"],
  ["assignment_ind", "3. Forwarded to CPIO", "The request is assigned to the Central Public Information Officer (CPIO) for processing.", "border-border bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground"],
  ["mark_email_read", "4. CPIO Responds", "CPIO provides the requested information to the citizen within the statutory 30-day period.", "border-state-success bg-state-success/10 text-state-success group-hover:bg-state-success group-hover:text-on-primary"],
]

export function HomePage() {
  return (
    <>
        <section className="relative overflow-hidden bg-primary-container py-24 text-on-primary md:py-32">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(var(--primary-foreground)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-10 mx-auto flex max-w-container-max flex-col items-center px-margin-mobile text-center md:px-margin-desktop">
            <span className="mb-6 inline-block rounded-full border border-secondary/30 bg-secondary/20 px-3 py-1 font-label-sm text-label-sm text-secondary-fixed">Version 2.0</span>
            <h1 className="mb-4 max-w-4xl font-display-lg text-headline-lg-mobile font-bold tracking-tight text-shadow md:text-display-lg">Right to Information Online</h1>
            <p className="mx-auto mb-10 max-w-2xl font-body-lg text-body-lg text-on-primary-container opacity-90 md:text-xl">
              An initiative of Department of Personnel & Training, Government of India, empowering citizens to seek information and promote transparency in governance.
            </p>
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
              <Link className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-8 py-3 font-label-lg text-label-lg text-on-secondary shadow-md transition-colors hover:bg-secondary/90 sm:w-auto" to="/login">
                Submit a Request <MaterialIcon className="text-sm">arrow_forward</MaterialIcon>
              </Link>
              <Link className="w-full rounded-lg border border-surface-container-highest/30 bg-surface-container/10 px-8 py-3 font-label-lg text-label-lg text-on-primary backdrop-blur-sm transition-colors hover:bg-surface-container/20 sm:w-auto" to="/profile">
                View Status
              </Link>
            </div>
          </div>
        </section>
        <section className="relative z-20 mx-auto -mt-10 mb-20 max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {actionCards.map(([icon, title, body, cta, iconClass]) => (
              <div className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest p-8 shadow-sm transition-shadow hover:shadow-md" key={title}>
                <div className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                <div className={`mb-6 flex size-14 items-center justify-center rounded-full ${iconClass}`}>
                  <MaterialIcon className="text-3xl">{icon}</MaterialIcon>
                </div>
                <h3 className="mb-3 font-headline-md text-headline-md text-primary">{title}</h3>
                <p className="mb-6 flex-grow font-body-md text-body-md text-on-surface-variant">{body}</p>
                <div className="flex items-center gap-1 font-label-lg text-label-lg text-foreground transition-all group-hover:gap-2">
                  {cta} <MaterialIcon className="text-sm">arrow_right_alt</MaterialIcon>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-surface-variant bg-surface py-20">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">RTI Request Life Cycle</h2>
              <p className="mx-auto max-w-2xl font-body-md text-body-md text-on-surface-variant">Understanding the process of your Right to Information application from submission to resolution.</p>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                {steps.map(([icon, title, body, className]) => (
                  <div className="group flex items-center gap-6 rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md" key={title}>
                    <div className={`z-10 flex size-16 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${className}`}>
                      <MaterialIcon className="text-3xl">{icon}</MaterialIcon>
                    </div>
                    <div>
                      <h4 className="mb-1 font-headline-md text-lg text-primary">{title}</h4>
                      <p className="text-sm leading-relaxed text-on-surface-variant">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5">
                <div className="flex h-full flex-col rounded-xl border border-outline-variant bg-surface-container-high p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <MaterialIcon className="text-primary">account_tree</MaterialIcon>
                    <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary">Detailed Process Map</span>
                  </div>
                  <div className="flex flex-grow items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                    <img alt="Legacy RTI Life Cycle Diagram" className="h-auto w-full object-contain opacity-90 mix-blend-multiply transition-opacity hover:opacity-100 [max-height:450px]" src={lifecycleImage} />
                  </div>
                  <p className="mt-4 text-center text-label-sm italic text-on-surface-variant">Reference diagram for complex appeal workflows and timelines.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
