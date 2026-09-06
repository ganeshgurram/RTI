export type RtiDraftType = "request" | "first-appeal"
export type RtiDraftLanguage = "en" | "hi" | "te" | "kn"

type RewriteDraftOptions = {
  draft: string
  language: RtiDraftLanguage
  maxLength: number
  safetyIdentifier: string
  type: RtiDraftType
}

function cleanDraft(draft: string) {
  return draft
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * A drafting fallback keeps the form useful in local development and whenever the hosted AI
 * service is unavailable. It intentionally preserves the applicant's words instead of guessing
 * at facts that are not in their draft.
 */
function getLocalRewrite({ draft, language, maxLength, type }: RewriteDraftOptions) {
  const cleaned = cleanDraft(draft).slice(0, maxLength)
  const isHindi = language === "hi"
  const opening = type === "request"
    ? (isHindi
        ? "सूचना का अधिकार अधिनियम, 2005 के अंतर्गत कृपया निम्नलिखित जानकारी उपलब्ध कराएं:"
        : "Kindly provide the following information under the Right to Information Act, 2005:")
    : (isHindi
        ? "मैं अपने मूल आरटीआई अनुरोध के संबंध में सूचना का अधिकार अधिनियम, 2005 के अंतर्गत यह प्रथम अपील प्रस्तुत करता/करती हूँ:"
        : "I respectfully submit this First Appeal under the Right to Information Act, 2005 regarding my original RTI request:")
  const closing = type === "request"
    ? (isHindi
        ? "कृपया उपलब्ध सूचना इलेक्ट्रॉनिक रूप में प्रदान करें।"
        : "Please provide the available information in electronic form.")
    : (isHindi
        ? "कृपया मामले पर विचार कर उचित आदेश जारी करें।"
        : "Please consider the matter and issue an appropriate order.")
  const rewritten = `${opening}\n\n${cleaned}\n\n${closing}`

  // Never cut the applicant's content merely to add a template around it.
  return rewritten.length <= maxLength ? rewritten : cleaned
}

export async function rewriteRtiDraft(options: RewriteDraftOptions) {
  const draft = cleanDraft(options.draft)

  if (!draft) {
    throw new Error("A draft is required")
  }

  try {
    const response = await fetch("/api/rti-sahayak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "rewrite",
        draft,
        type: options.type,
        language: options.language,
        maxLength: options.maxLength,
        safetyIdentifier: options.safetyIdentifier,
      }),
    })

    if (!response.ok) {
      throw new Error("RTI Sahayak rewrite service is unavailable")
    }

    const data = await response.json() as { rewrite?: unknown }
    if (typeof data.rewrite !== "string" || !data.rewrite.trim()) {
      throw new Error("RTI Sahayak returned an empty rewrite")
    }

    return cleanDraft(data.rewrite).slice(0, options.maxLength)
  } catch {
    return getLocalRewrite({ ...options, draft })
  }
}
