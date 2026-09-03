import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { IconTooltip } from "@/components/IconTooltip"
import { usePortalLanguage } from "@/i18n"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/notifications/NotificationContext"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesContext"
import { useRequests } from "@/requests/RequestContext"
import { canFileFirstAppeal } from "@/services/statutory-deadlines"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const emblemUrl =
  "/assets/indian-emblem.png"

/**
 * Text sizing scales the root element rather than overriding the type tokens. The custom
 * @theme inline sizes compile to literal px (.text-body-md is font-size:16px), so a runtime
 * variable override would move only the stock Tailwind sizes and tear the page in half.
 */
const textScaleStorageKey = "rti-demo-text-scale"
const minTextScale = 0.85
const maxTextScale = 1.15
const textScaleStep = 0.15

function getStoredTextScale() {
  try {
    const stored = Number(localStorage.getItem(textScaleStorageKey))
    return Number.isFinite(stored) && stored >= minTextScale && stored <= maxTextScale ? stored : 1
  } catch {
    return 1
  }
}

const clampTextScale = (value: number) => Number(Math.min(maxTextScale, Math.max(minTextScale, value)).toFixed(2))
function MaterialIcon({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>
}

function StitchTopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { openRequestGuidelines } = useRequestGuidelines()
  const { markAllAsRead, markAsRead, notifications, unreadCount } = useNotifications()
  const { requests } = useRequests()
  const { language, setLanguage } = usePortalLanguage()
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [textScale, setTextScale] = useState(getStoredTextScale)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDetailsElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // setProperty rather than style.zoom: zoom is missing from lib.dom's CSSStyleDeclaration.
    if (textScale === 1) {
      document.documentElement.style.removeProperty("zoom")
    } else {
      document.documentElement.style.setProperty("zoom", String(textScale))
    }

    document.documentElement.style.setProperty("--app-scale", String(textScale))

    try {
      localStorage.setItem(textScaleStorageKey, String(textScale))
    } catch {
      // Private browsing can refuse writes; the choice just will not survive a reload.
    }
  }, [textScale])

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8)

    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })

    return () => window.removeEventListener("scroll", updateScrollState)
  }, [])

  useEffect(() => {
    if (!isProfileMenuOpen) return

    const closeProfileMenu = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeProfileMenu)
    return () => document.removeEventListener("pointerdown", closeProfileMenu)
  }, [isProfileMenuOpen])

  useEffect(() => {
    if (!isNotificationMenuOpen) return

    const closeNotificationMenu = (event: PointerEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeNotificationMenu)
    return () => document.removeEventListener("pointerdown", closeNotificationMenu)
  }, [isNotificationMenuOpen])

  const links = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.request"), path: "/submit-request", opensGuidelines: false },
    { label: t("nav.firstAppeal"), path: "/submit-first-appeal" },
    { label: t("nav.viewStatus"), path: user ? "/request-history" : "/status" },
    { label: t("nav.paymentReconciliation"), path: "/payment-reconciliation" },
  ]

  const drawerLinks = [
    ...links,
    { label: t("nav.secondAppeal"), path: "/second-appeal" },
    { label: t("nav.faqs"), path: "/faq" },
    ...(user ? [] : [{ label: t("nav.login"), path: "/login" }, { label: t("nav.signUp"), path: "/signup" }]),
  ]

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }

    if (path === "/submit-request") {
      return ["/submit-request", "/request-review", "/mock-payment", "/request-submission-success"].includes(location.pathname)
    }

    if (path === "/payment-reconciliation") {
      return ["/payment-reconciliation", "/transaction-status"].includes(location.pathname)
    }

    if (path === "/submit-first-appeal") {
      return ["/submit-first-appeal", "/first-appeal-form", "/appeal-submission-success"].includes(location.pathname)
    }

    return location.pathname === path
  }

  const currentPageLabel = drawerLinks.find((link) => isActive(link.path))?.label
    ?? (location.pathname === "/profile" ? t("nav.profile") : location.pathname === "/request-history" ? t("nav.requestHistory") : location.pathname === "/notifications" ? t("nav.notifications") : "RTI Online")

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  const recentNotifications = [...notifications]
    .sort((left, right) => {
      const actionOrder = Number(right.action === "fileFirstAppeal") - Number(left.action === "fileFirstAppeal")
      if (actionOrder) return actionOrder
      return Number(!right.isRead) - Number(!left.isRead)
    })
    .slice(0, 3)

  const handleNotificationAction = (notification: (typeof notifications)[number]) => {
    markAsRead(notification.id)
    setIsNotificationMenuOpen(false)

    if (notification.action === "fileFirstAppeal") {
      const request = requests.find((item) => item.id === notification.requestId)
      if (request && canFileFirstAppeal({ request, requestId: request.id, today: new Date() }).allowed) {
        openRequestGuidelines({
          appeal: { email: request.applicantEmail, registrationNumber: request.id, requestId: request.id },
          cancelTo: location.pathname,
          journey: "firstAppeal",
        })
        return
      }
    }

    navigate(`/request-history/${notification.requestId}`)
  }

  const notificationActionLabel = (notification: (typeof notifications)[number]) => {
    if (notification.action === "fileFirstAppeal") return t("notifications.fileFirstAppeal")
    if (notification.action === "viewResponse") return t("notifications.viewResponse")
    return t("notifications.viewRequest")
  }

  return (
    <>
      <div className="relative z-50 w-full bg-primary text-on-primary/70">
        <div className="mx-auto flex h-9 w-full max-w-container-max items-center justify-end gap-1 px-3 text-label-sm navwide:px-margin-desktop">
          <span className="mr-1 hidden sm:inline">{t("nav.textSize")}</span>
          <IconTooltip label={t("nav.increaseText")} render={<button aria-label={t("nav.increaseText")} className="rounded px-1.5 py-0.5 transition-colors hover:bg-on-primary/10 hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent" disabled={textScale >= maxTextScale} onClick={() => setTextScale((current) => clampTextScale(current + textScaleStep))} type="button" />} side="bottom">A+</IconTooltip>
          <IconTooltip label={t("nav.resetText")} render={<button aria-label={t("nav.resetText")} className="rounded px-1.5 py-0.5 transition-colors hover:bg-on-primary/10 hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent" disabled={textScale === 1} onClick={() => setTextScale(1)} type="button" />} side="bottom">A</IconTooltip>
          <IconTooltip label={t("nav.decreaseText")} render={<button aria-label={t("nav.decreaseText")} className="rounded px-1.5 py-0.5 transition-colors hover:bg-on-primary/10 hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent" disabled={textScale <= minTextScale} onClick={() => setTextScale((current) => clampTextScale(current - textScaleStep))} type="button" />} side="bottom">A-</IconTooltip>
          <span aria-hidden="true" className="mx-2 h-4 border-l border-on-primary/30" />
          <button aria-label={t("language.switchToEnglish")} aria-pressed={language === "en"} className={`rounded px-2 py-0.5 transition-colors ${language === "en" ? "bg-on-primary font-semibold text-primary shadow-sm" : "hover:bg-on-primary/10 hover:text-on-primary"}`} onClick={() => setLanguage("en")} type="button">{t("language.english")}</button>
          <span aria-hidden="true" className="opacity-50">|</span>
          <button aria-label={t("language.switchToHindi")} aria-pressed={language === "hi"} className={`rounded px-2 py-0.5 transition-colors ${language === "hi" ? "bg-on-primary font-semibold text-primary shadow-sm" : "hover:bg-on-primary/10 hover:text-on-primary"}`} onClick={() => setLanguage("hi")} type="button">{t("language.hindi")}</button>
        </div>
      </div>
      <div className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "px-3 pt-3 navwide:px-6" : "px-0 pt-0"}`}>
        <nav className={`relative mx-auto w-full border text-on-primary transition-all duration-300 ${isScrolled ? "max-w-container-max rounded-xl border-on-primary/15 bg-[color-mix(in_oklab,var(--on-primary)_10%,var(--primary))] shadow-xl" : "max-w-full rounded-none border-transparent bg-primary shadow-none"}`}>
          <div className="mx-auto flex h-16 w-full max-w-container-max items-center gap-4 px-3 navwide:px-margin-desktop">
          <div className="flex items-center gap-2 navwide:mr-0">
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    aria-label={t("nav.openMenu")}
                    className="p-1 text-on-primary navwide:hidden"
                    type="button"
                  />
                }
              >
                <MaterialIcon>menu</MaterialIcon>
              </SheetTrigger>
              <SheetContent
                className="border-white/20 bg-background/65 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--background)_92%,transparent),color-mix(in_oklab,var(--muted)_72%,transparent)_48%,color-mix(in_oklab,var(--background)_58%,transparent))] shadow-[0_24px_80px_color-mix(in_oklab,var(--foreground)_28%,transparent)] ring-1 ring-white/25 supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-200 data-[side=left]:bottom-3 data-[side=left]:left-3 data-[side=left]:top-3 data-[side=left]:h-auto data-[side=left]:w-[min(20rem,calc(100vw-1.5rem))] data-[side=left]:rounded-2xl data-[side=left]:border"
                side="left"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2.5">
                    <img alt="Indian Emblem" className="h-9 w-auto shrink-0 opacity-90" src={emblemUrl} />
                    <span className="h-9 w-px shrink-0 bg-border" aria-hidden="true" />
                    <span className="whitespace-nowrap font-headline-md text-headline-md font-bold leading-none">
                      RTI Online
                    </span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">{t("nav.navigation")}</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col px-4">
                  {drawerLinks.map((link) => {
                    if (link.opensGuidelines) {
                      return (
                        <SheetClose
                          key={link.label}
                          render={
                            <button
                              aria-current={isActive(link.path) ? "page" : undefined}
                              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${isActive(link.path) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                              onClick={() => openRequestGuidelines()}
                              type="button"
                            />
                          }
                        >
                          {link.label}
                        </SheetClose>
                      )
                    }

                    return (
                      <SheetClose
                        key={link.label}
                        render={
                        <Link
                          aria-current={isActive(link.path) ? "page" : undefined}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(link.path) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                          to={link.path}
                        />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <Link className="flex items-center gap-2.5" to="/">
              <img alt="Indian Emblem" className="h-9 w-auto shrink-0 opacity-90" src={emblemUrl} />
              <span className="h-9 w-px shrink-0 bg-brand-gold/45" aria-hidden="true" />
              <span className="whitespace-nowrap font-headline-md text-headline-md font-bold leading-none text-brand-gold">
                RTI Online
              </span>
            </Link>
            <span className="hidden max-w-32 truncate border-l border-on-primary/30 pl-3 text-sm font-medium text-on-primary/80 sm:inline navwide:hidden">{currentPageLabel}</span>
          </div>
          <div className="ml-6 hidden h-full items-center gap-3 navwide:flex">
            {links.map((link) => {
              const isCurrent = isActive(link.path)
              // Both states carry the same box so nothing shifts when the page changes; the
              // current one inverts to a solid light pill, which reads at a glance in a way
              // that a 100%-vs-80% white underline never did.
              const className = `flex h-9 items-center whitespace-nowrap rounded-md px-3 transition-colors active:scale-95 ${
                isCurrent
                  ? "bg-on-primary font-semibold text-primary shadow-sm"
                  : "text-on-primary/75 hover:bg-on-primary/10 hover:text-on-primary"
              }`

              if (link.opensGuidelines) {
                return (
                  <button aria-current={isCurrent ? "page" : undefined} className={className} key={link.label} onClick={() => openRequestGuidelines()} type="button">
                    {link.label}
                  </button>
                )
              }

              return (
                <Link aria-current={isCurrent ? "page" : undefined} className={className} key={link.label} to={link.path}>
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                <div className="group relative" ref={notificationMenuRef}>
                  <IconTooltip
                    label={`${t("nav.notifications")}${unreadCount ? ` (${unreadCount})` : ""}`}
                    render={<Button aria-expanded={isNotificationMenuOpen} aria-label={`${t("nav.notifications")}${unreadCount ? ` (${unreadCount})` : ""}`} className="relative overflow-visible rounded-full text-on-primary hover:bg-on-primary/10 hover:text-on-primary" onClick={() => setIsNotificationMenuOpen((isOpen) => !isOpen)} size="icon-lg" type="button" variant="ghost" />}
                    side="bottom"
                  >
                    <MaterialIcon>notifications</MaterialIcon>
                    {unreadCount ? <span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] leading-4 font-bold text-black">{unreadCount}</span> : null}
                  </IconTooltip>
                  <div className={`fixed left-3 right-3 z-50 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm ${isScrolled ? "max-sm:top-[5.25rem]" : "max-sm:top-[6.75rem]"} sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72 ${isNotificationMenuOpen ? "block" : "hidden"}`}>
                    <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-4">
                      <h3 className="text-[14px] font-bold uppercase tracking-wider text-primary-container">{t("nav.recentNotifications")}</h3>
                      <Button className={unreadCount ? "" : "invisible"} onClick={markAllAsRead} size="sm" type="button">{t("nav.markAllRead")}</Button>
                    </div>
                    <div className="divide-y divide-outline-variant/50">
                      {recentNotifications.map((notification) => (
                        <button aria-label={`${notification.title}: ${notificationActionLabel(notification)}`} className={`flex w-full cursor-pointer gap-2.5 p-4 text-left transition-colors hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none ${notification.isRead ? "" : "bg-primary-fixed/25"}`} key={notification.id} onClick={() => handleNotificationAction(notification)} type="button">
                          <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary"}`} />
                          <div className="min-w-0">
                            <p className={`text-[14px] ${notification.isRead ? "font-medium text-on-surface" : "font-semibold text-primary"}`}>{notification.title}</p>
                            <p className="mt-1 text-[12px] text-on-surface-variant">{notification.requestId} · {notification.time}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-outline-variant p-3 text-center"><button className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-semibold text-surface-tint transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => { setIsNotificationMenuOpen(false); navigate("/notifications") }} type="button">{t("nav.viewAllNotifications")}</button></div>
                  </div>
                </div>
                <details className="group relative" onToggle={(event) => setIsProfileMenuOpen(event.currentTarget.open)} open={isProfileMenuOpen} ref={profileMenuRef}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-on-primary/10 px-3 py-1.5 transition-colors hover:bg-on-primary/20">
                    <MaterialIcon className="text-[20px]">account_circle</MaterialIcon>
                    <span className="hidden whitespace-nowrap text-[14px] font-medium sm:block">{user.fullName}</span>
                    <MaterialIcon className="text-[18px] transition-transform group-open:rotate-180">expand_more</MaterialIcon>
                  </summary>
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-sm">
                    <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low" onClick={() => setIsProfileMenuOpen(false)} to="/profile">
                      <MaterialIcon className="text-[18px] text-muted-foreground">person</MaterialIcon>
                      <span><span className="block">{t("nav.profile")}</span><span className="block text-xs font-normal text-muted-foreground">{t("nav.profileDescription")}</span></span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low" onClick={() => setIsProfileMenuOpen(false)} to="/request-history">
                      <MaterialIcon className="text-[18px] text-muted-foreground">description</MaterialIcon>
                      <span><span className="block">{t("nav.requestHistory")}</span><span className="block text-xs font-normal text-muted-foreground">{t("nav.requestHistoryDescription")}</span></span>
                    </Link>
                    <div className="my-1 border-t border-outline-variant/50" />
                    <button
                      className="flex w-full items-center gap-2 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                      onClick={handleLogout}
                      type="button"
                    >
                      <MaterialIcon className="text-[18px] text-muted-foreground">logout</MaterialIcon>
                      {t("nav.logout")}
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <Link
                className="rounded bg-secondary px-6 py-2 font-label-lg text-label-lg text-on-secondary shadow-sm transition-colors hover:bg-secondary/90"
                to={location.pathname === "/login" ? "/signup" : "/login"}
              >
                {/* On the auth pages this offers the other one; everywhere else it is just Sign in. */}
                {location.pathname === "/login" ? t("nav.signUp") : t("nav.signIn")}
              </Link>
            )}
          </div>
          </div>
        </nav>
      </div>
    </>
  )
}

function StitchFooter() {
  const { t } = useTranslation()

  return (
    <footer className="mt-auto rounded-t-xl bg-primary text-on-primary" data-site-footer>
      <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-6 px-margin-mobile py-stack-lg md:flex-row md:px-margin-desktop">
        <div className="text-center font-headline-md text-headline-md text-brand-gold md:text-left">
          © {new Date().getFullYear()} RTI Online. {t("nav.allRightsReserved")}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className="rounded-md px-3 py-1.5 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-brand-gold" to="/public-authorities">
            {t("nav.publicAuthorities")}
          </Link>
          <Link className="rounded-md px-3 py-1.5 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-brand-gold" to="/faq">
            {t("nav.faqs")}
          </Link>
          <a className="rounded-md px-3 py-1.5 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-brand-gold" download href="/rti-online-user-manual.pdf">
            {t("nav.userManual")}
          </a>
          <Link className="rounded-md px-3 py-1.5 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-brand-gold" to="/contact-us">
            {t("nav.contactUs")}
          </Link>
        </div>
      </div>
    </footer>
  )
}

export { emblemUrl, MaterialIcon, StitchFooter, StitchTopNav }
