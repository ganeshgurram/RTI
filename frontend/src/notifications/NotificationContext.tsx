import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import { type MockNotification } from "@/data/mock-notifications"
import { api } from "@/services/api"

type NotificationContextValue = {
  notifications: MockNotification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

/**
 * The bell and the full inbox share one server-backed read state. This keeps a read action in
 * either view reflected in the other, and keeps alerts private to the signed-in applicant.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<MockNotification[]>([])

  useEffect(() => {
    let active = true

    if (!user) {
      setNotifications([])
      return () => { active = false }
    }

    void api.listNotifications()
      .then(({ notifications: records }) => {
        if (!active) return
        setNotifications(records.map((notification) => ({
          ...(notification as Omit<MockNotification, "applicantEmail">),
          applicantEmail: user.email,
        })))
      })
      .catch(() => {
        if (active) setNotifications([])
      })

    return () => { active = false }
  }, [user])

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    markAsRead: (notificationId) => {
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )))
      void api.markNotificationRead(notificationId).catch(() => {
        void api.listNotifications().then(({ notifications: records }) => {
          setNotifications(records.map((notification) => ({
            ...(notification as Omit<MockNotification, "applicantEmail">),
            applicantEmail: user?.email ?? "",
          })))
        })
      })
    },
    markAllAsRead: () => {
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
      void api.markAllNotificationsRead().catch(() => {
        void api.listNotifications().then(({ notifications: records }) => {
          setNotifications(records.map((notification) => ({
            ...(notification as Omit<MockNotification, "applicantEmail">),
            applicantEmail: user?.email ?? "",
          })))
        })
      })
    },
  }), [notifications, user?.email])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }

  return context
}
