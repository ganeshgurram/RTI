import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

const captchaCodes = ["C8T9P", "M4K7Q", "R2V6N"]

export function PaymentReconciliationPage() {
  const navigate = useNavigate()
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [error, setError] = useState("")
  const captchaCode = captchaCodes[captchaIndex]

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    setError("")
  }

  const locateTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const captcha = String(formData.get("captcha") ?? "").trim()

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the email address used for your RTI request or appeal.")
      return
    }

    if (captcha.toUpperCase() !== captchaCode) {
      setError("The security code does not match. Please try again.")
      return
    }

    setError("")
    navigate("/transaction-status")
  }

  return (
    <main className="mx-auto flex w-full max-w-container-max flex-1 items-center justify-center overflow-hidden bg-surface-container-lowest px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mt-8 flex w-full max-w-3xl flex-col items-center">
        <header className="mb-8 w-full text-center">
          <h1 className="mb-2 font-headline text-3xl font-semibold text-primary">Payment Reconciliation</h1>
          <p className="text-base text-on-surface-variant">Reconciliation of unsuccessful RTI request payments</p>
        </header>

        <section className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm text-on-surface-variant">Note: Fields marked with <span className="font-bold text-error">*</span> are Mandatory.</p>
            <p className="text-sm font-medium text-green-700">Enter email id, mobile number that was used earlier to file RTI request/appeal.</p>
          </div>

          <form className="flex w-full flex-col gap-6" noValidate onReset={() => setError("")} onSubmit={locateTransaction}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="reconciliation-email"><span className="mr-1 text-error">*</span>Enter Email Id (For receiving OTP)</label>
              <input className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="reconciliation-email" name="email" placeholder="e.g user@domain.com" type="email" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="reconciliation-mobile">Mobile Number</label>
              <div className="flex items-center gap-2">
                <input className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="reconciliation-mobile" maxLength={10} name="mobile" placeholder="Enter Mobile Number" type="tel" />
                <span aria-label="Mobile number help" className="cursor-help text-xl text-outline" title="Use the mobile number entered when you filed the request or appeal"><MaterialIcon>help</MaterialIcon></span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-on-surface" htmlFor="reconciliation-captcha"><span className="mr-1 text-error">*</span>Enter Security code</label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div aria-label="Security code" className="rounded-md border border-outline-variant bg-surface px-4 py-3 font-mono text-xl font-semibold tracking-[0.22em] text-on-surface">{captchaCode}</div>
                  <input className="w-40 rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm uppercase text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="reconciliation-captcha" name="captcha" placeholder="Enter code" type="text" />
                  <button aria-label="Refresh security code" className="flex items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-surface hover:text-primary-container" onClick={refreshCaptcha} type="button"><MaterialIcon>refresh</MaterialIcon></button>
                </div>
                <span className="text-xs text-on-surface-variant">(All Characters are Case insensitive)</span>
              </div>
            </div>
            {error ? <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-sm font-medium text-error" role="alert">{error}</p> : null}
            <div className="mt-6 flex justify-center gap-4 border-t border-outline-variant pt-6">
              <button className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit">Submit</button>
              <button className="rounded-md border border-outline-variant bg-surface-container-lowest px-8 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface" type="reset">Reset</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export function TransactionStatusPage() {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const statusLabel = isConfirmed ? "Payment Confirmed" : "Processing with Bank"

  return (
    <main className="flex flex-1 items-center justify-center p-margin-mobile md:p-margin-desktop">
      <section className="w-full max-w-2xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <header className="flex items-center gap-4 border-b border-outline-variant bg-surface-container-low px-6 py-6 md:px-8">
          <div className={`flex size-12 items-center justify-center rounded-full ${isConfirmed ? "bg-green-100 text-green-700" : "bg-secondary-container text-on-secondary-container"}`}><MaterialIcon>{isConfirmed ? "check_circle" : "hourglass_top"}</MaterialIcon></div>
          <div><h1 className="text-2xl font-bold text-on-surface">{isConfirmed ? "Payment Confirmed" : "Transaction Located"}</h1><p className="mt-1 text-sm text-on-surface-variant">{isConfirmed ? "Your bank has confirmed the payment for this RTI request." : "We found a recent payment attempt matching your details."}</p></div>
        </header>
        <div className="p-6 md:p-8">
          <section className="mb-8 overflow-hidden rounded-lg border border-outline-variant">
            <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Transaction Details</span><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isConfirmed ? "bg-green-100 text-green-700" : "bg-secondary-container text-on-secondary-container"}`}><span className={`size-2 rounded-full ${isConfirmed ? "bg-green-700" : "bg-secondary"}`} />{statusLabel}</span></div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2"><TransactionDetail label="Transaction ID" value="TXN_9823410" /><TransactionDetail label="Date & Time" value="24 Oct 2024, 11:30 AM" /><TransactionDetail label="Amount" value="₹ 10.00" /><TransactionDetail label="Payment Method" value="Net Banking" /></div>
          </section>
          <section className="mb-8 flex items-start gap-4 rounded-lg bg-surface-container p-6"><MaterialIcon className="mt-0.5 text-surface-tint">info</MaterialIcon><div><h2 className="mb-1 font-semibold text-on-surface">What does this mean?</h2><p className="text-sm leading-relaxed text-on-surface-variant">{isConfirmed ? "Your payment has been confirmed. You can return to the application and complete the request submission." : "Your payment has been initiated but we have not yet received final confirmation from your bank. You can check the latest status manually below. Please avoid making a duplicate payment while this is processing."}</p></div></section>
          <div className="flex flex-col gap-4 sm:flex-row"><button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary" onClick={() => setIsConfirmed(true)} type="button"><MaterialIcon>sync</MaterialIcon>{isConfirmed ? "Status Updated" : "Check Latest Status"}</button><Link className="flex flex-1 items-center justify-center rounded-lg border-2 border-outline px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-surface-container" to="/">Return Home</Link></div>
          <div className="mt-8 border-t border-outline-variant pt-6 text-center"><p className="text-sm text-on-surface-variant">Payment continuously failing or status not updating? <Link className="inline-flex items-center gap-1 font-semibold text-surface-tint hover:underline" to="/contact-us">Contact Helpdesk <MaterialIcon className="text-[16px]">arrow_forward</MaterialIcon></Link></p></div>
        </div>
      </section>
    </main>
  )
}

function TransactionDetail({ label, value }: { label: string; value: string }) {
  return <div><span className="mb-1 block text-sm font-medium text-outline">{label}</span><span className="block text-lg font-semibold text-on-surface">{value}</span></div>
}
