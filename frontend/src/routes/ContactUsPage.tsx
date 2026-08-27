import { type ReactNode } from "react"

import { mockContactDetails } from "@/data/mock-contact"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesDialog"
import { MaterialIcon } from "@/routes/stitch-shell"

function ContactRow({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-outline bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10">
        <MaterialIcon className="text-primary-container">{icon}</MaterialIcon>
      </span>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-outline">{label}</p>
        {children}
      </div>
    </div>
  )
}

export function ContactUsPage() {
  const { openRequestGuidelines } = useRequestGuidelines()

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-stack-lg md:px-margin-desktop md:py-16">
      <header className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
        <h1 className="font-headline-lg text-4xl font-bold tracking-tight text-primary md:text-[48px]">Contact Us</h1>
        <p className="mt-4 text-lg leading-7 text-on-surface-variant">
          We are here to assist you with any queries regarding the RTI Online portal. Please reach out to the appropriate contact for your needs.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-gutter md:grid-cols-12">
        <section className="rounded-xl border border-outline bg-surface-container-lowest p-6 md:col-span-8 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5 md:gap-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-container/10 md:size-16">
                <MaterialIcon className="text-3xl text-primary-container">support_agent</MaterialIcon>
              </div>
              <h2 className="font-headline-md text-2xl font-bold text-primary">Technical Support &amp; General Queries</h2>
            </div>
            <div>
              <p className="mb-6 text-base leading-6 text-on-surface-variant">
                For technical issues, payment queries, or general assistance with using the RTI Online portal.
              </p>
              <div className="space-y-4">
                <ContactRow icon="mail" label="Email Address">
                  <a className="text-lg font-semibold text-primary transition-colors hover:text-surface-tint" href={`mailto:${mockContactDetails.supportEmail}`}>{mockContactDetails.supportEmail}</a>
                </ContactRow>
                <ContactRow icon="call" label="Helpline Number">
                  <p className="text-lg font-semibold text-primary">{mockContactDetails.helplineNumber}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">{mockContactDetails.helplineAvailability}</p>
                </ContactRow>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border border-outline bg-surface-container-lowest p-6 md:col-span-4 md:p-8">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-container/10">
                <MaterialIcon className="text-primary-container">account_balance</MaterialIcon>
              </div>
              <h2 className="font-headline-md text-xl font-bold text-primary">Official Contact</h2>
            </div>
            <p className="text-sm leading-6 text-on-surface-variant">For official correspondence or escalation of unresolved technical issues.</p>
          </div>
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-on-surface">{mockContactDetails.officialTitle}</p>
              <div className="mt-2 flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
                <MaterialIcon className="mt-0.5 text-lg text-outline">location_on</MaterialIcon>
                <address className="not-italic">{mockContactDetails.officialAddress[0]}<br />{mockContactDetails.officialAddress[1]}</address>
              </div>
            </div>
            <div className="border-t border-surface-variant pt-4">
              <a className="flex items-center gap-2 font-semibold text-primary transition-colors hover:text-surface-tint" href={`mailto:${mockContactDetails.officialEmail}`}>
                <MaterialIcon className="text-outline">mail</MaterialIcon>
                {mockContactDetails.officialEmail}
              </a>
            </div>
          </div>
        </section>

        <aside className="flex flex-col items-start self-start rounded-lg border border-surface-variant bg-surface-container-low p-5 text-left text-sm leading-6 text-on-surface-variant md:col-span-12 md:col-start-1 md:p-6">
          <p><strong className="text-on-surface">Note:</strong> Please do not file RTI applications to the above email addresses. These are strictly for technical support and portal-related assistance. To file an RTI application, please use the <button className="font-medium text-surface-tint underline underline-offset-2 transition-colors hover:text-primary" onClick={() => openRequestGuidelines()} type="button">Submit Request</button> functionality on the portal.</p>
        </aside>
      </div>
    </div>
  )
}
