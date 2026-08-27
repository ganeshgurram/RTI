/**
 * Generates public/rti-online-user-manual.pdf, the file the "User Manual" links serve.
 *
 *   npm run build:manual
 *
 * Writes the PDF byte-for-byte rather than pulling in a PDF library: the document is plain
 * text in the base-14 Helvetica faces, which every reader has built in, so there is nothing
 * to embed and no dependency to keep current. Re-run this after editing `sections` below.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outputPath = path.join(frontendDir, "public", "rti-online-user-manual.pdf")

const pageWidth = 595
const pageHeight = 842
const marginX = 56
const marginTop = 72
const marginBottom = 64

const title = "RTI Online - User Manual"

/** Blocks render in order. Text is wrapped; every other type controls spacing or weight. */
const sections = [
  { type: "title", text: "RTI Online" },
  { type: "subtitle", text: "User Manual" },
  { type: "meta", text: "Right to Information portal - citizen guide" },

  { type: "h1", text: "1. About this portal" },
  { type: "p", text: "RTI Online lets any citizen of India ask a public authority for information under the Right to Information Act, 2005, and follow that request through to a reply. You can file a request, pay the fee, track progress, escalate through appeals, and reconcile a payment that did not go through - all from this site." },
  { type: "p", text: "This manual walks through each of those tasks in the order you are likely to need them." },

  { type: "h1", text: "2. Do I need an account?" },
  { type: "p", text: "No. Filing a request does not require signing in. You can complete the whole form as a guest, and you will be given a registration number at the end." },
  { type: "p", text: "Signing in is still worth it. An account fills the applicant details in for you, keeps every request you have filed in one list under RTI Request History, and collects notifications as your requests progress. You can sign in with a username and password, or through DigiLocker." },

  { type: "h1", text: "3. Filing an RTI request" },
  { type: "steps", items: [
    "Choose RTI Request in the top navigation, or Submit a Request on the home page.",
    "Read the guidelines shown before the form opens, and accept them to continue.",
    "Pick the ministry or department your question belongs to. If you are not sure, open Public Authorities and search - the directory covers every listed authority and suggests the closest match.",
    "Fill in your details and write your question in the request text box.",
    "Enter the security code shown beside the box, then submit.",
  ] },
  { type: "p", text: "Keep your question specific and factual. A public authority is required to supply information it already holds; it is not required to create new analysis, offer opinions, or answer hypothetical questions." },

  { type: "h1", text: "4. Fees" },
  { type: "p", text: "The application fee is Rs 10 for a non-BPL applicant. If the authority supplies photocopied pages, an additional fee of about Rs 2 per page may be charged before the documents are released." },
  { type: "p", text: "Applicants below the poverty line pay no fee, but must attach a valid BPL certificate to the request. The form asks for this when you mark yourself as a BPL applicant." },
  { type: "p", text: "Payments can be made by SBI internet banking, SBI debit card, Master or Visa card, or UPI." },

  { type: "h1", text: "5. If a payment fails" },
  { type: "p", text: "Sometimes money leaves your account but no registration number appears. Do not pay again - the first attempt is usually still being settled by your bank, and paying twice creates two records to untangle." },
  { type: "steps", items: [
    "Open Payment Reconciliation from the top navigation.",
    "Enter the email address you filed with. Add the mobile number if you have it; leave it blank if you are unsure.",
    "Enter the security code and submit.",
    "On the next screen, choose Check Latest Status to ask the bank where the payment stands.",
  ] },
  { type: "p", text: "You will get one of three answers. Payment Confirmed means the fee arrived and a registration number has been generated - it is shown on the same screen. Refund Initiated means the payment failed and the amount returns to your account within five to seven working days; nothing was filed, so you can safely file again. Awaiting Bank Confirmation means the bank has not settled it yet; registration numbers are generated after the bank scroll is reconciled, which takes 24 to 48 working hours." },
  { type: "p", text: "If nothing has changed after 48 hours, contact the helpdesk with the transaction ID from that screen." },

  { type: "h1", text: "6. Tracking a request" },
  { type: "p", text: "Choose View Status and enter your registration number together with the email address used when filing. Signed-in users go straight to RTI Request History instead, which lists every request with its current status and the next action due." },
  { type: "p", text: "A public authority must normally respond within 30 days. If your request was sent to the wrong authority, it is transferred within 5 days and the 30-day clock runs from the transfer. Where the information concerns the life or liberty of a person, the reply is due within 48 hours." },

  { type: "h1", text: "7. First appeal" },
  { type: "p", text: "You may file a first appeal if you are dissatisfied with the reply, or if no reply arrived within the statutory period. File it within 30 days of receiving the reply, or of the date the reply was due." },
  { type: "steps", items: [
    "Choose First Appeal in the top navigation.",
    "Enter the registration number of the original request and the email address you filed it with.",
    "Your details and the authority are filled in from that request; add your grounds for appeal.",
    "Submit. You will receive a separate appeal registration number.",
  ] },
  { type: "p", text: "There is no fee for a first appeal. The First Appellate Authority should decide within 30 days, extendable to 45 days where reasons are recorded." },

  { type: "h1", text: "8. Second appeal and complaints" },
  { type: "p", text: "If the first appeal is decided against you, or is not decided at all, you may file a second appeal with the Central or State Information Commission within 90 days." },
  { type: "p", text: "Separately, a complaint may be made to the Commission under Section 18 - for example where an authority refused to receive your request, or no Public Information Officer was designated. A Section 18 complaint has no time limit." },

  { type: "h1", text: "9. Notifications" },
  { type: "p", text: "Signed-in users get a notification when a request changes state - a reply received, an appeal due, a deadline approaching. The bell in the top bar shows how many are unread. Open All Notifications to filter by read and unread, mark individual items as read, or clear the whole list at once." },

  { type: "h1", text: "10. RTI Sahayak" },
  { type: "p", text: "RTI Sahayak is the assistant in the lower-right corner. It can explain the process, help you word a request, and point you at the right public authority out of the full directory." },
  { type: "p", text: "Never type an OTP, Aadhaar number, card number, bank account number, PIN or password into the chat. Messages containing them are refused before they are sent. No genuine officer will ever ask you for those in a chat window." },

  { type: "h1", text: "11. Accessibility" },
  { type: "p", text: "The strip above the navigation bar controls text size. A+ enlarges the interface, A- reduces it, and A returns it to normal. Your choice is remembered on this device." },

  { type: "h1", text: "12. Getting help" },
  { type: "p", text: "Use Contact Us for the helpdesk form, or the FAQs page for the questions asked most often. When writing in about a specific request, always quote the registration number, or the transaction ID if the problem is a payment." },

  { type: "note", text: "This manual describes how to use the portal. It is not legal advice, and it does not replace the text of the Right to Information Act, 2005." },
]

// Approximate Helvetica advance widths, in ems. Good enough for wrapping body copy.
function charWidth(character) {
  if (character === " ") return 0.278
  if (".,;:!|iljI'`".includes(character)) return 0.28
  if ("ft()[]{}-/\\".includes(character)) return 0.35
  if ("mwMW".includes(character)) return 0.85
  if (character >= "A" && character <= "Z") return 0.7
  if (character >= "0" && character <= "9") return 0.556
  return 0.53
}

function textWidth(text, fontSize) {
  let total = 0
  for (const character of text) total += charWidth(character)
  return total * fontSize
}

function wrap(text, fontSize, maxWidth) {
  const lines = []
  let line = ""

  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word

    if (textWidth(candidate, fontSize) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)
  return lines
}

/** Parentheses and backslashes terminate a PDF string literal, so they must be escaped. */
function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

const styles = {
  title: { font: "F2", size: 30, leading: 36, before: 0, after: 4 },
  subtitle: { font: "F1", size: 18, leading: 24, before: 0, after: 6 },
  meta: { font: "F1", size: 10, leading: 14, before: 0, after: 30 },
  h1: { font: "F2", size: 14, leading: 19, before: 20, after: 8 },
  p: { font: "F1", size: 10.5, leading: 15.5, before: 0, after: 11 },
  step: { font: "F1", size: 10.5, leading: 15.5, before: 0, after: 6 },
  note: { font: "F1", size: 9.5, leading: 14, before: 22, after: 0 },
}

const contentWidth = pageWidth - marginX * 2
const pages = []
let current = []
let cursorY = pageHeight - marginTop

function newPage() {
  if (current.length) pages.push(current)
  current = []
  cursorY = pageHeight - marginTop
}

function draw(text, style, indent = 0) {
  const lines = wrap(text, style.size, contentWidth - indent)

  for (const line of lines) {
    if (cursorY - style.leading < marginBottom) newPage()
    current.push(`BT /${style.font} ${style.size} Tf 1 0 0 1 ${marginX + indent} ${cursorY.toFixed(2)} Tm (${escapePdfText(line)}) Tj ET`)
    cursorY -= style.leading
  }
}

for (const block of sections) {
  if (block.type === "steps") {
    for (const [index, item] of block.items.entries()) {
      const style = styles.step
      cursorY -= style.before

      if (cursorY - style.leading < marginBottom) newPage()
      current.push(`BT /F2 ${style.size} Tf 1 0 0 1 ${marginX} ${cursorY.toFixed(2)} Tm (${index + 1}.) Tj ET`)
      draw(item, style, 20)
      cursorY -= style.after
    }

    cursorY -= 6
    continue
  }

  const style = styles[block.type]
  cursorY -= style.before
  draw(block.text, style)
  cursorY -= style.after
}

newPage()

// --- assemble the file ----------------------------------------------------
const objects = []
const pageObjectIds = pages.map((_, index) => 5 + index * 2)

objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"
objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`
objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"

pages.forEach((lines, index) => {
  const pageId = pageObjectIds[index]
  const streamId = pageId + 1
  const stream = lines.join("\n")

  objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`
  objects[streamId] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
})

let pdf = "%PDF-1.4\n"
const offsets = []

for (let id = 1; id < objects.length; id += 1) {
  offsets[id] = Buffer.byteLength(pdf, "latin1")
  pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
}

const xrefOffset = Buffer.byteLength(pdf, "latin1")
pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`

for (let id = 1; id < objects.length; id += 1) {
  pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`
}

pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info << /Title (${escapePdfText(title)}) /Producer (RTI Online) >> >>\nstartxref\n${xrefOffset}\n%%EOF\n`

mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(outputPath, Buffer.from(pdf, "latin1"))

console.log(`Wrote ${path.relative(frontendDir, outputPath)} - ${pages.length} pages, ${Buffer.byteLength(pdf, "latin1")} bytes`)
