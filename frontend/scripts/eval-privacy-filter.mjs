/**
 * Evaluates the RTI Sahayak privacy filter, which refuses a message before it reaches the model.
 *
 *   npm run eval:privacy
 *
 * Two failure modes matter equally, so both are tested. Letting a secret through defeats the
 * filter; refusing an ordinary question is worse than useless, because the user is shown a
 * warning about OTPs and payment details for asking where to find their registration number.
 *
 * The patterns are duplicated in the handler and in the browser service so a message is checked
 * before it leaves the page and again before it leaves the server. This file also asserts the
 * two copies are identical, since a fix applied to one of them silently protects nothing.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { containsSensitiveData } from "../api/rti-sahayak.js"

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** The pattern list of one file, as source text, so the two copies can be compared. */
function readPatterns(file, declaration) {
  const source = readFileSync(path.join(frontendDir, file), "utf8")
  const start = source.indexOf(declaration)

  if (start < 0) {
    throw new Error(`${file} no longer declares ${declaration}`)
  }

  const body = source.slice(start + declaration.length)
  const end = body.indexOf("\n]")

  if (end < 0) {
    throw new Error(`${file}: could not find the end of ${declaration}`)
  }

  return body.slice(0, end).trim()
}

/** Ordinary questions. Every one of these must reach the model. */
const allowed = [
  "How do I get my registration number again?",
  "Where can I find my registration number online?",
  "What is the request number format?",
  "Is the registration number sent by email or SMS?",
  "My application number was never generated, what should I do?",
  "How long does an application number take?",
  "What is my PIN code supposed to be?",
  "Do I need to enter a pin code in the form?",
  "My bank account details are wrong, who do I contact?",
  "What is the account number format for the fee?",
  "I forgot my password, how do I reset it?",
  "My password is wrong every time I try.",
  "My password is incorrect on the login page.",
  "My password isn't working.",
  "The file is password-protected, can I still upload it?",
  "Where is the OTP sent from?",
  "Why is the OTP feature used in view status?",
  "What is the RTI fee?",
  "How do I file a First Appeal?",
  "Which department handles a passport issue?",
  "How can I check my status?",
  "Can I pay by UPI?",
  "My LPG cylinder subsidy has stopped",
  "The ration shop is not giving us wheat",
  "How many days does a reply take under section 7?",
  "Can I file for a state public authority in 2026?",
  "I filed 3 requests in 2025 and 2 in 2026, is that a problem?",
  "Section 6(3) transfer took 30 days, what now?",
]

/** Values that must never be sent upstream. */
const refused = [
  "my registration number is DOPT/R/E/21/00001",
  "registration no. RTI-2026-11842 please check",
  "request number: ICAOI/R/E/21/100001",
  "my application number is ABC12345",
  "my aadhaar is 4321 8765 2109",
  "aadhaar 432187652109",
  "my PAN is ABCDE1234F",
  "my card is 4111 1111 1111 1111",
  "call me on 9599645628",
  "reach me at +91 98765 43210",
  "my mobile is 98765 43210",
  "contact 91-9599645628",
  "my email is rajesh.kumar@example.in",
  "my password is rti@2026",
  "password: Delhi@123",
  "the otp is 483920",
  "otp 4839",
  "my UPI PIN is 1234",
  "my atm pin is 4321",
  "cvv 356",
  "cvv is 356",
  "my bank account is 123456789012",
  "IFSC SBIN0001234",
]

const failures = []

const handlerPatterns = readPatterns("api/rti-sahayak.js", "const SENSITIVE_PATTERNS = [")
const servicePatterns = readPatterns("src/services/rti-sahayak.ts", "const sensitivePatterns = [")

if (handlerPatterns !== servicePatterns) {
  failures.push("api/rti-sahayak.js and src/services/rti-sahayak.ts carry different patterns")
}

for (const message of allowed) {
  if (containsSensitiveData(message)) {
    failures.push(`refused an ordinary question: "${message}"`)
  }
}

for (const message of refused) {
  if (!containsSensitiveData(message)) {
    failures.push(`let sensitive data through: "${message}"`)
  }
}

const total = allowed.length + refused.length + 1
console.log(`\n${total - failures.length}/${total} passed\n`)

for (const failure of failures) {
  console.log(`  ${failure}`)
}

if (failures.length) {
  console.log("")
}

process.exit(failures.length ? 1 : 0)
