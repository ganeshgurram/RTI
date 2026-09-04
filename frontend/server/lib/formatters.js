const statusClasses = {
  Processing: "bg-primary-fixed text-primary border-primary/20",
  "Pending Verification": "bg-primary-fixed text-primary border-primary/20",
  "Reply received": "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/20",
  Satisfied: "bg-state-success/10 text-state-success border-state-success/20",
  "First Appeal": "bg-secondary text-secondary-foreground border-secondary/40",
  "First Appeal Filed": "border-tertiary/20 bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "Second Appeal": "bg-destructive/10 text-destructive border-destructive/20",
}

export function dateLabel(value) {
  const date = new Date(value)
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
  return `${day} ${month} ${date.getUTCFullYear()}`
}

export function dateTimeLabel(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export function cleanEmail(value) {
  return String(value ?? "").trim().toLowerCase()
}

export function normaliseMobile(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-10)
}

export function publicProfile(profile) {
  return { ...profile, account: { ...profile.account } }
}

export function requestView(request) {
  return {
    id: request.requestId,
    subject: request.subject,
    authority: request.authority,
    submittedOn: dateLabel(request.createdAt),
    lastUpdated: dateLabel(request.updatedAt),
    status: request.status,
    nextAction: request.nextAction,
    statusClass: statusClasses[request.status] ?? "bg-muted text-muted-foreground border-border",
    applicantEmail: request.applicant.email,
    applicantName: request.applicant.name,
    applicantPhone: request.applicant.phone,
    isBplApplicant: Boolean(request.isBplApplicant),
    supportingDocumentName: request.supportingDocumentName,
    requestText: request.requestText,
  }
}

export function paymentView(payment) {
  return {
    transactionId: payment.transactionId,
    applicantName: payment.applicantName,
    email: payment.email,
    mobile: payment.mobile,
    amount: payment.amount,
    method: payment.method,
    attemptedOn: dateTimeLabel(payment.createdAt),
    authority: payment.authority,
    purpose: payment.purpose,
    outcome: payment.outcome,
    registrationNumber: payment.registrationNumber,
    refundReference: payment.refundReference,
  }
}

export function notificationView(notification) {
  return {
    id: notification.notificationId,
    icon: notification.icon,
    title: notification.title,
    description: notification.description,
    requestId: notification.requestId,
    time: notification.createdAt ? dateTimeLabel(notification.createdAt) : "",
    isRead: Boolean(notification.isRead),
    action: notification.action,
  }
}
