import { type FormEvent, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { demoCredentials } from "@/data/mock-profile"
import { emblemUrl, MaterialIcon } from "@/routes/stitch-shell"

const captchaUrl = "/assets/captcha-texture.jpg"
const captchaCodes = ["A7X9B", "K4M2Q", "P9T6R"]

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState("")

  const redirectTo = location.state?.from ?? "/profile"
  const activeCaptcha = captchaCodes[captchaIndex]

  if (isAuthenticated) return <Navigate replace to="/profile" />

  const refreshCaptcha = () => {
    setCaptchaIndex((current) => (current + 1) % captchaCodes.length)
    setCaptcha("")
    setError("")
  }

  const completeLogin = (nextUsername: string, nextPassword: string) => {
    const loginError = login(nextUsername, nextPassword)

    if (loginError) {
      setError(loginError)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (captcha.replaceAll(" ", "").toUpperCase() !== activeCaptcha) {
      setError("The security check does not match. Please try again.")
      return
    }

    completeLogin(username, password)
  }

  const handleDigiLockerSignIn = () => navigate("/digilocker-authorize")

  return (
    <section className="mx-auto flex min-h-[calc(100svh/var(--app-scale)-12rem)] w-full max-w-container-max items-center justify-center p-margin-mobile md:p-margin-desktop">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-center gap-2.5">
          <img alt="RTI Online" className="h-9 w-auto shrink-0" src={emblemUrl} />
          <span className="h-9 w-px shrink-0 bg-outline-variant" aria-hidden="true" />
          <span className="whitespace-nowrap font-headline-md text-headline-md font-bold leading-none text-primary">RTI Online</span>
        </div>

        <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-primary">Welcome back</CardTitle>
            <CardDescription>Sign in to submit requests, file appeals, and track your RTI applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-md border border-primary/20 bg-primary-fixed/40 p-3 text-sm text-on-surface">
              <p className="font-semibold text-primary">Demo account</p>
              <p className="mt-1 text-on-surface-variant">Username: <span className="font-medium text-on-surface">{demoCredentials.username}</span></p>
              <p className="text-on-surface-variant">Password: <span className="font-medium text-on-surface">{demoCredentials.password}</span></p>
            </div>

            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input autoComplete="username" id="username" onChange={(event) => { setUsername(event.target.value); setError("") }} placeholder="Enter your username" required value={username} />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <button className="ml-auto text-sm text-surface-tint underline-offset-4 hover:underline" type="button">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Input autoComplete="current-password" className={password ? "pr-10" : undefined} id="password" onChange={(event) => { setPassword(event.target.value); setError("") }} placeholder="Enter your password" required type={isPasswordVisible ? "text" : "password"} value={password} />
                    {password ? <button aria-label={isPasswordVisible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex items-center px-3 text-outline transition-colors hover:text-on-surface" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button"><MaterialIcon className="text-[18px]">{isPasswordVisible ? "visibility_off" : "visibility"}</MaterialIcon></button> : null}
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="captcha">Security Check</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input aria-invalid={Boolean(error && captcha)} className="h-10" id="captcha" onChange={(event) => { setCaptcha(event.target.value); setError("") }} placeholder="Enter captcha" required value={captcha} />
                    <div className="relative flex h-10 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high">
                      <img alt="" className="h-full w-full object-cover opacity-60 mix-blend-multiply" src={captchaUrl} />
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tracking-widest text-primary mix-blend-difference">{activeCaptcha.split("").join(" ")}</span>
                    </div>
                    <Button aria-label="Refresh security check" onClick={refreshCaptcha} size="icon-lg" type="button" variant="ghost"><MaterialIcon>refresh</MaterialIcon></Button>
                  </div>
                </Field>

                {error ? <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}

                <Field>
                  <Button className="h-10 w-full" type="submit">Sign In</Button>
                </Field>

                <FieldSeparator className="my-3 *:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

                <Field>
                  <Button className="h-10 w-full !border-black !bg-black !text-white hover:!border-neutral-900 hover:!bg-neutral-900 hover:!text-white" onClick={handleDigiLockerSignIn} type="button" variant="outline">
                    <img alt="" aria-hidden="true" className="block h-5 w-5 shrink-0 object-contain brightness-0 invert" height={20} src="/assets/digilocker.svg" width={20} />
                    Sign in with DigiLocker
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <FieldDescription className="px-4 text-center">This prototype uses mock account data only.</FieldDescription>
        <div className="flex items-center justify-center text-sm text-outline"><MaterialIcon className="mr-1 text-base">verified_user</MaterialIcon><span>Secure demo session</span></div>
      </div>
    </section>
  )
}
