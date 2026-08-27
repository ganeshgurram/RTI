import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100svh/var(--app-scale))] items-center justify-center bg-background px-4">
      <section className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The route does not exist in the RTI prototype.
        </p>
        <Link className={cn(buttonVariants(), "mx-auto")} to="/">
          Return home
        </Link>
      </section>
    </main>
  )
}
