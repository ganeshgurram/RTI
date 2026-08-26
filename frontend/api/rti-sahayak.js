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
  "- If payment is deducted but no registration number is generated, use Payment Reconciliation. Do not pay again; wait 24–48 working hours before using the help email.",
  "- A First Appeal is filed through Submit First Appeal using the original online application’s registration number and email ID. No fee is paid for a First Appeal. An online First Appeal is only for an RTI originally filed online.",
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
  "If the answer is not covered by the supplied knowledge, say that you cannot confirm it and direct the user to the official FAQs or support desk. Do not invent rules, deadlines, fees, links, or government contacts.",
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

function extractOutput(payload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text.trim()
  }

  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? "")
    .join("")
    .trim()
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    return response.status(405).json({ error: "Method not allowed" })
  }

  let body
  try {
    body = getBody(request)
  } catch {
    return response.status(400).json({ error: "Invalid request body" })
  }

  const message = safeMessage(body.message)
  if (!message) {
    return response.status(400).json({ error: "A message is required" })
  }

  if (containsSensitiveData(message)) {
    return response.status(400).json({
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
  const safetyIdentifier =
    typeof body.safetyIdentifier === "string" &&
    /^rti-sahayak-[a-f0-9-]{36}$/i.test(body.safetyIdentifier)
      ? body.safetyIdentifier
      : "rti-sahayak-anonymous"
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return response.status(503).json({ error: "RTI Sahayak is not configured" })
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: INSTRUCTIONS,
        input: [...history, { role: "user", content: message }],
        max_output_tokens: 320,
        reasoning: { effort: "low" },
        text: { verbosity: "low" },
        safety_identifier: safetyIdentifier,
        store: false,
      }),
    })

    if (!openAiResponse.ok) {
      return response.status(502).json({ error: "RTI Sahayak could not prepare an answer" })
    }

    const payload = await openAiResponse.json()
    const reply = extractOutput(payload)
    if (!reply) {
      return response.status(502).json({ error: "RTI Sahayak returned an empty answer" })
    }

    return response.status(200).json({ reply })
  } catch {
    return response.status(502).json({ error: "RTI Sahayak is temporarily unavailable" })
  }
}