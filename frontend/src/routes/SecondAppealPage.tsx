import { Link } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

const requiredDocuments = [
  "Copy of the original RTI application submitted to the CPIO.",
  "Copy of the CPIO reply, if one was received.",
  "Copy of the First Appeal and the First Appellate Authority's order, if received.",
  "Any other documents relied on in the appeal, with an index of documents.",
]

export function SecondAppealPage() {
  return (
    <main className="mx-auto w-full max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center md:mb-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <MaterialIcon className="text-3xl">account_balance</MaterialIcon>
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">Central Information Commission</p>
          <h1 className="font-headline-lg text-3xl text-primary md:text-4xl">File a Second Appeal</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-on-surface-variant">
            Second Appeals are handled by the Central Information Commission, not by the RTI Online portal.
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex gap-4 border-b border-outline-variant bg-primary-fixed/40 px-5 py-5 md:px-6">
            <MaterialIcon className="mt-0.5 shrink-0 text-primary">open_in_new</MaterialIcon>
            <div>
              <h2 className="font-headline-md text-lg text-primary">You are leaving RTI Online</h2>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                RTI Online supports RTI applications and First Appeals. The CIC independently receives and decides Second Appeals for Central Public Authorities.
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-5 md:grid-cols-2 md:p-6">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <MaterialIcon className="text-primary">fact_check</MaterialIcon>
                <h2 className="font-headline-md text-xl text-primary">When you may file</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-on-surface-variant">
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>You received a decision on your First Appeal and are dissatisfied with it.</span></li>
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>No First Appellate Authority decision was received within 45 days of filing the First Appeal.</span></li>
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>File within 90 days of the decision—or the date a decision should have been made. The Commission may consider a delayed filing for sufficient cause.</span></li>
              </ul>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <MaterialIcon className="text-primary">folder_open</MaterialIcon>
                <h2 className="font-headline-md text-xl text-primary">Keep these ready</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-on-surface-variant">
                {requiredDocuments.map((document) => (
                  <li className="flex gap-3" key={document}><MaterialIcon className="mt-1 shrink-0 text-outline">description</MaterialIcon><span>{document}</span></li>
                ))}
              </ul>
            </section>
          </div>

          <div className="border-t border-outline-variant bg-surface-container-low px-5 py-5 md:flex md:items-center md:justify-between md:px-6">
            <p className="mb-4 max-w-xl text-sm leading-6 text-on-surface-variant md:mb-0">
              No fee is required for a Second Appeal before the CIC. For a State Public Authority, use the relevant State Information Commission instead.
            </p>
            <a className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container md:w-auto" href="https://dss.cic.gov.in/" rel="noreferrer">
              Continue to CIC Portal <MaterialIcon className="text-base">open_in_new</MaterialIcon>
            </a>
          </div>
        </section>

        <div className="mt-7 text-center">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" to="/"><MaterialIcon className="text-base">arrow_back</MaterialIcon>Back to RTI Online</Link>
        </div>
      </div>
    </main>
  )
}
