import { useEffect } from "react"
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom"

import { AuthProvider, useAuth } from "@/auth/AuthContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "@/routes/AppLayout"
import { ContactUsPage } from "@/routes/ContactUsPage"
import { DigiLockerAuthorizationPage } from "@/routes/DigiLockerAuthorizationPage"
import { FaqPage } from "@/routes/FaqPage"
import { HomePage } from "@/routes/HomePage"
import { LoginPage } from "@/routes/LoginPage"
import { MockPaymentPage } from "@/routes/MockPaymentPage"
import { NotFoundPage } from "@/routes/NotFoundPage"
import { NotificationsPage } from "@/routes/NotificationsPage"
import { PaymentReconciliationPage, TransactionStatusPage } from "@/routes/PaymentReconciliationPages"
import { ProfilePage } from "@/routes/ProfilePage"
import { PublicAuthoritiesPage } from "@/routes/PublicAuthoritiesPage"
import { FirstAppealFormPage } from "@/routes/FirstAppealFormPage"
import { RequestFormPage } from "@/routes/RequestFormPage"
import { SubmitFirstAppealPage } from "@/routes/SubmitFirstAppealPage"
import { AppealSubmissionSuccessPage, RequestSubmissionSuccessPage } from "@/routes/SubmissionSuccessPages"
import { RequestHistoryPage } from "@/routes/RequestHistoryPage"
import { StatusPage } from "@/routes/StatusPage"
import { NotificationProvider } from "@/notifications/NotificationContext"
import { PaymentProvider } from "@/payments/PaymentContext"
import { useRequestGuidelines, type RequestAuthority } from "@/request-guidelines/RequestGuidelinesDialog"
import { RequestProvider } from "@/requests/RequestContext"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "digilocker-authorize", element: <DigiLockerAuthorizationPage /> },
      { path: "faq", element: <FaqPage /> },
      { path: "contact-us", element: <ContactUsPage /> },
      { path: "public-authorities", element: <PublicAuthoritiesPage /> },
      { path: "submit-request", element: <RequestFormRoute /> },
      { path: "payment-reconciliation", element: <PaymentReconciliationPage /> },
      { path: "mock-payment", element: <MockPaymentPage /> },
      { path: "transaction-status", element: <TransactionStatusPage /> },
      { path: "request-submission-success", element: <RequestSubmissionSuccessPage /> },
      { path: "submit-first-appeal", element: <FirstAppealRoute /> },
      { path: "first-appeal-form", element: <FirstAppealFormPage /> },
      { path: "appeal-submission-success", element: <AppealSubmissionSuccessPage /> },
      { path: "profile", element: <ProtectedProfile /> },
      { path: "request-history", element: <ProtectedRequestHistory /> },
      { path: "notifications", element: <ProtectedNotifications /> },
      { path: "status", element: <StatusPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

function RequestFormRoute() {
  const location = useLocation()
  const { openRequestGuidelines } = useRequestGuidelines()
  const routeState = location.state as { guidelinesAccepted?: boolean; authority?: RequestAuthority } | null
  const hasAcceptedGuidelines = Boolean(routeState?.guidelinesAccepted)

  useEffect(() => {
    if (!hasAcceptedGuidelines) {
      openRequestGuidelines({ cancelTo: -1 })
    }
  }, [hasAcceptedGuidelines])

  if (hasAcceptedGuidelines) {
    return <RequestFormPage authority={routeState?.authority} />
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
      <section className="max-w-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
        <h1 className="font-headline-md text-xl text-primary">Guidelines acknowledgement required</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">Please review and acknowledge the RTI request guidelines before continuing to the application form.</p>
        <button className="mt-6 rounded bg-primary px-5 py-2.5 font-label-lg text-on-primary transition-colors hover:bg-primary-container" onClick={() => openRequestGuidelines({ cancelTo: -1 })} type="button">Review Guidelines</button>
      </section>
    </main>
  )
}

function FirstAppealRoute() {
  const location = useLocation()
  const { openRequestGuidelines } = useRequestGuidelines()
  const hasAcceptedGuidelines = Boolean((location.state as { guidelinesAccepted?: boolean } | null)?.guidelinesAccepted)

  useEffect(() => {
    if (!hasAcceptedGuidelines) {
      openRequestGuidelines({ cancelTo: -1, journey: "firstAppeal" })
    }
  }, [hasAcceptedGuidelines])

  if (hasAcceptedGuidelines) {
    return <SubmitFirstAppealPage />
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
      <section className="max-w-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
        <h1 className="font-headline-md text-xl text-primary">Guidelines acknowledgement required</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">Please review and acknowledge the First Appeal guidelines before continuing.</p>
        <button className="mt-6 rounded bg-primary px-5 py-2.5 font-label-lg text-on-primary transition-colors hover:bg-primary-container" onClick={() => openRequestGuidelines({ cancelTo: -1, journey: "firstAppeal" })} type="button">Review Guidelines</button>
      </section>
    </main>
  )
}

function ProtectedProfile() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <ProfilePage />
}

function ProtectedRequestHistory() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <RequestHistoryPage />
}

function ProtectedNotifications() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <NotificationsPage />
}

function App() {
  return (
    <AuthProvider>
      <RequestProvider>
        <PaymentProvider>
          <NotificationProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </NotificationProvider>
        </PaymentProvider>
      </RequestProvider>
    </AuthProvider>
  )
}

export default App
