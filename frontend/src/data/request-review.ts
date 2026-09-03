import type { PaymentRequestDraft } from "@/data/mock-transactions"

/**
 * The complete in-memory application passed from the RTI form to its review step. It deliberately
 * extends the payment draft: payment and request creation need only the small base shape, while
 * review needs enough context to let an applicant confirm or edit every meaningful section.
 */
export type RequestReviewDraft = PaymentRequestDraft & {
  ministry: string
  isBplApplicant: boolean
  citizenship: string
  applicant: {
    gender: string
    addressLine1: string
    addressLine2: string
    addressLine3: string
    pincode: string
    country: string
    state: string
    areaType: string
    educationalStatus: string
  }
  bpl?: {
    cardNumber: string
    issueYear: string
    issuingAuthority: string
    supportingDocumentName: string
  }
}

export type RequestFormFocusSection = "authority" | "personal" | "request"

export type RequestReviewLocationState = {
  draft?: RequestReviewDraft
}
