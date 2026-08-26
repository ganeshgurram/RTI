const MAX_OUTPUT_TOKENS = 1000

const OPENROUTER_MODEL = "openai/gpt-5.6-luna"
/**
 * One retry only. A 429 from a burst clears in a second, but a 429 from an exhausted
 * quota does not - and retrying into that just spends more of the allowance.
 */
const MAX_RETRIES = 1
const BASE_RETRY_DELAY_MS = 600
/** Longer than this and we answer now rather than hold the request open. */
const RETRY_DELAY_CAP_MS = 2000

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

/** Milliseconds to wait before retrying, or null when we should not retry at all. */
function getRetryDelay(response, attempt) {
  const retryAfter = response.headers.get("retry-after")

  if (retryAfter) {
    const seconds = Number(retryAfter)
    const waitMs = Number.isFinite(seconds)
      ? seconds * 1000
      : Math.max(Date.parse(retryAfter) - Date.now(), 0)

    if (!Number.isFinite(waitMs)) {
      return BASE_RETRY_DELAY_MS
    }

    // OpenRouter asking for a long wait means a real cap, not a burst.
    return waitMs <= RETRY_DELAY_CAP_MS ? waitMs : null
  }

  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, RETRY_DELAY_CAP_MS)
}

const SENSITIVE_PATTERNS = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
  /\b(?:\d{4}[ -]?){3}\d{4}\b/,
  /\b(?:\d[ -]?){13,19}\b/,
  /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:password|passcode|otp|cvv|upi\s*pin|pin)\s*(?:is|:|=|-)?\s*[A-Z0-9@#$%^&*!]{4,}\b/i,
  /\b(?:registration|application|request)\s*(?:number|no\.?|#)\s*(?:is|:|=|-)?\s*[A-Z0-9-]{5,}\b/i,
  /\b(?:bank\s*account|account\s*number|ifsc)\s*(?:is|:|=|-)?\s*[A-Z0-9-]{5,}\b/i,
]

const RTI_KNOWLEDGE = [
  "Use only these RTI Online facts when answering:",
  "- This portal is for Central Government Ministries, Departments, and listed Central Public Authorities only. It does not accept State Public Authorities, including NCT of Delhi.",
  "- A user account is not mandatory to file an RTI request. The request form accepts 3,000 characters; a longer application can be attached as a PDF through the Supporting Document field.",
  "- Non-BPL applicants pay the prescribed fee through SBI internet banking, SBI debit card, Master/Visa credit or debit cards, or UPI. BPL applicants do not pay the RTI fee but attach their BPL certificate in the official form.",
  "- If payment is deducted but no registration number is generated, use Payment Reconciliation. Do not pay again; wait 24-48 working hours before using the help email.",
  "- A First Appeal is filed through Submit First Appeal using the original online application's registration number and email ID. No fee is paid for a First Appeal. An online First Appeal is only for an RTI originally filed online.",
  "- View Status displays the status or reply for an online RTI application or First Appeal. The secure journey protects personal information with OTP validation.",
  "- If a supporting document is requested, View Status shows the upload option. The helpline is only for problems using this Central Government RTI Online portal.",
].join("\n")

const INSTRUCTIONS = [
  "You are RTI Sahayak, an informational assistant in an RTI Online portal prototype.",
  "Answer only general, informational questions about using the portal. Keep answers concise, factual, neutral, and clear. Match the user's language when practical. You are not a lawyer and must not provide legal advice, make decisions, or claim to access a user's application, account, payment, status, or portal records.",
  "Privacy is mandatory:",
  "- Never ask for or accept a person's name, address, email, phone number, Aadhaar, PAN, bank/card/UPI details, OTP, password, registration/application/request number, or documents.",
  "- If the user gives or asks to give any sensitive or account-specific information, state that you cannot receive it and direct them to the relevant secure portal journey, such as View Status or Submit First Appeal.",
  "- Never request an upload, attachment, or payment information in chat.",
  "- Do not repeat sensitive information even if it appears in the input.",
  "When Public Authority candidates are provided, treat them as directory reference data only. They are ordered most relevant first and each lists the subject it covers. Explain in one line why a candidate fits the user's issue, list no more than three, and say that the applicant must confirm which authority holds the information. Do not claim the match is legally final.",
  "Name only the Public Authority candidates supplied to you. If none are supplied, do not guess an office or ministry - point the user to the Public Authorities directory to search for the subject instead.",
  "If the answer is not covered by the supplied knowledge, say that you cannot confirm it and direct the user to the official FAQs or Public Authorities directory. Do not invent rules, deadlines, fees, links, offices, or government contacts.",
  RTI_KNOWLEDGE,
].join("\n\n")

function containsSensitiveData(text) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text))
}

function getBody(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body)
  }

  return request.body ?? {}
}

function safeMessage(value) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, 700)
}

function safeDirectoryText(value, maxLength = 180) {
  if (typeof value !== "string") {
    return ""
  }

  return value
    .replace(/[^A-Za-z0-9&(),.'\-/\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}

function getAuthoritySuggestions(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .slice(0, 3)
    .map((item) => ({
      authorityName: safeDirectoryText(item?.authorityName),
      ministryName: safeDirectoryText(item?.ministryName),
      matchReason: safeDirectoryText(item?.matchReason, 120),
      relatedOffices: Array.isArray(item?.relatedOffices)
        ? item.relatedOffices.slice(0, 3).map((office) => safeDirectoryText(office, 140)).filter(Boolean)
        : [],
    }))
    .filter((item) => item.authorityName)
}

function buildAuthorityContext(suggestions) {
  if (!suggestions.length) {
    return ""
  }

  return [
    "Official directory candidates for the user's general issue, most relevant first:",
    ...suggestions.map((suggestion, index) => [
      (index + 1) + ". Public Authority: " + suggestion.authorityName,
      suggestion.ministryName ? "Ministry: " + suggestion.ministryName : "",
      suggestion.matchReason ? "Best matching ministry for the subject: " + suggestion.matchReason : "",
      suggestion.relatedOffices.length ? "Related offices: " + suggestion.relatedOffices.join("; ") : "",
    ].filter(Boolean).join("\n")),
  ].join("\n")
}

function extractOutput(payload) {
  const content = payload?.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return content.trim()
  }

  return (Array.isArray(content) ? content : [])
    .map((item) => item?.text ?? "")
    .join("")
    .trim()
}

function getUsage(usage) {
  const inputTokens = usage?.prompt_tokens ?? usage?.input_tokens
  const outputTokens = usage?.completion_tokens ?? usage?.output_tokens
  const totalTokens = usage?.total_tokens

  if (
    typeof inputTokens !== "number" ||
    typeof outputTokens !== "number" ||
    typeof totalTokens !== "number"
  ) {
    return undefined
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  }
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === "function") {
    return response.status(statusCode).json(payload)
  }

  response.statusCode = statusCode
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.end(JSON.stringify(payload))
  return undefined
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    return sendJson(response, 405, { error: "Method not allowed" })
  }

  let body
  try {
    body = getBody(request)
  } catch {
    return sendJson(response, 400, { error: "Invalid request body" })
  }

  const message = safeMessage(body.message)
  if (!message) {
    return sendJson(response, 400, { error: "A message is required" })
  }

  if (containsSensitiveData(message)) {
    return sendJson(response, 400, {
      error: "Sensitive information must not be submitted to RTI Sahayak.",
    })
  }

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-4)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          content: safeMessage(item?.content),
        }))
        .filter((item) => item.content && !containsSensitiveData(item.content))
    : []
  const authorityContext = buildAuthorityContext(getAuthoritySuggestions(body.authoritySuggestions))
  const safetyIdentifier =
    typeof body.safetyIdentifier === "string" &&
    /^rti-sahayak-[a-f0-9-]{36}$/i.test(body.safetyIdentifier)
      ? body.safetyIdentifier
      : "rti-sahayak-anonymous"
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY

  if (!apiKey) {
    return sendJson(response, 503, { error: "RTI Sahayak is not configured" })
  }

  const requestBody = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "system",
        content: authorityContext ? INSTRUCTIONS + "\n\n" + authorityContext : INSTRUCTIONS,
      },
      ...history,
      { role: "user", content: message },
    ],
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
    user: safetyIdentifier,
    // data_collection "deny" keeps the provider from training on these questions. Zero data
    // retention (zdr) is deliberately not requested: it restricts routing to a small pool of
    // certified endpoints that is saturated, which failed every request with a 429.
    provider: { data_collection: "deny" },
  })

  try {
    let openRouterResponse
    let payload
    let upstreamStatus
    let isRateLimited

    for (let attempt = 0; ; attempt += 1) {
      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: requestBody,
      })

      payload = await openRouterResponse.json().catch(() => undefined)
      const upstreamCode = payload?.error?.code
      upstreamStatus =
        typeof upstreamCode === "number" && upstreamCode >= 400 && upstreamCode < 600
          ? upstreamCode
          : openRouterResponse.status
      isRateLimited = upstreamStatus === 429 || upstreamCode === "rate_limit_exceeded"

      if (!isRateLimited || attempt >= MAX_RETRIES) {
        break
      }

      const delay = getRetryDelay(openRouterResponse, attempt)
      if (delay === null) {
        break
      }

      console.warn("[RTI Sahayak] Rate limited, retrying once", { delayMs: delay })
      await sleep(delay)
    }

    if (!openRouterResponse.ok || payload?.error) {
      console.warn("[RTI Sahayak] OpenRouter request failed", {
        status: upstreamStatus,
        // OpenRouter puts the reason here; type/requestId are often absent on 429.
        message: payload?.error?.message ?? "(no message returned)",
        retryAfter: openRouterResponse.headers.get("retry-after"),
        requestId: openRouterResponse.headers.get("x-request-id"),
      })

      if (isRateLimited) {
        console.warn(
          "[RTI Sahayak] Falling back to local guidance. These models are shared across " +
            "OpenRouter users, so this is usually upstream saturation rather than a credit " +
            "problem. Connecting your own provider key at " +
            "https://openrouter.ai/settings/integrations gives this app its own rate limit."
        )
      }

      return sendJson(response, isRateLimited ? 429 : 502, {
        error: isRateLimited
          ? "RTI Sahayak is busy. Please try again shortly."
          : "RTI Sahayak could not prepare an answer",
      })
    }
    const reply = extractOutput(payload)
    if (!reply) {
      return sendJson(response, 502, { error: "RTI Sahayak returned an empty answer" })
    }

    const usage = getUsage(payload.usage)
    if (usage) {
      // model is logged too, so a fallback to the sibling model is visible in the terminal.
      console.info("[RTI Sahayak] token usage", { model: payload.model ?? OPENROUTER_MODEL, ...usage })
    }

    return sendJson(response, 200, { reply, usage })
  } catch {
    return sendJson(response, 502, { error: "RTI Sahayak is temporarily unavailable" })
  }
}