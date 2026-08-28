import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

/** Section order and icons; every question and answer is looked up from the translations,
    so the search below matches whichever language is on screen. */
const sections = [
  { icon: "account_balance", id: "filing", itemCount: 5 },
  { icon: "payments", id: "fees", itemCount: 5 },
  { icon: "gavel", id: "appeals", itemCount: 5 },
  { icon: "manage_search", id: "status", itemCount: 8 },
  { icon: "support_agent", id: "help", itemCount: 3 },
]

export function FaqPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const localisedSections = useMemo(
    () => {
      // Questions display in the reader's language, but matching always runs against the
      // English text, so the box takes English terms on both pages. A Hindi reader is
      // typing on a Latin keyboard anyway: "payment" finds the fees section, and the
      // answers still come back in Devanagari.
      const searchable = (key: string) => t(key, { lng: "en" }).toLowerCase()

      return sections.map((section) => ({
        icon: section.icon,
        id: section.id,
        title: t(`faq.sections.${section.id}.title`),
        titleSearchText: searchable(`faq.sections.${section.id}.title`),
        items: Array.from({ length: section.itemCount }, (_unused, index) => ({
          answer: t(`faq.sections.${section.id}.items.${index}.a`),
          question: t(`faq.sections.${section.id}.items.${index}.q`),
          searchText: `${searchable(`faq.sections.${section.id}.items.${index}.q`)}\n${searchable(`faq.sections.${section.id}.items.${index}.a`)}`,
        })),
      }))
    },
    [t],
  )

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return localisedSections
    }

    return localisedSections
      .map((section) => {
        const matchesSection = section.titleSearchText.includes(normalizedQuery)
        const items = section.items.filter(
          (item) => matchesSection || item.searchText.includes(normalizedQuery),
        )

        return { ...section, items }
      })
      .filter((section) => section.items.length > 0)
  }, [localisedSections, query])

  const resultCount = filteredSections.reduce(
    (total, section) => total + section.items.length,
    0
  )

  return (
      <div className="mx-auto w-full max-w-container-max space-y-stack-lg px-margin-mobile py-stack-lg md:px-margin-desktop">
        <section className="mx-auto max-w-3xl space-y-stack-md text-center">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:text-display-lg">{t("faq.title")}</h1>
          <p className="font-body-lg text-on-surface-variant">{t("faq.subtitle")}</p>
          <div className="relative mt-stack-md">
            <MaterialIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</MaterialIcon>
            <input
              aria-label={t("faq.searchLabel")}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 font-body-md shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("faq.searchPlaceholder")}
              type="search"
              value={query}
            />
          </div>
          {query.trim() && (
            <p className="font-body-md text-sm text-on-surface-variant">
              {t(resultCount === 1 ? "faq.resultsOne" : "faq.resultsOther", { count: resultCount, query: query.trim() })}
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-gutter lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-gutter">
            {filteredSections.length === 0 && (
              <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-lg text-center">
                <MaterialIcon className="mb-3 text-3xl text-muted-foreground">search_off</MaterialIcon>
                <h2 className="font-headline-md text-headline-md text-foreground">{t("faq.noResultsTitle")}</h2>
                <p className="mt-2 font-body-md text-on-surface-variant">
                  {t("faq.noResultsBody")}
                </p>
              </div>
            )}
            {filteredSections.map((section) => (
              <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-md md:p-stack-lg" key={section.id}>
                <div className="mb-stack-md flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                    <MaterialIcon>{section.icon}</MaterialIcon>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-foreground">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.items.map(({ answer, question }, index) => {
                    const isOddLastItem =
                      section.items.length % 2 === 1 && index === section.items.length - 1

                    return (
                    <article className={isOddLastItem ? "rounded-DEFAULT border border-surface-variant bg-surface p-4 md:col-span-2" : "rounded-DEFAULT border border-surface-variant bg-surface p-4"} key={question}>
                      <div className="mb-2 flex items-start gap-3">
                        <MaterialIcon className="mt-0.5 text-muted-foreground">help</MaterialIcon>
                        <h3 className="font-body-md text-body-md font-semibold text-on-surface">{question}</h3>
                      </div>
                      <p className="pl-8 font-body-md text-on-surface-variant">{answer}</p>
                    </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-gutter lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg bg-primary p-stack-md text-primary-foreground">
              <h3 className="mb-stack-sm font-headline-md text-headline-md text-primary-foreground">{t("faq.needHelp")}</h3>
              <p className="mb-stack-md font-body-md opacity-90">{t("faq.needHelpBody")}</p>
              <Link className="block w-full rounded-DEFAULT border border-primary-foreground/20 bg-primary-foreground py-2 text-center font-label-lg text-primary transition-colors hover:bg-primary-foreground/90" to="/contact-us">{t("faq.contactSupport")}</Link>
            </div>
            <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-md">
              <h4 className="mb-2 font-headline-md text-headline-md text-foreground">{t("faq.userManual")}</h4>
              <p className="mb-4 font-body-md text-on-surface-variant">{t("faq.userManualBody")}</p>
              <a className="inline-flex items-center font-label-lg text-foreground hover:underline" download href="/rti-online-user-manual.pdf">{t("faq.downloadPdf")} <MaterialIcon className="ml-1 text-sm">download</MaterialIcon></a>
            </div>
          </aside>
        </section>
      </div>
  )
}
