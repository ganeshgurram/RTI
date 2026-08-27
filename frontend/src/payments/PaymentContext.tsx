import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  mockTransactions,
  type PaymentRequestDraft,
  type PaymentTransaction,
} from "@/data/mock-transactions"

type CreatePaymentAttemptInput = {
  draft: PaymentRequestDraft
  outcome: PaymentTransaction["outcome"]
}

type PaymentContextValue = {
  createPaymentAttempt: (input: CreatePaymentAttemptInput) => PaymentTransaction
  markPaymentConfirmed: (transactionId: string, registrationNumber: string) => void
  payments: PaymentTransaction[]
}

const paymentStorageKey = "rti-demo-payment-transactions"
const PaymentContext = createContext<PaymentContextValue | undefined>(undefined)

function getStoredPayments() {
  try {
    const stored = localStorage.getItem(paymentStorageKey)
    if (!stored) return mockTransactions

    const parsed = JSON.parse(stored) as PaymentTransaction[]
    return Array.isArray(parsed) ? parsed : mockTransactions
  } catch {
    return mockTransactions
  }
}

function formatAttemptedOn(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<PaymentTransaction[]>(getStoredPayments)

  useEffect(() => {
    localStorage.setItem(paymentStorageKey, JSON.stringify(payments))
  }, [payments])

  const value = useMemo<PaymentContextValue>(() => ({
    payments,
    createPaymentAttempt: ({ draft, outcome }) => {
      const now = new Date()
      const transaction: PaymentTransaction = {
        transactionId: `TXN_${String(now.getTime()).slice(-7)}`,
        applicantName: draft.applicantName,
        email: draft.applicantEmail,
        mobile: draft.applicantPhone.replace(/\D/g, "").slice(-10),
        amount: "₹ 10.00",
        method: "Mock payment gateway",
        attemptedOn: formatAttemptedOn(now),
        authority: draft.authority,
        purpose: "RTI application fee",
        outcome,
        refundReference: outcome === "refunded" ? `RRN-${String(now.getTime()).slice(-10)}` : undefined,
      }

      setPayments((current) => [transaction, ...current])
      return transaction
    },
    markPaymentConfirmed: (transactionId, registrationNumber) => {
      setPayments((current) => current.map((transaction) => (
        transaction.transactionId === transactionId
          ? { ...transaction, outcome: "confirmed", registrationNumber }
          : transaction
      )))
    },
  }), [payments])

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
}

export function usePayments() {
  const context = useContext(PaymentContext)

  if (!context) {
    throw new Error("usePayments must be used within PaymentProvider")
  }

  return context
}
