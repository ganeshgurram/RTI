import { Link } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { useTranslation } from "react-i18next"
import { RequestHistoryTable } from "@/components/RequestHistoryTable"
import { buttonVariants } from "@/components/ui/button"
import { mockProfile } from "@/data/mock-profile"
import { useAccountRequests } from "@/requests/RequestContext"
import { countOverdueDeadlines } from "@/services/statutory-deadlines"
import { cn } from "@/lib/utils"
import { MaterialIcon } from "@/routes/stitch-shell"

export function RequestHistoryPage() {
  const { user } = useAuth()
  const requests = useAccountRequests()
  const accountProfile = user?.profile ?? mockProfile
  const { t } = useTranslation()
  const metrics = [
    { label: t("history.totalRequests"), value: String(requests.length), icon: "description" },
    { label: t("history.pending"), value: String(requests.filter((request) => request.status === "Processing" || request.status === "Pending Verification").length), icon: "hourglass_top" },
    { label: t("history.replies"), value: String(requests.filter((request) => request.status === "Reply received" || request.status === "Satisfied").length), icon: "mark_email_read" },
    { label: t("history.appeals"), value: String(requests.filter((request) => request.status.includes("Appeal")).length), icon: "gavel" },
    { label: t("deadline.lapsedMetric"), value: String(countOverdueDeadlines({ requests, today: new Date() })), icon: "event_busy" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <header className="flex flex-col justify-between gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">{accountProfile.initials}</div>
          <div>
            <h1 className="font-headline-lg text-2xl text-primary">{t("history.title")}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{t("history.subtitle", { name: accountProfile.fullName })}</p>
            <p className="mt-2 text-xs text-on-surface-variant">Citizen ID: {accountProfile.id} · {requests.length} total requests</p>
          </div>
        </div>
      </header>

      <section aria-label="RTI activity overview" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm" key={metric.label}>
            <div className="flex items-center justify-between"><span className="text-sm text-on-surface-variant">{metric.label}</span><MaterialIcon className="text-primary">{metric.icon}</MaterialIcon></div>
            <p className="mt-3 text-3xl font-bold text-primary">{metric.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-headline-lg text-xl text-primary">{t("history.allRequests")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{t("history.searchAndFilter")}</p>
        </div>
        {requests.length ? (
          <RequestHistoryTable requests={requests} />
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-14 text-center shadow-sm">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <MaterialIcon className="text-3xl">description</MaterialIcon>
            </span>
            <h3 className="mt-4 font-headline-md text-lg text-primary">{t("history.emptyTitle")}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{t("history.emptyBody")}</p>
            <Link className={cn(buttonVariants({ size: "lg" }), "mt-6")} to="/submit-request">
              <MaterialIcon>edit_document</MaterialIcon>{t("history.emptyCta")}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
