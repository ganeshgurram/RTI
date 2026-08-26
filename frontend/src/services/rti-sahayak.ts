export type ChatRole = "assistant" | "user"

export type ChatHistoryMessage = {
  role: ChatRole
  content: string
}

export type RtiSahayakReply = {
  reply: string
  source: "gpt-5.6-luna" | "local"
}

const sensitivePatterns = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
  /\b(?:\d{4}[ -]?){3}\d{4}\b/,
  /\b(?:\d[ -]?){13,19}\b/,
  /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:password|passcode|otp|cvv|upi\s*pin|pin)\s*(?:is|:|=|-)?\s*[A-Z0-9@#$%^&*!]{4,}\b/i,
  /\b(?:registration|application|request)\s*(?:number|no\.?|#)\s*(?:is|:|=|-)?\s*[A-Z0-9-]{5,}\b/i,
  /\b(?:bank\s*account|account\s*number|ifsc)\s*(?:is|:|=|-)?\s*[A-Z0-9-]{5,}\b/i,
]

export function containsSensitiveData(text: string) {
  return sensitivePatterns.some((pattern) => pattern.test(text))
}

function getLocalReply(message: string): string {
  const query = message.toLowerCase()

  if (/(first appeal|1st appeal)/.test(query)) {
    return "To file a First Appeal, choose “Submit First Appeal” and enter the registration number and email ID used for the original online RTI application. No fee is required for a First Appeal. Please use the secure appeal form for those details—do not share them here."
  }

  if (/(second appeal|2nd appeal)/.test(query)) {
    return "A Second Appeal is for cases where you are dissatisfied with the First Appellate Authority’s decision. RTI Sahayak can explain the process, but please use the official appeal form for case-specific details."
  }

  if (/(fee|payment|upi|debit|credit|bpl|money|deducted)/.test(query)) {
    return "A non-BPL applicant pays the prescribed RTI fee after completing the request form. The portal supports SBI internet banking, SBI debit card, Master/Visa cards, and UPI. BPL applicants do not pay the RTI fee, but must attach the required BPL certificate in the official form. If money was deducted but no registration number was generated, use Payment Reconciliation and wait 24–48 working hours before escalating."
  }

  if (/(status|track|reply|registration)/.test(query)) {
    return "You can view the status or reply for an online RTI application or First Appeal from View Status. For privacy, use the secure status journey rather than sending a registration number, email address, or OTP in this chat."
  }

  if (/(state|central|public authority|ministry|department)/.test(query)) {
    return "This RTI Online portal is for Central Government Ministries, Departments, and listed Central Public Authorities. Requests to State Public Authorities, including NCT of Delhi, should not be filed through this portal."
  }

  if (/(file|submit|request|apply)/.test(query)) {
    return "You can file an RTI request directly from Submit Request; creating an account is not mandatory. Enter the request text in the form (up to 3,000 characters) and upload a supporting PDF through the official form if it is longer."
  }

  if (/(document|upload|attachment|supporting)/.test(query)) {
    return "If a Public Authority asks for supporting documents, open View Status through the secure portal. The application status will show the option to upload the requested document. Please do not upload or paste documents in chat."
  }

  return "I can help with RTI filing, fees, First or Second Appeals, Public Authorities, and using View Status. Please ask a general question and do not share any personal details, registration numbers, OTPs, payment details, or documents."
}

export async function askRtiSahayak({
  message,
  history,
  safetyIdentifier,
}: {
  message: string
  history: ChatHistoryMessage[]
  safetyIdentifier: string
}): Promise<RtiSahayakReply> {
  if (containsSensitiveData(message)) {
    return {
      reply:
        "For your privacy, I have not sent that message. Please do not share personal details, registration numbers, OTPs, payment details, passwords, or documents here. Use the secure portal journey for account- or application-specific help.",
      source: "local",
    }
  }

  try {
    const response = await fetch("/api/rti-sahayak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, safetyIdentifier }),
    })

    if (!response.ok) {
      throw new Error("RTI Sahayak service is unavailable")
    }

    const data = (await response.json()) as { reply?: unknown }
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("RTI Sahayak returned an empty response")
    }

    return { reply: data.reply.trim(), source: "gpt-5.6-luna" }
  } catch {
    return { reply: getLocalReply(message), source: "local" }
  }
}