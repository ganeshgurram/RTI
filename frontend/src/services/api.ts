const legacyTokenStorageKey = "rti-api-token"

type ApiErrorPayload = { error?: string }

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code = "serverError") {
    super(code)
    this.status = status
    this.code = code
  }
}

/** Removes tokens saved by the pre-cookie implementation. */
export function clearLegacyApiToken() {
  try {
    localStorage.removeItem(legacyTokenStorageKey)
  } catch {
    // Storage may be unavailable; the server cookie remains the source of truth.
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  const response = await fetch(path, { ...init, credentials: "include", headers })
  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({})) as T & ApiErrorPayload
  if (!response.ok) throw new ApiError(response.status, payload.error)
  return payload
}

export const api = {
  health: () => request<{ status: string; database: string }>("/api/health"),
  login: (username: string, password: string) => request<{ profile: unknown }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  signup: (details: Record<string, string>) => request<{ profile: unknown }>("/api/auth/signup", { method: "POST", body: JSON.stringify(details) }),
  digiLockerPreview: () => request<{ profile: unknown }>("/api/auth/digilocker/preview"),
  digiLockerLogin: () => request<{ profile: unknown }>("/api/auth/digilocker", { method: "POST" }),
  me: () => request<{ profile: unknown }>("/api/auth/me"),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  updateProfile: (profile: unknown) => request<{ profile: unknown }>("/api/profile", { method: "PUT", body: JSON.stringify({ profile }) }),
  listRequests: () => request<{ requests: unknown[] }>("/api/requests"),
  createRequest: (input: unknown) => request<{ request: unknown }>("/api/requests", { method: "POST", body: JSON.stringify(input) }),
  lookupRequest: (requestId: string, email: string) => request<{ request: unknown }>(`/api/public/requests/${encodeURIComponent(requestId)}?email=${encodeURIComponent(email)}`),
  createAppeal: (requestId: string, input: unknown) => request<{ appeal: unknown }>(`/api/requests/${encodeURIComponent(requestId)}/appeals`, { method: "POST", body: JSON.stringify(input) }),
  listPayments: () => request<{ payments: unknown[] }>("/api/payments"),
  createPayment: (draft: unknown, outcome: string) => request<{ payment: unknown }>("/api/payments", { method: "POST", body: JSON.stringify({ draft, outcome }) }),
  confirmPayment: (transactionId: string, registrationNumber: string) => request<{ payment: unknown }>(`/api/payments/${encodeURIComponent(transactionId)}/confirm`, { method: "PATCH", body: JSON.stringify({ registrationNumber }) }),
  reconcilePayment: (email: string, mobile: string) => request<{ payment: unknown }>(`/api/payments/reconcile?email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}`),
  listNotifications: () => request<{ notifications: unknown[] }>("/api/notifications"),
  markNotificationRead: (notificationId: string) => request<void>(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request<void>("/api/notifications/read-all", { method: "PATCH" }),
}
