import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type NotificationFilter } from "@/data/mock-notifications"
import { useNotifications } from "@/notifications/NotificationContext"
import { MaterialIcon } from "@/routes/stitch-shell"

const filters: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
]

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const { markAllAsRead, markAsRead, notifications: notificationItems, unreadCount } = useNotifications()
  const notifications = useMemo(
    () => notificationItems.filter((notification) => filter === "all" || (filter === "unread" ? !notification.isRead : notification.isRead)),
    [filter, notificationItems],
  )

  const filterCount = (value: NotificationFilter) => value === "all"
    ? notificationItems.length
    : value === "unread"
      ? unreadCount
      : notificationItems.length - unreadCount

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <section aria-labelledby="notification-list-heading">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-headline-lg text-xl text-primary" id="notification-list-heading">All notifications</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Unread updates are highlighted until you view them.</p>
          </div>
        </div>
        {/* Mark all as read sits beside the filters but outside the group, so screen readers do
            not announce it as a fourth filter. */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div aria-label="Filter notifications" className="flex flex-wrap gap-2" role="group">
            {filters.map((item) => (
              <Button
                aria-pressed={filter === item.value}
                key={item.value}
                onClick={() => setFilter(item.value)}
                size="sm"
                type="button"
                variant={filter === item.value ? "default" : "outline"}
              >
                {item.label} ({filterCount(item.value)})
              </Button>
            ))}
          </div>
          <Button className={unreadCount ? "" : "invisible"} onClick={markAllAsRead} size="sm" type="button">
            <MaterialIcon>done_all</MaterialIcon>
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              className={`relative flex gap-4 rounded-xl border p-4 transition-colors sm:p-5 ${notification.isRead ? "border-outline-variant bg-surface-container-lowest" : "border-primary/30 bg-primary-fixed/35"}`}
              key={notification.id}
            >
              <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${notification.isRead ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-on-primary"}`}>
                <MaterialIcon className="text-xl">{notification.icon}</MaterialIcon>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-sm ${notification.isRead ? "font-medium text-on-surface" : "font-semibold text-primary"}`}>{notification.title}</h3>
                  {!notification.isRead ? <Badge className="border-primary/20 bg-primary text-on-primary" variant="outline">New</Badge> : <span className="text-xs text-on-surface-variant">Read</span>}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">{notification.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                  <span className="font-medium text-primary">{notification.requestId}</span>
                  <span aria-hidden="true">•</span>
                  <time>{notification.time}</time>
                </div>
              </div>
              {!notification.isRead ? (
                <div className="flex shrink-0 items-start gap-2">
                  <span aria-label="Unread notification" className="mt-2 size-2 rounded-full bg-primary" />
                  <Button className="hidden sm:inline-flex" onClick={() => markAsRead(notification.id)} size="sm" type="button">
                    Mark as read
                  </Button>
                  <Button aria-label={`Mark ${notification.title} as read`} className="sm:hidden" onClick={() => markAsRead(notification.id)} size="icon-sm" type="button">
                    <MaterialIcon>done</MaterialIcon>
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
