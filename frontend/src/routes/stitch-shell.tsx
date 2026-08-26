import { Link, useLocation } from "react-router-dom"

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
  "https://lh3.googleusercontent.com/aida/AEtjO1U4EGkZp9UsMwSsgatteezFLWIHZ-nQs3WOt2GyF_xDSo6ZTSgVTEIczch4tita5Y72Ao4lbPgCbp38ZAyNVxaLojZAkrNdrvqI636xQ8nHtdAALVJaIhqm8GMqnfZPWsYcKRbZexmDwCjcg_vBKkPxG_ouUBwDRv32z1v0Jzo2FNB3nUxWT67kRwnHSG-EXMEdHBj4NwUs4TB2JQI5ZZiAaukUhlOt_mUP6DFduV8d39DFDOJIgsBdux2-"

function MaterialIcon({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>
}

function StitchTopNav() {
  const location = useLocation()
  const isProfile = location.pathname === "/profile"
  const links = [
    { label: "Home", path: "/" },
    { label: "Submit Request", path: "/login" },
    { label: "Submit First Appeal", path: "/profile" },
    { label: "View Status", path: "/profile" },
  ]

  const drawerLinks = [
    ...links,
    { label: "Submit Second Appeal", path: "/profile" },
    { label: "FAQs", path: "/faq" },
    { label: "Login", path: "/login" },
  ]

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }

    return location.pathname.startsWith(path)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-outline-variant bg-primary text-on-primary shadow-sm">
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
                  <SheetTitle className="flex items-center gap-2">
                    <img alt="Indian Emblem" className="h-10 w-auto opacity-90" src={emblemUrl} />
                    <span className="h-7 border-l border-border" aria-hidden="true" />
                    <span className="whitespace-nowrap font-headline-md text-headline-md font-bold">
                      RTI Online
                    </span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Navigation</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col px-4">
                  {drawerLinks.map((link) => (
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
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Link className="flex items-center gap-2" to="/">
              <img alt="Indian Emblem" className="h-10 w-auto opacity-90" src={emblemUrl} />
              <span className="h-7 border-l border-on-primary/30" aria-hidden="true" />
              <div className="whitespace-nowrap font-headline-md text-headline-md font-bold text-on-primary">
                RTI Online
              </div>
            </Link>
          </div>
          <div className="ml-8 hidden h-full items-center gap-4 md:flex">
            {links.map((link) => (
              <Link
                className={
                  isActive(link.path)
                    ? "flex h-full items-center border-b-2 border-secondary-fixed pb-1 text-on-primary transition-transform active:scale-95"
                    : "flex h-full items-center px-2 text-on-primary/80 transition-transform hover:bg-primary-fixed-dim/10 hover:text-on-primary active:scale-95"
                }
                key={link.label}
                to={link.path}
              >
                {link.label}
              </Link>
            ))}
            {location.pathname === "/faq" && (
              <Link
                className="flex h-full items-center border-b-2 border-secondary-fixed pb-1 text-on-primary transition-transform active:scale-95"
                to="/faq"
              >
                FAQs
              </Link>
            )}
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
            {isProfile ? (
              <>
                <div className="group relative">
                  <button className="rounded-full p-2 text-on-primary transition-colors hover:bg-on-primary/10">
                    <MaterialIcon>notifications</MaterialIcon>
                  </button>
                  <div className="absolute right-0 z-50 mt-2 hidden w-72 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm group-hover:block">
                    <div className="border-b border-outline-variant bg-surface-container-low p-4">
                      <h3 className="text-[14px] font-bold uppercase tracking-wider text-primary-container">Recent Notifications</h3>
                    </div>
                    <div className="divide-y divide-outline-variant/50">
                      <div className="cursor-pointer p-4 transition-colors hover:bg-surface-container-low"><p className="text-[14px] font-medium text-on-surface">RTI-2024-0105 is <span className="text-muted-foreground">Processing</span></p><p className="mt-1 text-[12px] text-on-surface-variant">2 hours ago</p></div>
                      <div className="cursor-pointer p-4 transition-colors hover:bg-surface-container-low"><p className="text-[14px] font-medium text-on-surface">RTI-2023-8942 is <span className="text-muted-foreground">Satisfied</span></p><p className="mt-1 text-[12px] text-on-surface-variant">Yesterday</p></div>
                      <div className="cursor-pointer p-4 transition-colors hover:bg-surface-container-low"><p className="text-[14px] font-medium text-on-surface">RTI-2023-5521 is <span className="text-error">Not Satisfied</span></p><p className="mt-1 text-[12px] text-on-surface-variant">3 days ago</p></div>
                    </div>
                    <div className="border-t border-outline-variant p-3 text-center"><button className="text-[12px] font-semibold text-surface-tint hover:underline">View All Notifications</button></div>
                  </div>
                </div>
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-on-primary/10 px-3 py-1.5 transition-colors hover:bg-on-primary/20">
                    <MaterialIcon className="text-[20px]">account_circle</MaterialIcon>
                    <span className="hidden text-[14px] font-medium sm:block">Profile</span>
                    <MaterialIcon className="text-[18px] transition-transform group-open:rotate-180">expand_more</MaterialIcon>
                  </summary>
                  <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
                    <Link
                      className="flex w-full items-center gap-2 px-4 py-3 text-[14px] font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                      to="/login"
                    >
                      <MaterialIcon className="text-[18px] text-muted-foreground">logout</MaterialIcon>
                      Logout
                    </Link>
                  </div>
                </details>
              </>
            ) : (
              <Link
                className="rounded bg-secondary px-6 py-2 font-label-lg text-label-lg text-on-secondary shadow-sm transition-colors hover:bg-secondary/90"
                to="/login"
              >
                {location.pathname === "/login" ? "Login" : "Signin/Signup"}
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
    <footer className="mt-auto bg-on-surface text-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-container-max flex-col items-center justify-between gap-6 px-margin-mobile py-stack-lg md:flex-row md:px-margin-desktop">
        <div className="text-center font-headline-md text-headline-md md:text-left">
          © 2024 RTI Online. All Rights Reserved.
        </div>
        <div className="flex flex-wrap justify-center gap-6">
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
          <a className="text-surface-variant transition-opacity hover:text-surface-container-lowest hover:opacity-80" href="#">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  )
}

export { emblemUrl, MaterialIcon, StitchFooter, StitchTopNav }
