import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ApplicantProfile } from "@/data/mock-profile"
import { emblemUrl, MaterialIcon } from "@/routes/stitch-shell"
import { api } from "@/services/api"

type AuthorizationStep = "review" | "sharing" | "complete"

type DigiLockerPreview = Pick<ApplicantProfile, "fullName" | "dateOfBirth" | "email" | "mobile" | "addressText">

export function DigiLockerAuthorizationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, loginWithDigiLocker } = useAuth()
  const [step, setStep] = useState<AuthorizationStep>("review")
  const [preview, setPreview] = useState<DigiLockerPreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(true)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoadingPreview(true)
    setPreviewFailed(false)

    void api.digiLockerPreview()
      .then(({ profile }) => {
        if (active) setPreview(profile as DigiLockerPreview)
      })
      .catch(() => {
        if (active) setPreviewFailed(true)
      })
      .finally(() => {
        if (active) setIsLoadingPreview(false)
      })

    return () => { active = false }
  }, [previewVersion])

  useEffect(() => {
    if (step !== "sharing") return

    const completeAuthorization = window.setTimeout(() => {
      void loginWithDigiLocker().then((error) => {
        if (!error) setStep("complete")
        else setStep("review")
      })
    }, 1900)

    return () => window.clearTimeout(completeAuthorization)
  }, [loginWithDigiLocker, step])

  useEffect(() => {
    if (step !== "complete") return

    const redirectToProfile = window.setTimeout(() => navigate("/profile", { replace: true }), 1200)
    return () => window.clearTimeout(redirectToProfile)
  }, [navigate, step])

  if (isAuthenticated && step === "review") {
    return <Navigate replace to="/profile" />
  }

  const isSharing = step === "sharing"
  const isComplete = step === "complete"
  const sharedDetails = preview ? [
    { icon: "person", field: "fullName", value: preview.fullName },
    { icon: "calendar_month", field: "dateOfBirth", value: preview.dateOfBirth },
    { icon: "alternate_email", field: "email", value: preview.email },
    { icon: "phone_iphone", field: "mobile", value: preview.mobile },
    { icon: "home", field: "address", value: preview.addressText },
  ] : []

  return (
    <main className="mx-auto flex min-h-[calc(100svh/var(--app-scale)-12rem)] w-full max-w-container-max items-center justify-center px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <Card className="w-full max-w-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <CardHeader className="items-center text-center">
          <Badge className="mb-2 border-primary/20 bg-primary-fixed text-primary" variant="outline">
            <MaterialIcon className="mr-1 text-sm">lock</MaterialIcon>{t("digilocker.badge")}
          </Badge>
          <CardTitle className="text-2xl text-primary">
            {isComplete ? t("digilocker.titleComplete") : t("digilocker.title")}
          </CardTitle>
          <CardDescription className="max-w-xl">
            {isComplete ? t("digilocker.descriptionComplete") : t("digilocker.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isComplete ? (
            <div aria-live="polite" className="flex flex-col items-center rounded-xl border border-state-success/25 bg-state-success/10 px-6 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-state-success text-on-primary">
                <MaterialIcon className="text-3xl">check</MaterialIcon>
              </span>
              <p className="mt-4 text-lg font-semibold text-state-success">{t("digilocker.completeHeading")}</p>
              <p className="mt-2 text-sm text-on-surface-variant">{t("digilocker.redirecting")}</p>
            </div>
          ) : (
            <>
              <section aria-label={t("digilocker.connectionLabel")} className="rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5">
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                    <img alt="DigiLocker" className="size-8 shrink-0 object-contain" src="/assets/digilocker.svg" />
                    <div><p className="font-medium text-on-surface">DigiLocker</p><p className="text-xs text-on-surface-variant">{t("digilocker.selectedDocuments")}</p></div>
                  </div>
                  <div className="flex items-center gap-2 px-1 sm:w-28 sm:px-0">
                    <div className="relative h-px flex-1 overflow-hidden rounded-full bg-outline-variant">
                      {isSharing ? <span aria-hidden="true" className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-primary motion-reduce:animate-none animate-[digilocker-transfer_1.25s_ease-in-out_infinite]" /> : null}
                    </div>
                    <MaterialIcon className={isSharing ? "animate-pulse text-primary motion-reduce:animate-none" : "text-outline"}>arrow_forward</MaterialIcon>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-primary/20 bg-primary-fixed/40 p-3">
                    <img alt="RTI Online" className="h-8 w-auto shrink-0" src={emblemUrl} />
                    <div><p className="font-medium text-primary">RTI Online</p><p className="text-xs text-on-surface-variant">{t("digilocker.applicantProfile")}</p></div>
                  </div>
                </div>
                {isSharing ? <p aria-live="polite" className="mt-4 text-center text-sm font-medium text-primary">{t("digilocker.fetching")}</p> : null}
              </section>

              {isLoadingPreview || previewFailed ? (
                <section aria-live="polite" className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container-low px-5 py-8 text-center">
                  <MaterialIcon className={isLoadingPreview ? "animate-spin text-2xl text-primary motion-reduce:animate-none" : "text-2xl text-destructive"}>{isLoadingPreview ? "sync" : "error"}</MaterialIcon>
                  <p className="mt-3 text-sm text-on-surface-variant">{isLoadingPreview ? "Loading the selected DigiLocker details…" : "We could not load the selected DigiLocker details."}</p>
                  {previewFailed ? <Button className="mt-4" onClick={() => setPreviewVersion((current) => current + 1)} type="button" variant="outline">Try again</Button> : null}
                </section>
              ) : (
                <section aria-labelledby="shared-details-title">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h2 className="font-medium text-on-surface" id="shared-details-title">{t("digilocker.sharedTitle")}</h2><p className="mt-1 text-sm text-on-surface-variant">{t("digilocker.sharedSubtitle")}</p></div>
                    <Badge variant="outline">{t("digilocker.detailCount", { count: sharedDetails.length })}</Badge>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {sharedDetails.map((detail) => (
                      <div className={`rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-3 ${detail.field === "address" ? "sm:col-span-2" : ""}`} key={detail.field}>
                        <dt className="flex items-center gap-2 text-xs font-medium text-on-surface-variant"><MaterialIcon className="text-base text-primary">{detail.icon}</MaterialIcon>{t(`digilocker.fields.${detail.field}`)}</dt>
                        <dd className="mt-1 pl-6 text-sm text-on-surface">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <p className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-xs leading-5 text-on-surface-variant">
                {t("digilocker.disclaimer")}
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button disabled={isSharing} onClick={() => navigate("/login")} type="button" variant="outline">{t("common.cancel")}</Button>
                <Button disabled={isSharing || isLoadingPreview || previewFailed || !preview} onClick={() => setStep("sharing")} type="button">
                  <MaterialIcon>{isSharing ? "sync" : "verified_user"}</MaterialIcon>{isSharing ? t("digilocker.authorizing") : t("digilocker.authorize")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
