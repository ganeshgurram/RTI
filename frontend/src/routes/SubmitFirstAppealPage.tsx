import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

const codes = ["726958", "318402", "604791"]

export function SubmitFirstAppealPage() {
  const navigate = useNavigate()
  const [captchaIndex, setCaptchaIndex] = useState(0)

  const beginAppeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate("/first-appeal-form")
  }

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-1 flex-col items-center px-margin-mobile py-stack-lg md:px-margin-desktop md:py-12">
      <div className="w-full max-w-3xl">
        <header className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <h1 className="mb-stack-sm font-headline-lg text-headline-lg-mobile text-primary md:text-headline-lg">Online RTI First Appeal Form</h1>
          <p className="text-body-md text-on-surface-variant">If request registration no. is available please provide in the box given below.</p>
        </header>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg">
          <form className="flex flex-col gap-stack-md" onSubmit={beginAppeal}>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-center md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:w-1/3" htmlFor="appeal-registration-number"><span className="text-error">*</span> RTI Request Registration No.</label>
              <div className="flex flex-grow items-center gap-2">
                <input className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-registration-number" placeholder="Enter Registration No." type="text" />
                <button aria-label="Help with registration number" className="text-surface-tint transition-colors hover:text-primary" title="Help with Registration Number" type="button"><MaterialIcon className="text-[20px]">help</MaterialIcon></button>
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm md:flex-row md:items-center md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:w-1/3" htmlFor="appeal-email"><span className="text-error">*</span> Enter Email Id</label>
              <div className="flex-grow"><input className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-email" placeholder="Enter Email Address" type="email" /></div>
            </div>
            <div className="flex flex-col gap-stack-sm pt-stack-sm md:flex-row md:gap-gutter">
              <label className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface md:mt-2 md:w-1/3" htmlFor="appeal-captcha"><span className="text-error">*</span> Enter Security code</label>
              <div className="flex flex-grow flex-col gap-stack-sm">
                <div className="flex items-center gap-stack-md">
                  <div aria-label="Security code" className="relative overflow-hidden rounded-md border border-outline-variant bg-surface-container-high px-4 py-2 font-mono text-headline-md tracking-[0.2em] text-on-surface">{codes[captchaIndex]}</div>
                  <button className="flex items-center gap-1 text-sm font-label-lg text-surface-tint underline transition-colors hover:text-primary" onClick={() => setCaptchaIndex((current) => (current + 1) % codes.length)} type="button"><MaterialIcon className="text-[16px]">refresh</MaterialIcon>refresh</button>
                </div>
                <input className="w-48 rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary" id="appeal-captcha" placeholder="Enter code" type="text" />
              </div>
            </div>
            <div className="mt-stack-md flex justify-center gap-stack-md border-t border-surface-container-high pt-stack-lg md:justify-start md:pl-[33%]">
              <button className="min-w-30 rounded-lg bg-primary px-6 py-2 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit">Submit</button>
              <button className="min-w-30 rounded-lg border border-outline-variant bg-surface-container px-6 py-2 font-label-lg text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" type="reset">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
