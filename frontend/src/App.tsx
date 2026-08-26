import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom"

import { AuthProvider, useAuth } from "@/auth/AuthContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "@/routes/AppLayout"
import { ContactUsPage } from "@/routes/ContactUsPage"
import { FaqPage } from "@/routes/FaqPage"
import { HomePage } from "@/routes/HomePage"
import { LoginPage } from "@/routes/LoginPage"
import { NotFoundPage } from "@/routes/NotFoundPage"
import { NotificationsPage } from "@/routes/NotificationsPage"
import { ProfilePage } from "@/routes/ProfilePage"
import { PublicAuthoritiesPage } from "@/routes/PublicAuthoritiesPage"
import { RequestHistoryPage } from "@/routes/RequestHistoryPage"
import { StatusPage } from "@/routes/StatusPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "faq", element: <FaqPage /> },
      { path: "contact-us", element: <ContactUsPage /> },
      { path: "public-authorities", element: <PublicAuthoritiesPage /> },
      { path: "profile", element: <ProtectedProfile /> },
      { path: "request-history", element: <ProtectedRequestHistory /> },
      { path: "notifications", element: <ProtectedNotifications /> },
      { path: "status", element: <StatusPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

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
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
