import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import { mockTransactions, type PaymentRequestDraft, type PaymentTransaction } from "@/data/mock-transactions"
import { api } from "@/services/api"

type CreatePaymentAttemptInput = { draft: PaymentRequestDraft; outcome: PaymentTransaction["outcome"] }

type PaymentContextValue = {
  createPaymentAttempt: (input: CreatePaymentAttemptInput) => Promise<PaymentTransaction>
  markPaymentConfirmed: (transactionId: string, registrationNumber: string) => Promise<void>
  reconcilePayment: (email: string, mobile: string) => Promise<PaymentTransaction>
  payments: PaymentTransaction[]
}

const PaymentContext = createContext<PaymentContextValue | undefined>(undefined)

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [serverPayments, setServerPayments] = useState<PaymentTransaction[]>([])

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      setServerPayments([])
      return
    }

    void api.listPayments().then(({ payments }) => {
      if (!cancelled) setServerPayments(payments as PaymentTransaction[])
    }).catch(() => {
      if (!cancelled) setServerPayments([])
    })

    return () => { cancelled = true }
  }, [isAuthenticated])

  const payments = isAuthenticated ? serverPayments : mockTransactions

  const value = useMemo<PaymentContextValue>(() => ({
    payments,
    createPaymentAttempt: async ({ draft, outcome }) => {
      const { payment } = await api.createPayment(draft, outcome)
      const created = payment as PaymentTransaction
      setServerPayments((current) => [created, ...current])
      return created
    },
    markPaymentConfirmed: async (transactionId, registrationNumber) => {
      const { payment } = await api.confirmPayment(transactionId, registrationNumber)
      const confirmed = payment as PaymentTransaction
      setServerPayments((current) => current.map((item) => item.transactionId === transactionId ? confirmed : item))
    },
    reconcilePayment: async (email, mobile) => {
      const { payment } = await api.reconcilePayment(email, mobile)
      return payment as PaymentTransaction
    },
  }), [payments])

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
}

export function usePayments() {
  const context = useContext(PaymentContext)
  if (!context) throw new Error("usePayments must be used within PaymentProvider")
  return context
}
