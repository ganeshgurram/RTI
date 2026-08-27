import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { emblemUrl, MaterialIcon } from "@/routes/stitch-shell"

const captchaCodes = ["R6D2W", "N3Z8V", "T5Y1H"]
const otpLength = 6
const resendSeconds = 30

type SignupForm = {
  fullName: string
  email: string
  mobile: string
  username: string
  password: string
  confirmPassword: string
  captcha: string
  acceptedTerms: boolean
}

type FieldName = keyof SignupForm
type FormErrors = Partial<Record<FieldName, string>>

const emptyForm: SignupForm = {
  fullName: "",
  email: "",
  mobile: "",
  username: "",
  password: "",
  confirmPassword: "",
  captcha: "",
  acceptedTerms: false,
}

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000))

/** 0 for an empty box, then 1 (weak) through 3 (strong). */
function getPasswordScore(password: string) {
  if (!password) return 0

  let points = 0
  if (password.length >= 8) points += 1
  if (password.length >= 12) points += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1
  if (/\d/.test(password)) points += 1
  if (/[^A-Za-z0-9]/.test(password)) points += 1

  return Math.min(3, Math.max(1, points - 1))
}

function maskEmail(email: string) {
  const [name = "", domain = ""] = email.trim().split("@")
  const visible = name.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(1, name.length - visible.length))}@${domain}`
}

function maskMobile(mobile: string) {
  return `+91 ******${mobile.slice(-4)}`
}

/** Errors are held as translation keys so both languages report the same validation. */
function validate(values: SignupForm, expectedCaptcha: string): FormErrors {
  const errors: FormErrors = {}

  if (values.fullName.trim().length < 2) errors.fullName = "signup.errors.fullName"
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "signup.errors.email"
  if (!/^\d{10}$/.test(values.mobile)) errors.mobile = "signup.errors.mobile"
  if (!/^[a-z0-9][a-z0-9._]{3,19}$/.test(values.username)) errors.username = "signup.errors.username"
  if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) errors.password = "signup.errors.password"
  if (values.confirmPassword !== values.password) errors.confirmPassword = "signup.errors.confirmPassword"
  if (values.captcha.replaceAll(" ", "").toUpperCase() !== expectedCaptcha) errors.captcha = "signup.errors.captcha"
  if (!values.acceptedTerms) errors.acceptedTerms = "signup.errors.terms"

  return errors
}

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation()
  return message ? <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">{t(message)}</p> : null
}

export function SignupPage() {
  const { isAuthenticated, signup } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState<"details" | "verify">("details")
  const [form, setForm] = useState<SignupForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array<string>(otpLength).fill(""))
  const [verifyError, setVerifyError] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const activeCaptcha = captchaCodes[captchaIndex]
  const passwordScore = getPasswordScore(form.password)
  const strengthLabels = ["", t("signup.strengthWeak"), t("signup.strengthFair"), t("signup.strengthStrong")]
  const strengthColours = ["", "bg-destructive", "bg-state-warning", "bg-state-success"]

  useEffect(() => {
    if (step !== "verify") return

    otpRefs.current[0]?.focus()
    const timer = window.setInterval(() => setSecondsLeft((current) => (current > 0 ? current - 1 : 0)), 1000)
    return () => window.clearInterval(timer)
  }, [step])

  if (isAuthenticated) return <Navigate replace to="/profile" />

  const updateField = <Name extends FieldName>(field: Name, value: SignupForm[Name]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === "password") delete next.confirmPassword
      return next
    })
  }

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    updateField("captcha", "")
  }

  const sendCode = () => {
    setOtp(createOtp())
    setOtpDigits(Array<string>(otpLength).fill(""))
    setVerifyError("")
    setSecondsLeft(resendSeconds)
  }

  const handleDetailsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(form, activeCaptcha)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    sendCode()
    setStep("verify")
  }

  const setOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    setOtpDigits((current) => current.map((existing, position) => (position === index ? digit : existing)))
    setVerifyError("")

    if (digit && index < otpLength - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      event.preventDefault()
      setOtpDigits((current) => current.map((existing, position) => (position === index - 1 ? "" : existing)))
      otpRefs.current[index - 1]?.focus()
      return
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }

    if (event.key === "ArrowRight" && index < otpLength - 1) {
      event.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpLength)
    if (!pasted) return

    event.preventDefault()
    setOtpDigits(Array.from({ length: otpLength }, (_, index) => pasted[index] ?? ""))
    setVerifyError("")
    otpRefs.current[Math.min(pasted.length, otpLength - 1)]?.focus()
  }

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const entered = otpDigits.join("")

    if (entered.length < otpLength) {
      setVerifyError("signup.errors.otpIncomplete")
      return
    }

    if (entered !== otp) {
      setVerifyError("signup.errors.otpMismatch")
      return
    }

    const signupError = signup({
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      username: form.username,
      password: form.password,
    })

    if (signupError) {
      setErrors({ [signupError === "signup.usernameTaken" ? "username" : "email"]: signupError })
      setStep("details")
      return
    }

    navigate("/profile", { replace: true })
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh/var(--app-scale)-12rem)] w-full max-w-container-max items-center justify-center p-margin-mobile md:p-margin-desktop">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <div className="flex items-center justify-center gap-2.5">
          <img alt="RTI Online" className="h-9 w-auto shrink-0" src={emblemUrl} />
          <span className="h-9 w-px shrink-0 bg-outline-variant" aria-hidden="true" />
          <span className="whitespace-nowrap font-headline-md text-headline-md font-bold leading-none text-primary">RTI Online</span>
        </div>

        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-primary">{step === "details" ? t("signup.title") : t("signup.verifyTitle")}</CardTitle>
            <CardDescription>{step === "details" ? t("signup.subtitle") : t("signup.verifySubtitle")}</CardDescription>
            <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-2">
              <span className={`h-1.5 w-10 rounded-full transition-colors ${step === "details" ? "bg-primary" : "bg-primary/30"}`} />
              <span className={`h-1.5 w-10 rounded-full transition-colors ${step === "verify" ? "bg-primary" : "bg-primary/30"}`} />
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">{t("signup.stepLabel", { current: step === "details" ? 1 : 2, total: 2 })}</p>
          </CardHeader>

          <CardContent>
            {step === "details" ? (
              <form noValidate onSubmit={handleDetailsSubmit}>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="signup-name">{t("signup.fullName")}</FieldLabel>
                    <Input aria-invalid={Boolean(errors.fullName)} autoComplete="name" id="signup-name" onChange={(event) => updateField("fullName", event.target.value)} placeholder={t("signup.fullNamePlaceholder")} value={form.fullName} />
                    <FieldError message={errors.fullName} />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="signup-email">{t("signup.email")}</FieldLabel>
                      <Input aria-invalid={Boolean(errors.email)} autoComplete="email" id="signup-email" onChange={(event) => updateField("email", event.target.value)} placeholder={t("signup.emailPlaceholder")} type="email" value={form.email} />
                      <FieldError message={errors.email} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="signup-mobile">{t("signup.mobile")}</FieldLabel>
                      <div className="flex">
                        <span className="flex h-8 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</span>
                        <Input aria-invalid={Boolean(errors.mobile)} autoComplete="tel-national" className="rounded-l-none" id="signup-mobile" inputMode="numeric" maxLength={10} onChange={(event) => updateField("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder={t("signup.mobilePlaceholder")} value={form.mobile} />
                      </div>
                      <FieldError message={errors.mobile} />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="signup-username">{t("signup.username")}</FieldLabel>
                    <Input aria-invalid={Boolean(errors.username)} autoComplete="username" id="signup-username" onChange={(event) => updateField("username", event.target.value.toLowerCase().replace(/\s/g, ""))} placeholder={t("signup.usernamePlaceholder")} value={form.username} />
                    {errors.username ? <FieldError message={errors.username} /> : <FieldDescription>{t("signup.usernameHint")}</FieldDescription>}
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="signup-password">{t("signup.password")}</FieldLabel>
                      <div className="relative">
                        <Input aria-invalid={Boolean(errors.password)} autoComplete="new-password" className={form.password ? "pr-10" : undefined} id="signup-password" onChange={(event) => updateField("password", event.target.value)} placeholder={t("signup.passwordPlaceholder")} type={isPasswordVisible ? "text" : "password"} value={form.password} />
                        {form.password ? <button aria-label={isPasswordVisible ? t("login.hidePassword") : t("login.showPassword")} className="absolute inset-y-0 right-0 flex items-center px-3 text-outline transition-colors hover:text-on-surface" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button"><MaterialIcon className="text-[18px]">{isPasswordVisible ? "visibility_off" : "visibility"}</MaterialIcon></button> : null}
                      </div>
                      {form.password ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div aria-hidden="true" className="flex flex-1 gap-1">
                            {[1, 2, 3].map((segment) => (
                              <span className={`h-1 flex-1 rounded-full transition-colors ${segment <= passwordScore ? strengthColours[passwordScore] : "bg-outline-variant"}`} key={segment} />
                            ))}
                          </div>
                          <span className="shrink-0 text-xs font-medium text-on-surface-variant">{strengthLabels[passwordScore]}</span>
                        </div>
                      ) : null}
                      <FieldError message={errors.password} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="signup-confirm">{t("signup.confirmPassword")}</FieldLabel>
                      <Input aria-invalid={Boolean(errors.confirmPassword)} autoComplete="new-password" id="signup-confirm" onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder={t("signup.confirmPlaceholder")} type={isPasswordVisible ? "text" : "password"} value={form.confirmPassword} />
                      <FieldError message={errors.confirmPassword} />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="signup-captcha">{t("login.securityCheck")}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input aria-invalid={Boolean(errors.captcha)} className="h-10" id="signup-captcha" onChange={(event) => updateField("captcha", event.target.value)} placeholder={t("login.enterCaptcha")} value={form.captcha} />
                      <span aria-label={t("login.securityCheck")} className="flex h-10 min-w-24 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">{activeCaptcha}</span>
                      <Button aria-label={t("login.refreshSecurity")} onClick={refreshCaptcha} size="icon-lg" type="button" variant="ghost"><MaterialIcon>refresh</MaterialIcon></Button>
                    </div>
                    <FieldError message={errors.captcha} />
                  </Field>

                  <Field>
                    <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-on-surface">
                      <input checked={form.acceptedTerms} className="mt-0.5 size-4 shrink-0 accent-primary" onChange={(event) => updateField("acceptedTerms", event.target.checked)} type="checkbox" />
                      {t("signup.terms")}
                    </label>
                    <FieldError message={errors.acceptedTerms} />
                  </Field>

                  <Field>
                    <Button className="h-10 w-full" type="submit">{t("signup.createAccount")}</Button>
                  </Field>
                </FieldGroup>
              </form>
            ) : (
              <form noValidate onSubmit={handleVerify}>
                <div className="mb-4 rounded-md border border-primary/20 bg-primary-fixed/40 p-3 text-sm text-on-surface">
                  <p className="font-semibold text-primary">{t("signup.codeSentTo")}</p>
                  <p className="mt-1 text-on-surface-variant">{maskEmail(form.email)} · {maskMobile(form.mobile)}</p>
                  <p className="mt-2 text-on-surface-variant">{t("signup.demoCode")}: <span className="font-mono font-bold tracking-[0.3em] text-on-surface">{otp}</span></p>
                </div>

                <label className="block text-center text-sm font-medium text-on-surface" htmlFor="signup-otp-0">{t("signup.enterCode")}</label>
                <div className="mt-3 flex justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      aria-invalid={Boolean(verifyError)}
                      aria-label={t("signup.digitLabel", { position: index + 1 })}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      className="size-12 rounded-lg border border-input bg-transparent text-center font-mono text-lg font-bold text-on-surface shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                      id={`signup-otp-${index}`}
                      inputMode="numeric"
                      key={index}
                      onChange={(event) => setOtpDigit(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                      ref={(element) => { otpRefs.current[index] = element }}
                      value={digit}
                    />
                  ))}
                </div>

                {verifyError ? <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive" role="alert">{t(verifyError)}</p> : null}

                <div className="mt-4 text-center text-sm text-on-surface-variant">
                  {secondsLeft > 0 ? (
                    <span>{t("signup.resendIn", { seconds: `0:${String(secondsLeft).padStart(2, "0")}` })}</span>
                  ) : (
                    <button className="font-medium text-surface-tint underline-offset-4 hover:underline" onClick={sendCode} type="button">{t("signup.resendCode")}</button>
                  )}
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                  <Button className="h-10 sm:flex-1" onClick={() => setStep("details")} type="button" variant="outline">{t("signup.changeDetails")}</Button>
                  <Button className="h-10 sm:flex-1" type="submit">{t("signup.verifyAndCreate")}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-on-surface-variant">
          {t("signup.alreadyRegistered")}{" "}
          <Link className="font-medium text-surface-tint underline-offset-4 hover:underline" to="/login">{t("nav.signIn")}</Link>
        </p>

        <FieldDescription className="px-4 text-center">{t("login.prototypeNote")}</FieldDescription>
      </div>
    </section>
  )
}
