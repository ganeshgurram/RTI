import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { MaterialIcon } from "@/routes/stitch-shell"

const requiredDocumentKeys = [
  "secondAppeal.documentRequest",
  "secondAppeal.documentCpioReply",
  "secondAppeal.documentFirstAppeal",
  "secondAppeal.documentOther",
]

export function SecondAppealPage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto w-full max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center md:mb-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <MaterialIcon className="text-3xl">account_balance</MaterialIcon>
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">{t("secondAppeal.commission")}</p>
          <h1 className="font-headline-lg text-3xl text-primary md:text-4xl">{t("secondAppeal.title")}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-on-surface-variant">
            {t("secondAppeal.subtitle")}
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex gap-4 border-b border-outline-variant bg-primary-fixed/40 px-5 py-5 md:px-6">
            <MaterialIcon className="mt-0.5 shrink-0 text-primary">open_in_new</MaterialIcon>
            <div>
              <h2 className="font-headline-md text-lg text-primary">{t("secondAppeal.leavingTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                {t("secondAppeal.leavingDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-5 md:grid-cols-2 md:p-6">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <MaterialIcon className="text-primary">fact_check</MaterialIcon>
                <h2 className="font-headline-md text-xl text-primary">{t("secondAppeal.whenTitle")}</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-on-surface-variant">
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>{t("secondAppeal.eligibleDecision")}</span></li>
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>{t("secondAppeal.eligibleNoDecision")}</span></li>
                <li className="flex gap-3"><MaterialIcon className="mt-1 shrink-0 text-state-success">check_circle</MaterialIcon><span>{t("secondAppeal.eligibleTime")}</span></li>
              </ul>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <MaterialIcon className="text-primary">folder_open</MaterialIcon>
                <h2 className="font-headline-md text-xl text-primary">{t("secondAppeal.documentsTitle")}</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-on-surface-variant">
                {requiredDocumentKeys.map((documentKey) => (
                  <li className="flex gap-3" key={documentKey}><MaterialIcon className="mt-1 shrink-0 text-outline">description</MaterialIcon><span>{t(documentKey)}</span></li>
                ))}
              </ul>
            </section>
          </div>

          <div className="border-t border-outline-variant bg-surface-container-low px-5 py-5 md:flex md:items-center md:justify-between md:px-6">
            <p className="mb-4 max-w-xl text-sm leading-6 text-on-surface-variant md:mb-0">
              {t("secondAppeal.feeNote")}
            </p>
            <a className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container md:w-auto" href="https://dss.cic.gov.in/" rel="noreferrer">
              {t("secondAppeal.continueToCic")} <MaterialIcon className="text-base">open_in_new</MaterialIcon>
            </a>
          </div>
        </section>

        <div className="mt-7 text-center">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" to="/"><MaterialIcon className="text-base">arrow_back</MaterialIcon>{t("common.backToHome")}</Link>
        </div>
      </div>
    </main>
  )
}
