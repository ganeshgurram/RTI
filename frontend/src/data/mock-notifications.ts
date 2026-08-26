export type NotificationFilter = "all" | "unread" | "read"

export type MockNotification = {
  id: string
  icon: string
  title: string
  description: string
  requestId: string
  time: string
  isRead: boolean
}

export const mockNotifications: MockNotification[] = [
  {
    id: "notification-1",
    icon: "pending_actions",
    title: "Request is being processed",
    description: "Your application for road maintenance records has been assigned to the concerned CPIO.",
    requestId: "RTI-2026-11842",
    time: "2 hours ago",
    isRead: false,
  },
  {
    id: "notification-2",
    icon: "mark_email_read",
    title: "A response is available",
    description: "The Public Works Division has uploaded a reply to your RTI request.",
    requestId: "RTI-2026-08604",
    time: "Yesterday",
    isRead: false,
  },
  {
    id: "notification-3",
    icon: "gavel",
    title: "First appeal action required",
    description: "Please review the appeal acknowledgement and keep the registration number for reference.",
    requestId: "RTI-2026-09751",
    time: "3 days ago",
    isRead: false,
  },
  {
    id: "notification-4",
    icon: "schedule",
    title: "Reply due date updated",
    description: "The response due date for your water quality inspection request has been updated.",
    requestId: "RTI-2026-07118",
    time: "8 days ago",
    isRead: true,
  },
  {
    id: "notification-5",
    icon: "task_alt",
    title: "Request closed",
    description: "Your scholarship disbursement request has been marked as satisfied and closed.",
    requestId: "RTI-2026-10319",
    time: "12 days ago",
    isRead: true,
  },
  {
    id: "notification-6",
    icon: "description",
    title: "Application acknowledgement generated",
    description: "Your RTI application has been registered successfully. You can download its acknowledgement anytime.",
    requestId: "RTI-2026-06642",
    time: "18 days ago",
    isRead: true,
  },
  {
    id: "notification-7",
    icon: "upload_file",
    title: "Additional document received",
    description: "The authority has added a supporting document to your request record.",
    requestId: "RTI-2026-05983",
    time: "24 days ago",
    isRead: true,
  },
  {
    id: "notification-8",
    icon: "account_balance",
    title: "Request forwarded to the concerned authority",
    description: "Your application was transferred to the authority responsible for the requested information.",
    requestId: "RTI-2025-19460",
    time: "1 month ago",
    isRead: true,
  },
  {
    id: "notification-9",
    icon: "info",
    title: "Status information updated",
    description: "A new status update is available for your school safety inspection request.",
    requestId: "RTI-2025-18622",
    time: "1 month ago",
    isRead: true,
  },
  {
    id: "notification-10",
    icon: "archive",
    title: "Request archived",
    description: "Your older application has been archived and remains available in request history.",
    requestId: "RTI-2025-16904",
    time: "2 months ago",
    isRead: true,
  },
]

export const unreadNotificationCount = mockNotifications.filter((notification) => !notification.isRead).length
