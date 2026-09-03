import { createContext, useContext } from "react"

/** The office an applicant picked in the directory, carried through to the request form. */
export type RequestAuthority = {
  name: string
  ministryName?: string
}

type RequestGuidelinesContextValue = {
  openRequestGuidelines: (options?: { cancelTo?: number | string; authority?: RequestAuthority; journey?: "request" | "firstAppeal" }) => void
}

export const RequestGuidelinesContext = createContext<RequestGuidelinesContextValue | null>(null)

export function useRequestGuidelines() {
  const context = useContext(RequestGuidelinesContext)

  if (!context) {
    throw new Error("useRequestGuidelines must be used within RequestGuidelinesDialogProvider")
  }

  return context
}
