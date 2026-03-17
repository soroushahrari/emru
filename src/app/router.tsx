import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { CanvasPage } from "@/pages/CanvasPage"
import { LandingPage } from "@/pages/LandingPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/app",
    element: <CanvasPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
