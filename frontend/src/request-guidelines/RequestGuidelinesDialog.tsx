import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type RequestGuidelinesContextValue = {
  openRequestGuidelines: () => void
}

const RequestGuidelinesContext = createContext<RequestGuidelinesContextValue | null>(null)

const guidelines = [
  "This portal may be used by Indian citizens to file RTI applications and first appeals online for the Government of India ministries and departments covered by this service.",
  "Use Submit Request to enter the application details. Fields marked with an asterisk (*) are mandatory.",
  "Enter your request in the application text field. The application text is limited to 3,000 characters and supports letters, numbers, and common punctuation.",
  "If your application is longer, upload it as a supporting document. Do not upload Aadhaar, PAN, or other personal identity documents unless you are claiming BPL status. PDF file names must not contain spaces.",
  "Select Make Payment after completing the request. Online payments can be made through internet banking, cards, UPI, or RuPay, subject to the applicable RTI Rules, 2012 fee.",
  "Do not submit the request again if payment is completed but a registration number is not displayed. Allow 24 to 48 hours for confirmation and contact support with your transaction details if needed.",
  "Applicants below the poverty line are not required to pay the fee, but a valid BPL certificate must be uploaded with the request.",
  "A unique registration number is issued after submission. The request is sent to the Nodal Officer of the concerned public authority and then to the appropriate CPIO for processing.",
  "If an additional fee is required, its details and payment status will be available through the portal and may also be communicated by email or SMS.",
  "You can submit a first appeal online when you are dissatisfied with the response or have not received one. No fee is charged for filing a first appeal through this portal.",
  "Use the View Status service and your registration number to track an application or appeal. The provisions of the RTI Act, 2005 and its rules apply to all requests filed here.",
]

export function RequestGuidelinesDialogProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const guidelinesScrollRef = useRef<HTMLDivElement>(null)

  const updateScrollProgress = () => {
    const scrollArea = guidelinesScrollRef.current

    if (!scrollArea) {
      return
    }

    if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 8) {
      setHasReachedEnd(true)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frame = window.requestAnimationFrame(updateScrollProgress)
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  const closeDialog = () => {
    setIsOpen(false)
    setHasAcknowledged(false)
    setHasReachedEnd(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true)
      setHasAcknowledged(false)
      setHasReachedEnd(false)
      return
    }

    closeDialog()
  }

  const handleSubmit = () => {
    closeDialog()
    navigate("/login")
  }

  return (
    <RequestGuidelinesContext.Provider
      value={{
        openRequestGuidelines: () => {
          setHasAcknowledged(false)
          setHasReachedEnd(false)
          setIsOpen(true)
        },
      }}
    >
      {children}
      <Dialog onOpenChange={handleOpenChange} open={isOpen}>
        <DialogContent
          className="grid max-h-[calc(100svh_-_2rem)] w-[calc(100%_-_2rem)] grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <DialogHeader className="border-b border-outline-variant px-5 py-4 pr-12 sm:px-6">
            <DialogTitle className="font-headline-md text-xl font-bold text-primary">
              Guidelines for Filing an RTI Request
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Please read these guidelines before starting your application.
            </DialogDescription>
          </DialogHeader>

          <div
            className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6"
            onScroll={updateScrollProgress}
            ref={guidelinesScrollRef}
          >
            <ol className="space-y-4 pl-5 text-sm leading-6 text-on-surface-variant marker:font-semibold marker:text-primary">
              {guidelines.map((guideline) => (
                <li key={guideline}>{guideline}</li>
              ))}
            </ol>
          </div>

          <div className="border-t border-outline-variant px-5 py-4 sm:px-6">
            <label className={`flex items-start gap-3 text-sm font-medium leading-5 text-on-surface ${hasReachedEnd ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
              <input
                checked={hasAcknowledged}
                className="mt-0.5 size-4 shrink-0 rounded border-outline text-primary accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
                disabled={!hasReachedEnd}
                onChange={(event) => setHasAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>I have read and understood the above guidelines.</span>
            </label>
            {/* {!hasReachedEnd ? (
              <p className="mt-2 pl-7 text-xs text-on-surface-variant">Scroll to the end of the guidelines to acknowledge them.</p>
            ) : null} */}
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:px-6">
            <Button onClick={closeDialog} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={!hasAcknowledged} onClick={handleSubmit} type="button">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequestGuidelinesContext.Provider>
  )
}

export function useRequestGuidelines() {
  const context = useContext(RequestGuidelinesContext)

  if (!context) {
    throw new Error("useRequestGuidelines must be used within RequestGuidelinesDialogProvider")
  }

  return context
}
