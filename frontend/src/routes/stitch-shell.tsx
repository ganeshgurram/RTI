import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { mockNotifications, unreadNotificationCount as initialUnreadNotificationCount } from "@/data/mock-notifications"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesDialog"
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
function MaterialIcon({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>
}

function StitchTopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { openRequestGuidelines } = useRequestGuidelines()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(initialUnreadNotificationCount)
  const profileMenuRef = useRef<HTMLDetailsElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 0)

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
    { label: "Home", path: "/" },
    { label: "Submit Request", path: "/submit-request", opensGuidelines: false },
    { label: "Submit First Appeal", path: "/submit-first-appeal" },
    { label: "View Status", path: user ? "/request-history" : "/status" },
  ]

  const drawerLinks = [
    ...links,
    { label: "Submit Second Appeal", path: "/profile" },
    { label: "FAQs", path: "/faq" },
    ...(user ? [] : [{ label: "Login", path: "/login" }]),
  ]

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }

    if (path === "/submit-request") {
      return ["/submit-request", "/request-submission-success"].includes(location.pathname)
    }

    if (path === "/submit-first-appeal") {
      return ["/submit-first-appeal", "/first-appeal-form", "/appeal-submission-success"].includes(location.pathname)
    }

    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full bg-primary text-on-primary transition-shadow duration-200 ${isScrolled ? "shadow-md" : "shadow-none"}`}>
        <div className="mx-auto flex h-16 w-full max-w-container-max items-center gap-4 px-3 md:px-margin-desktop">
          <div className="flex items-center gap-2 md:mr-0">
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    aria-label="Open navigation menu"
                    className="p-1 text-on-primary md:hidden"
                    type="button"
                  />
                }
              >
                <MaterialIcon>menu</MaterialIcon>
              </SheetTrigger>
              <SheetContent
                className="border-white/20 bg-background/65 bg-[linear-gradient(135deg,hsl(var(--background)/0.92),hsl(var(--muted)/0.72)_48%,hsl(var(--background)/0.58))] shadow-[0_24px_80px_hsl(var(--foreground)/0.28)] ring-1 ring-white/25 supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-200 data-[side=left]:bottom-3 data-[side=left]:left-3 data-[side=left]:top-3 data-[side=left]:h-auto data-[side=left]:w-[min(20rem,calc(100vw-1.5rem))] data-[side=left]:rounded-2xl data-[side=left]:border"
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
                  <SheetDescription className="sr-only">Navigation</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col px-4">
                  {drawerLinks.map((link) => {
                    if (link.opensGuidelines) {
                      return (
                        <SheetClose
                          key={link.label}
                          render={
                            <button
                              className="rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
                          className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
              <span className="h-9 w-px shrink-0 bg-on-primary/30" aria-hidden="true" />
              <span className="whitespace-nowrap font-headline-md text-headline-md font-bold leading-none text-on-primary">
                RTI Online
              </span>
            </Link>
          </div>
          <div className="ml-8 hidden h-full items-center gap-4 md:flex">
            {links.map((link) => {
              const className = isActive(link.path)
                ? "flex h-full items-center border-b-2 border-secondary-fixed pb-1 text-on-primary transition-transform active:scale-95"
                : "flex h-full items-center px-2 text-on-primary/80 transition-transform hover:bg-primary-fixed-dim/10 hover:text-on-primary active:scale-95"

              if (link.opensGuidelines) {
                return (
                  <button className={className} key={link.label} onClick={() => openRequestGuidelines()} type="button">
                    {link.label}
                  </button>
                )
              }

              return (
                <Link className={className} key={link.label} to={link.path}>
                  {link.label}
                </Link>
              )
            })}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="mr-4 hidden gap-2 text-label-sm opacity-80 lg:flex">
              <button className="transition-colors hover:text-secondary-fixed">A+</button>
              <button className="transition-colors hover:text-secondary-fixed">A</button>
              <button className="transition-colors hover:text-secondary-fixed">A-</button>
              <span className="mx-2 h-4 border-l border-on-primary/30" />
              <button className="transition-colors hover:text-secondary-fixed">English</button>
              <span className="opacity-50">|</span>
              <button className="transition-colors hover:text-secondary-fixed">Hindi</button>
            </div>
            {user ? (
              <>
                <div className="group relative" ref={notificationMenuRef}>
                  <Button aria-expanded={isNotificationMenuOpen} aria-label={`Notifications${unreadNotificationCount ? ` (${unreadNotificationCount} new)` : ""}`} className="relative overflow-visible rounded-full text-on-primary hover:bg-on-primary/10 hover:text-on-primary" onClick={() => setIsNotificationMenuOpen((isOpen) => !isOpen)} size="icon-lg" type="button" variant="ghost">
                    <MaterialIcon>notifications</MaterialIcon>
                    {unreadNotificationCount ? <span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] leading-4 font-bold text-black">{unreadNotificationCount}</span> : null}
                  </Button>
                  <div className={`absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm ${isNotificationMenuOpen ? "block" : "hidden"}`}>
                    <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-4">
                      <h3 className="text-[14px] font-bold uppercase tracking-wider text-primary-container">Recent Notifications</h3>
                      <Button className="text-primary hover:text-primary" disabled={!unreadNotificationCount} onClick={() => setUnreadNotificationCount(0)} size="sm" type="button" variant="ghost">Mark all as read</Button>
                    </div>
                    <div className="divide-y divide-outline-variant/50">
                      {mockNotifications.slice(0, 3).map((notification) => (
                        <div className="cursor-pointer p-4 transition-colors hover:bg-surface-container-low" key={notification.id}>
                          <p className="text-[14px] font-medium text-on-surface">{notification.title}</p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{notification.requestId} · {notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-outline-variant p-3 text-center"><button className="text-[12px] font-semibold text-surface-tint hover:underline" onClick={() => { setIsNotificationMenuOpen(false); navigate("/notifications") }} type="button">View All Notifications</button></div>
                  </div>
                </div>
                <details className="group relative" onToggle={(event) => setIsProfileMenuOpen(event.currentTarget.open)} open={isProfileMenuOpen} ref={profileMenuRef}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-on-primary/10 px-3 py-1.5 transition-colors hover:bg-on-primary/20">
                    <MaterialIcon className="text-[20px]">account_circle</MaterialIcon>
                    <span className="hidden text-[14px] font-medium sm:block">{user.fullName}</span>
                    <MaterialIcon className="text-[18px] transition-transform group-open:rotate-180">expand_more</MaterialIcon>
                  </summary>
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-sm">
                    <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low" onClick={() => setIsProfileMenuOpen(false)} to="/profile">
                      <MaterialIcon className="text-[18px] text-muted-foreground">person</MaterialIcon>
                      <span><span className="block">Profile</span><span className="block text-xs font-normal text-muted-foreground">Personal and contact details</span></span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low" onClick={() => setIsProfileMenuOpen(false)} to="/request-history">
                      <MaterialIcon className="text-[18px] text-muted-foreground">description</MaterialIcon>
                      <span><span className="block">RTI Request History</span><span className="block text-xs font-normal text-muted-foreground">Track your submitted applications</span></span>
                    </Link>
                    <div className="my-1 border-t border-outline-variant/50" />
                    <button
                      className="flex w-full items-center gap-2 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                      onClick={handleLogout}
                      type="button"
                    >
                      <MaterialIcon className="text-[18px] text-muted-foreground">logout</MaterialIcon>
                      Logout
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <Link
                className="rounded bg-secondary px-6 py-2 font-label-lg text-label-lg text-on-secondary shadow-sm transition-colors hover:bg-secondary/90"
                to="/login"
              >
                {location.pathname === "/login" ? "Sign up" : "Signin/Signup"}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

function StitchFooter({ activeFaq = false }: { activeFaq?: boolean }) {
  const location = useLocation()
  const isFaqActive = activeFaq || location.pathname === "/faq"

  return (
    <footer className="mt-auto bg-on-surface text-surface-container-lowest" data-site-footer>
      <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-6 px-margin-mobile py-stack-lg md:flex-row md:px-margin-desktop">
        <div className="text-center font-headline-md text-headline-md md:text-left">
          © {new Date().getFullYear()} RTI Online. All Rights Reserved.
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link className="text-surface-variant transition-opacity hover:text-surface-container-lowest hover:opacity-80" to="/public-authorities">
            Public Authorities
          </Link>
          <Link
            className={
              isFaqActive
                ? "text-secondary-fixed underline transition-opacity hover:opacity-80"
                : "text-surface-variant transition-opacity hover:text-surface-container-lowest hover:opacity-80"
            }
            to="/faq"
          >
            FAQs
          </Link>
          <a className="text-surface-variant transition-opacity hover:text-surface-container-lowest hover:opacity-80" href="#">
            User Manual
          </a>
          <Link className="text-surface-variant transition-opacity hover:text-surface-container-lowest hover:opacity-80" to="/contact-us">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  )
}

export { emblemUrl, MaterialIcon, StitchFooter, StitchTopNav }
