import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import { mockNotifications, type MockNotification } from "@/data/mock-notifications"

type NotificationContextValue = {
  notifications: MockNotification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
}

/** Bumped when the seed data changed shape - a stale inbox has no applicantEmail to filter on. */
const notificationStorageKey = "rti-demo-notifications-v2"
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

function getStoredNotifications() {
  try {
    const stored = localStorage.getItem(notificationStorageKey)
    if (!stored) return mockNotifications

    const parsed = JSON.parse(stored) as MockNotification[]
    return Array.isArray(parsed) ? parsed : mockNotifications
  } catch {
    return mockNotifications
  }
}

/**
 * The read state lives here rather than in each screen. The top-nav bell and the notifications
 * page are two views of one inbox, so marking something read in either has to move the badge in
 * the other - they previously kept separate copies and silently disagreed.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<MockNotification[]>(getStoredNotifications)
  const { user } = useAuth()

  useEffect(() => {
    localStorage.setItem(notificationStorageKey, JSON.stringify(notifications))
  }, [notifications])

  /**
   * Both demo accounts keep their inbox in the same store, so only the signed-in one is shown.
   * Otherwise the DigiLocker applicant sees alerts about requests that are not hers.
   */
  const visible = useMemo(() => {
    if (!user) return []

    const accountEmail = user.email.trim().toLowerCase()
    return notifications.filter((notification) => notification.applicantEmail.trim().toLowerCase() === accountEmail)
  }, [notifications, user])

  const value = useMemo<NotificationContextValue>(() => ({
    notifications: visible,
    unreadCount: visible.filter((notification) => !notification.isRead).length,
    markAsRead: (notificationId) => {
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )))
    },
    markAllAsRead: () => {
      // Only this account's, or signing in as one user would silently clear the other's badge.
      const ownIds = new Set(visible.map((notification) => notification.id))
      setNotifications((current) => current.map((notification) => (
        ownIds.has(notification.id) ? { ...notification, isRead: true } : notification
      )))
    },
  }), [visible])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }

  return context
}
