import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { usePortalLanguage, type PortalLanguage } from "@/i18n"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesContext"
import type { AuthoritySuggestion } from "@/services/authority-recommendations"
import {
  askRtiSahayak,
  containsSensitiveData,
  translateChatMessages,
  type ChatRole,
  type LocalizedText,
} from "@/services/rti-sahayak"

type ChatMessage = {
  id: string
  role: ChatRole
  /**
   * The message in every language it is known in. Switching the portal language keeps the
   * conversation and shows the other side of this, translating it first where it is missing.
   */
  text: LocalizedText
  /** What the message was originally written in - the fallback when a translation is missing. */
  sourceLanguage: PortalLanguage
  authoritySuggestions?: AuthoritySuggestion[]
  source?: "gpt-5.6-luna" | "local"
}

type ChatCopy = {
  name: string
  welcome: string
  subtitle: string
  privacyWarning: string
  privacyNotice: string
  authorityTitle: string
  backToTop: string
  relatedOffices: string
  confirmAuthority: string
  fileRti: string
  preparing: string
  askLabel: string
  placeholder: string
  sendMessage: string
  browseFaqs: string
  clearChat: string
  closeChat: string
  openChat: string
  translating: string
  translationFailed: string
  suggestions: string[]
}

const chatCopy: Record<PortalLanguage, ChatCopy> = {
  en: {
    name: "RTI Sahayak",
    welcome:
      "Namaste! I am RTI Sahayak. I can answer general questions about filing an RTI, fees, appeals, Public Authorities, and using View Status.",
    subtitle: "General RTI guidance - no personal data",
    privacyWarning: "Never share contact details, IDs, application numbers, OTPs, passwords, payment details, or documents.",
    privacyNotice:
      "That message was not sent. For your privacy, do not share names, contact details, Aadhaar/PAN, registration numbers, OTPs, passwords, payment details, or documents.",
    authorityTitle: "Possible filing targets",
    backToTop: "Back to top",
    relatedOffices: "Related offices",
    confirmAuthority: "Confirm in Public Authorities",
    fileRti: "File RTI",
    preparing: "RTI Sahayak is preparing an answer...",
    askLabel: "Ask RTI Sahayak",
    placeholder: "Describe the issue in general terms...",
    sendMessage: "Send message",
    browseFaqs: "Browse official FAQs",
    clearChat: "Clear chat",
    closeChat: "Close RTI Sahayak",
    openChat: "Open RTI Sahayak",
    translating: "Translating this conversation into English...",
    translationFailed: "Some earlier messages could not be translated, and are shown as they were written.",
    suggestions: [
      "Which department handles a passport issue?",
      "What is the RTI fee?",
      "How do I file a First Appeal?",
      "How can I check my status?",
    ],
  },
  hi: {
    name: "आरटीआई सहायक",
    welcome:
      "नमस्ते! मैं आरटीआई सहायक हूँ। मैं आरटीआई आवेदन, शुल्क, अपील, लोक प्राधिकरण और स्थिति देखने से जुड़े सामान्य प्रश्नों में आपकी सहायता कर सकता हूँ।",
    subtitle: "सामान्य आरटीआई मार्गदर्शन - कोई व्यक्तिगत जानकारी नहीं",
    privacyWarning: "संपर्क विवरण, पहचान पत्र, आवेदन संख्या, ओटीपी, पासवर्ड, भुगतान विवरण या दस्तावेज़ कभी साझा न करें।",
    privacyNotice:
      "वह संदेश भेजा नहीं गया। आपकी गोपनीयता के लिए नाम, संपर्क विवरण, आधार/पैन, पंजीकरण संख्या, ओटीपी, पासवर्ड, भुगतान विवरण या दस्तावेज़ साझा न करें।",
    authorityTitle: "संभावित दाखिला प्राधिकरण",
    backToTop: "ऊपर जाएँ",
    relatedOffices: "संबंधित कार्यालय",
    confirmAuthority: "लोक प्राधिकरणों में पुष्टि करें",
    fileRti: "आरटीआई दायर करें",
    preparing: "आरटीआई सहायक उत्तर तैयार कर रहा है...",
    askLabel: "आरटीआई सहायक से पूछें",
    placeholder: "समस्या को सामान्य शब्दों में लिखें...",
    sendMessage: "संदेश भेजें",
    browseFaqs: "आधिकारिक सामान्य प्रश्न देखें",
    clearChat: "चैट साफ़ करें",
    closeChat: "आरटीआई सहायक बंद करें",
    openChat: "आरटीआई सहायक खोलें",
    translating: "इस बातचीत का हिन्दी में अनुवाद हो रहा है...",
    translationFailed: "कुछ पुराने संदेशों का अनुवाद नहीं हो सका, वे मूल रूप में दिखाए जा रहे हैं।",
    suggestions: [
      "पासपोर्ट संबंधी समस्या के लिए कौन-सा विभाग जिम्मेदार है?",
      "आरटीआई शुल्क कितना है?",
      "मैं प्रथम अपील कैसे दर्ज करूँ?",
      "मैं अपनी स्थिति कैसे देख सकता हूँ?",
    ],
  },
}

function createWelcomeMessage(language: PortalLanguage): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    // Portal copy, so both languages are already written and no translation is ever needed.
    text: { en: chatCopy.en.welcome, hi: chatCopy.hi.welcome },
    sourceLanguage: language,
    source: "local",
  }
}

function localize(language: PortalLanguage, text: string): LocalizedText {
  return language === "hi" ? { hi: text } : { en: text }
}

function getMessageText(message: ChatMessage, language: PortalLanguage) {
  return message.text[language] ?? message.text[message.sourceLanguage] ?? ""
}

function getTranslationKey(message: ChatMessage, language: PortalLanguage) {
  return message.id + ":" + language
}

function needsTranslation(
  message: ChatMessage,
  language: PortalLanguage,
  failedTranslations: ReadonlySet<string>
) {
  return (
    message.text[language] === undefined && !failedTranslations.has(getTranslationKey(message, language))
  )
}

/**
 * Tailwind's sm breakpoint. Below it the panel already takes the full screen width, so the
 * launcher drops its label for a circle rather than a pill wide enough to hold "आरटीआई सहायक".
 */
const COMPACT_LAUNCHER_QUERY = "(max-width: 639.98px)"

// Subscribed to rather than stored in state: the width can change between the first render and
// an effect running, and a media query is exactly the external source useSyncExternalStore is for.
function subscribeToCompactLauncher(onChange: () => void) {
  const query = window.matchMedia(COMPACT_LAUNCHER_QUERY)
  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

function getIsCompactLauncher() {
  return window.matchMedia(COMPACT_LAUNCHER_QUERY).matches
}

function createMessageId() {
  return crypto.randomUUID()
}

function createSafetyIdentifier() {
  return "rti-sahayak-" + crypto.randomUUID()
}

/**
 * The model answers in Markdown, so a reply rendered as plain text shows its own asterisks.
 * This turns the little of it that actually appears - bold, bullets, numbered steps, stray
 * heading marks - into elements. Built as React nodes rather than injected HTML, so a reply
 * can never smuggle markup into the page.
 */
function renderInline(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*|__(.+?)__/g
  let lastIndex = 0
  let match = pattern.exec(text)

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <strong className="font-semibold" key={`${keyPrefix}-${match.index}`}>
        {match[1] ?? match[2]}
      </strong>
    )
    lastIndex = match.index + match[0].length
    match = pattern.exec(text)
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length ? nodes : [text]
}

function FormattedMessage({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listIsOrdered = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(" ")
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text, `p${blocks.length}`)}</p>)
    paragraph = []
  }

  const flushList = () => {
    if (!listItems.length) return
    const items = listItems.map((item, index) => (
      <li key={`li-${index}`}>{renderInline(item, `l${blocks.length}-${index}`)}</li>
    ))
    blocks.push(
      listIsOrdered
        ? <ol className="list-decimal space-y-1 pl-5" key={`ol-${blocks.length}`}>{items}</ol>
        : <ul className="list-disc space-y-1 pl-5" key={`ul-${blocks.length}`}>{items}</ul>
    )
    listItems = []
  }

  content.split("\n").forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      flushParagraph()
      return
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed)

    if (bullet ?? numbered) {
      flushParagraph()
      if (!listItems.length) {
        listIsOrdered = Boolean(numbered)
      }
      listItems.push((numbered ?? bullet)![1])
      return
    }

    flushList()
    paragraph.push(trimmed.replace(/^#{1,6}\s+/, ""))
  })

  flushList()
  flushParagraph()

  return <div className="space-y-2">{blocks}</div>
}

function AuthorityMatches({
  copy,
  onFileRti,
  suggestions,
}: {
  copy: ChatCopy
  onFileRti: (suggestion: AuthoritySuggestion) => void
  suggestions: AuthoritySuggestion[]
}) {
  if (!suggestions.length) {
    return null
  }

  return (
    <section className="mt-3 border-t border-border pt-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{copy.authorityTitle}</p>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5" key={suggestion.authorityId}>
            <p className="text-xs font-semibold leading-5 text-foreground">{suggestion.authorityName}</p>
            {suggestion.ministryName && (
              <p className="mt-1 text-xs leading-4 text-muted-foreground">{suggestion.ministryName}</p>
            )}
            {suggestion.relatedOffices.length > 0 && (
              <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
                {copy.relatedOffices}: {suggestion.relatedOffices.join("; ")}
              </p>
            )}
            <button
              aria-label={copy.fileRti + ": " + suggestion.authorityName}
              className="mt-2 inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => onFileRti(suggestion)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm">edit_document</span>
              {copy.fileRti}
            </button>
          </div>
        ))}
      </div>
      <Link className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline" to="/public-authorities">
        {copy.confirmAuthority}
        <span aria-hidden="true" className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
      </Link>
    </section>
  )
}

export function RtiSahayak() {
  const { language } = usePortalLanguage()
  const { openRequestGuidelines } = useRequestGuidelines()
  const copy = chatCopy[language]
  const [isOpen, setIsOpen] = useState(false)
  const [hasScrolledDown, setHasScrolledDown] = useState(false)
  const isCompact = useSyncExternalStore(subscribeToCompactLauncher, getIsCompactLauncher)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(language)])
  const [hasPrivacyNotice, setHasPrivacyNotice] = useState(false)
  /** Messages whose translation was already tried and failed - retrying would loop forever. */
  const [failedTranslations, setFailedTranslations] = useState<ReadonlySet<string>>(() => new Set())
  const safetyIdentifier = useRef(createSafetyIdentifier())
  const activeConversation = useRef(0)
  const isTranslatingRef = useRef(false)
  const launcherRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  // Both derived rather than stored, so they clear themselves the moment a message is carried
  // across, and the indicator appears the instant the language flips rather than one pass later.
  const isTranslating = messages.some((message) => needsTranslation(message, language, failedTranslations))
  const translationFailed = messages.some(
    (message) =>
      message.text[language] === undefined && failedTranslations.has(getTranslationKey(message, language))
  )

  // Switching the portal language keeps the conversation rather than clearing it, so a message
  // the model wrote in the other language has to be carried across. This also covers a reply
  // that lands after the switch, which was generated in the language it was asked in.
  useEffect(() => {
    if (isTranslatingRef.current) {
      return
    }

    const pending = messages.filter((message) => needsTranslation(message, language, failedTranslations))

    if (!pending.length) {
      return
    }

    // The target is captured rather than read later: a switch back mid-flight must still file
    // the answer under the language it was requested in, not under whatever is selected now.
    const targetLanguage = language
    isTranslatingRef.current = true

    void (async () => {
      const result = await translateChatMessages({
        texts: pending.map((message) => getMessageText(message, targetLanguage)),
        language: targetLanguage,
        safetyIdentifier: safetyIdentifier.current,
      })

      // Released before the state updates below, so the pass they trigger can start the next
      // batch. Every branch here changes state, so a pass always follows.
      isTranslatingRef.current = false

      if (result) {
        // A batch is capped by size, so the rest is picked up when this state change re-runs.
        const translated = new Map(
          result.translations.map((text, index) => [pending[index].id, text] as const)
        )

        setMessages((currentMessages) =>
          currentMessages.map((message) => {
            const text = translated.get(message.id)
            return text ? { ...message, text: { ...message.text, [targetLanguage]: text } } : message
          })
        )
      } else {
        setFailedTranslations((current) => {
          const next = new Set(current)
          pending.forEach((message) => next.add(getTranslationKey(message, targetLanguage)))
          return next
        })
      }
    })()
  }, [language, messages, failedTranslations])

  // Grow the box to fit what has been typed instead of making the user scroll inside it.
  // Height is cleared first so the box also shrinks back when text is deleted.
  useLayoutEffect(() => {
    const field = draftRef.current
    if (!field) {
      return
    }

    field.style.height = "auto"
    field.style.height = `${field.scrollHeight}px`
  }, [draft, isOpen])

  // Keep the newest message in view: on send, on reply, and when the panel is reopened.
  useEffect(() => {
    const list = messageListRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, isSending, isTranslating, isOpen])

  // Keep the launcher clear of the site footer as it enters the viewport, and reveal the
  // back-to-top button once the page has moved about a screenful.
  useEffect(() => {
    const updateFixedChrome = () => {
      const footer = document.querySelector<HTMLElement>("[data-site-footer]")
      const offset = footer ? Math.max(0, Math.round(window.innerHeight - footer.getBoundingClientRect().top)) : 0
      const launcher = launcherRef.current

      if (launcher) {
        launcher.style.bottom = `calc(1.25rem + ${offset}px)`
      }

      setHasScrolledDown(window.scrollY > 400)
    }

    updateFixedChrome()
    window.addEventListener("scroll", updateFixedChrome, { passive: true })
    window.addEventListener("resize", updateFixedChrome)

    return () => {
      window.removeEventListener("scroll", updateFixedChrome)
      window.removeEventListener("resize", updateFixedChrome)
    }
  }, [])

  // The request form only accepts a ministry and authority pair it can find in its own option
  // list, and it derives the ministry by the same walk up the directory that groups a suggestion
  // here. A suggestion with no ministry is a top-level authority, which the form files under its
  // own name rather than under a parent.
  const startRequestFor = (suggestion: AuthoritySuggestion) => {
    setIsOpen(false)
    openRequestGuidelines({
      authority: {
        name: suggestion.authorityName,
        ministryName: suggestion.ministryName ?? suggestion.authorityName,
      },
    })
  }

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) {
      return
    }

    setDraft("")

    if (containsSensitiveData(message)) {
      setHasPrivacyNotice(true)
      return
    }

    setHasPrivacyNotice(false)
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text: localize(language, message),
      sourceLanguage: language,
    }
    const nextMessages = [...messages, userMessage]
    const conversationId = activeConversation.current
    setMessages(nextMessages)
    setIsSending(true)

    const history = nextMessages
      .filter((item) => item.id !== "welcome")
      .slice(-4)
      .map((item) => ({ role: item.role, content: getMessageText(item, language) }))

    try {
      const response = await askRtiSahayak({
        message,
        history,
        language,
        safetyIdentifier: safetyIdentifier.current,
      })

      // Ignore a reply that belonged to a conversation the user has since cleared.
      if (conversationId !== activeConversation.current) {
        return
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          text: response.reply,
          // The language the answer was asked in, which may no longer be the selected one.
          sourceLanguage: language,
          authoritySuggestions: response.authoritySuggestions,
          source: response.source,
        },
      ])
    } finally {
      if (conversationId === activeConversation.current) {
        setIsSending(false)
      }
    }
  }

  const clearConversation = () => {
    activeConversation.current += 1
    setFailedTranslations(new Set())
    setMessages([createWelcomeMessage(language)])
    setDraft("")
    setHasPrivacyNotice(false)
    setIsSending(false)
    safetyIdentifier.current = createSafetyIdentifier()
  }

  const toggleChat = () => setIsOpen((open) => !open)
  const launcherLabel = isOpen ? copy.closeChat : copy.openChat
  const launcherIcon = <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
  const launcherClassName = isOpen
    ? "rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary"
    : "rounded-full border-primary-foreground/25 bg-primary/55 text-primary-foreground shadow-lg shadow-primary/20 supports-backdrop-filter:backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:supports-backdrop-filter:backdrop-blur-sm"

  return (
    // items-end keeps the launcher pinned to the right edge; without it the button drifts
    // left to the start of the container once the much wider panel opens above it.
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end" ref={launcherRef}>
      {isOpen && (
        <section
          aria-label={copy.name + " chat"}
          className="mb-3 flex h-[min(38rem,calc(100svh/var(--app-scale)-7.5rem))] w-[calc(100vw-2.5rem)] max-w-[25rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[25rem]"
        >
          <header className="flex items-start gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">support_agent</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-headline-md text-base font-semibold">{copy.name}</h2>
              <p className="text-xs text-primary-foreground/75">{copy.subtitle}</p>
            </div>
            <IconTooltip
              label={copy.closeChat}
              render={
                <Button
                  aria-label={copy.closeChat}
                  className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                  onClick={() => setIsOpen(false)}
                  size="icon-sm"
                  variant="ghost"
                />
              }
              side="left"
            >
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </IconTooltip>
          </header>

          <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs leading-5 text-muted-foreground">
            <span aria-hidden="true" className="material-symbols-outlined mr-1 align-[-3px] text-sm">shield</span>
            {copy.privacyWarning}
          </div>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4" ref={messageListRef}>
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "ml-9 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground" : "mr-5 rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-sm"}
                key={message.id}
              >
                {message.role === "assistant"
                  ? <FormattedMessage content={getMessageText(message, language)} />
                  : getMessageText(message, language)}
                {message.role === "assistant" && message.authoritySuggestions && (
                  <AuthorityMatches copy={copy} onFileRti={startRequestFor} suggestions={message.authoritySuggestions} />
                )}
              </div>
            ))}
            {isTranslating && (
              <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                {copy.translating}
              </div>
            )}
            {isSending && (
              <div className="mr-5 flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-base">more_horiz</span>
                {copy.preparing}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-3">
            {messages.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {copy.suggestions.map((suggestion) => (
                  <button
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSending}
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {hasPrivacyNotice && (
              <p className="mb-2 rounded-md bg-destructive/10 px-2.5 py-2 text-xs leading-4 text-destructive" role="alert">
                {copy.privacyNotice}
              </p>
            )}

            {translationFailed && !isTranslating && (
              <p className="mb-2 rounded-md bg-muted px-2.5 py-2 text-xs leading-4 text-muted-foreground">
                {copy.translationFailed}
              </p>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage(draft)
              }}
            >
              <label className="sr-only" htmlFor="rti-sahayak-message">{copy.askLabel}</label>
              <textarea
                className="max-h-32 min-h-10 flex-1 resize-none overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                disabled={isSending}
                id="rti-sahayak-message"
                maxLength={700}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends, Shift+Enter starts a new line. isComposing guards Indic and
                  // other IME input, where Enter is how a candidate word gets committed.
                  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                    return
                  }

                  event.preventDefault()
                  void sendMessage(draft)
                }}
                placeholder={copy.placeholder}
                ref={draftRef}
                rows={1}
                value={draft}
              />
              <IconTooltip label={copy.sendMessage} render={<Button aria-label={copy.sendMessage} disabled={!draft.trim() || isSending} size="icon" type="submit" />}>
                <span aria-hidden="true" className="material-symbols-outlined">send</span>
              </IconTooltip>
            </form>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link className="font-medium text-foreground hover:underline" to="/faq">{copy.browseFaqs}</Link>
              <button className="hover:text-foreground hover:underline" onClick={clearConversation} type="button">{copy.clearChat}</button>
            </div>
          </div>
        </section>
      )}

      {!isOpen && hasScrolledDown ? (
        <IconTooltip
          label={copy.backToTop}
          render={
            <Button
              aria-label={copy.backToTop}
              className="mb-3 size-12 rounded-full border-primary-foreground/25 bg-primary/55 text-primary-foreground shadow-lg shadow-primary/20 supports-backdrop-filter:backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              onClick={scrollToTop}
              size="icon-lg"
            />
          }
          side="left"
        >
          <span aria-hidden="true" className="material-symbols-outlined">arrow_upward</span>
        </IconTooltip>
      ) : null}

      {isCompact ? (
        // size-12 rather than the pill's height alone, so the collapsed launcher and the
        // back-to-top button stacked above it are the same circle.
        <IconTooltip
          label={launcherLabel}
          render={<Button aria-expanded={isOpen} aria-label={launcherLabel} className={`size-12 ${launcherClassName}`} onClick={toggleChat} size="icon-lg" />}
          side="left"
        >
          {launcherIcon}
        </IconTooltip>
      ) : (
        <Button aria-expanded={isOpen} aria-label={launcherLabel} className={`h-12 px-4 ${launcherClassName}`} onClick={toggleChat} size="lg">
          {launcherIcon}
          <span>{copy.name}</span>
        </Button>
      )}
    </div>
  )
}
