import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "@/routes/AppLayout"
import { FaqPage } from "@/routes/FaqPage"
import { HomePage } from "@/routes/HomePage"
import { LoginPage } from "@/routes/LoginPage"
import { NotFoundPage } from "@/routes/NotFoundPage"
import { ProfilePage } from "@/routes/ProfilePage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "faq", element: <FaqPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
