import { emblemUrl, MaterialIcon } from "@/routes/stitch-shell"

const captchaUrl =
  "/assets/captcha-texture.jpg"

export function LoginPage() {
  return (
      <section className="mx-auto flex min-h-[calc(100svh-12rem)] w-full max-w-container-max items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-sm">
          <div className="mb-stack-lg text-center">
            <div className="mb-stack-sm flex items-center justify-center gap-2">
              <img alt="RTI Logo" className="h-12 w-auto" src={emblemUrl} />
              <h2 className="font-headline-lg text-headline-lg text-primary">RTI Online | Sign In</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Access your RTI account to submit requests, file appeals, and track status.
            </p>
          </div>
          <form className="space-y-stack-md">
            <div>
              <label className="mb-base block font-label-lg text-label-lg text-on-surface" htmlFor="username">Username</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MaterialIcon className="text-outline">person</MaterialIcon></div>
                <input className="w-full rounded-DEFAULT border border-outline-variant py-2 pl-10 pr-4 font-body-md text-body-md text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" id="username" placeholder="Enter your username" type="text" />
              </div>
            </div>
            <div>
              <div className="mb-base flex items-center justify-between">
                <label className="block font-label-lg text-label-lg text-on-surface" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-surface-tint hover:underline" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MaterialIcon className="text-outline">key</MaterialIcon></div>
                <input className="w-full rounded-DEFAULT border border-outline-variant py-2 pl-10 pr-10 font-body-md text-body-md text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" id="password" placeholder="Enter your password" type="password" />
                <button className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-on-surface" type="button"><MaterialIcon>visibility</MaterialIcon></button>
              </div>
            </div>
            <div>
              <label className="mb-base block font-label-lg text-label-lg text-on-surface" htmlFor="captcha">Security Check</label>
              <div className="mb-3 flex items-center space-x-4">
                <div className="relative flex h-10 w-32 items-center justify-center overflow-hidden rounded-DEFAULT border border-outline-variant bg-surface-container-high">
                  <img alt="" className="h-full w-full object-cover opacity-60 mix-blend-multiply" src={captchaUrl} />
                  <div className="absolute inset-0 flex items-center justify-center font-bold tracking-widest text-primary mix-blend-difference">A 7 X 9 B</div>
                </div>
                <button className="text-surface-tint transition-colors hover:text-primary" type="button"><MaterialIcon>refresh</MaterialIcon></button>
              </div>
              <input className="w-full rounded-DEFAULT border border-outline-variant px-4 py-2 font-body-md text-body-md text-on-surface focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" id="captcha" placeholder="Enter characters from image" type="text" />
            </div>
            <button className="flex w-full items-center justify-center rounded-DEFAULT bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container" type="submit">
              Sign In <MaterialIcon className="ml-2 text-sm">login</MaterialIcon>
            </button>
          </form>
          <div className="mt-stack-lg border-t border-outline-variant pt-stack-md text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">Don't have an account? <a className="ml-1 font-label-lg text-label-lg text-primary hover:underline" href="#">Register Here</a></p>
          </div>
          <div className="mt-stack-md flex items-center justify-center text-sm text-outline">
            <MaterialIcon className="mr-1 text-base">verified_user</MaterialIcon>
            <span className="font-label-sm text-label-sm">Secure connection</span>
          </div>
        </div>
      </section>
  )
}
