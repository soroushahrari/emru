import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { AppRouter } from "@/app/router"
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
