/**
 * Payment attempts that did not produce a registration number instantly. These back the Payment
 * Reconciliation flow: an applicant enters the email (and optionally the mobile) they filed with,
 * and gets the bank's view of what happened to their money.
 */
export type PaymentTransaction = {
  transactionId: string
  applicantName: string
  email: string
  /** Ten digits, matching what the reconciliation form accepts. */
  mobile: string
  amount: string
  method: string
  attemptedOn: string
  authority: string
  purpose: string
  /** What the bank reports once the applicant asks for the latest status. */
  outcome: "confirmed" | "refunded" | "awaitingBank"
  /** Present when outcome is "confirmed" - the number that failed to generate at payment time. */
  registrationNumber?: string
  /** Present when outcome is "refunded" - the bank's retrieval reference for the reversal. */
  refundReference?: string
}

export const mockTransactions: PaymentTransaction[] = [
  {
    transactionId: "TXN_9823410",
    applicantName: "Rajesh Kumar",
    email: "rajesh.kumar@example.in",
    mobile: "9876543210",
    amount: "₹ 10.00",
    method: "SBI Net Banking",
    attemptedOn: "26 Aug 2026, 11:30 AM",
    authority: "Municipal Public Works Division",
    purpose: "RTI application fee",
    outcome: "confirmed",
    registrationNumber: "RTI-2026-12057",
  },
  {
    transactionId: "TXN_9820165",
    applicantName: "Ananya Nair",
    email: "ananya.nair@example.in",
    mobile: "9847011223",
    amount: "₹ 10.00",
    method: "UPI",
    attemptedOn: "25 Aug 2026, 06:12 PM",
    authority: "Department of Higher Education",
    purpose: "RTI application fee",
    outcome: "refunded",
    refundReference: "RRN-4471902238",
  },
  {
    transactionId: "TXN_9831774",
    applicantName: "Meera Iyer",
    email: "meera.iyer@example.in",
    mobile: "9845567120",
    amount: "₹ 10.00",
    method: "SBI Debit Card",
    attemptedOn: "27 Aug 2026, 09:48 AM",
    authority: "Central Ground Water Board",
    purpose: "RTI application fee",
    outcome: "awaitingBank",
  },
  {
    transactionId: "TXN_9815302",
    applicantName: "Farhan Qureshi",
    email: "farhan.qureshi@example.in",
    mobile: "9930014782",
    amount: "₹ 46.00",
    method: "Master / Visa Card",
    attemptedOn: "24 Aug 2026, 03:05 PM",
    authority: "Health Services Directorate",
    purpose: "Additional fee for 23 pages",
    outcome: "confirmed",
    registrationNumber: "RTI-2026-11996",
  },
]

/** Normalises "+91 98765 43210", "098765-43210" and "9876543210" to the last ten digits. */
export function normaliseMobile(value: string) {
  return value.replace(/\D/g, "").slice(-10)
}

export function findTransaction(email: string, mobile: string) {
  const normalisedEmail = email.trim().toLowerCase()
  const normalisedMobile = normaliseMobile(mobile)
  const byEmail = mockTransactions.find((transaction) => transaction.email === normalisedEmail)

  if (!byEmail) return { transaction: null, mobileMismatch: false }

  // A blank mobile is allowed - the field is optional on the form.
  if (normalisedMobile && normalisedMobile !== byEmail.mobile) {
    return { transaction: null, mobileMismatch: true }
  }

  return { transaction: byEmail, mobileMismatch: false }
}
