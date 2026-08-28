import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-[calc(100svh/var(--app-scale))] items-center justify-center bg-background px-4">
      <section className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold">{t("notFound.title")}</h1>
        <p className="text-muted-foreground">
          {t("notFound.body")}
        </p>
        <Link className={cn(buttonVariants(), "mx-auto")} to="/">
          {t("notFound.home")}
        </Link>
      </section>
    </main>
  )
}
