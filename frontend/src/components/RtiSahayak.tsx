import { useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  askRtiSahayak,
  containsSensitiveData,
  type ChatHistoryMessage,
} from "@/services/rti-sahayak"

type ChatMessage = ChatHistoryMessage & {
  id: string
  source?: "gpt-5.6-luna" | "local"
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Namaste! I’m RTI Sahayak. I can answer general questions about filing an RTI, fees, appeals, Public Authorities, and using View Status.",
  source: "local",
}

const suggestions = [
  "How do I file an RTI request?",
  "What is the RTI fee?",
  "How do I file a First Appeal?",
  "How can I check my status?",
]

function createMessageId() {
  return crypto.randomUUID()
}

function createSafetyIdentifier() {
  return "rti-sahayak-" + crypto.randomUUID()
}

export function RtiSahayak() {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [privacyNotice, setPrivacyNotice] = useState("")
  const safetyIdentifier = useRef(createSafetyIdentifier())

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) {
      return
    }

    setDraft("")

    if (containsSensitiveData(message)) {
      setPrivacyNotice(
        "That message was not sent. For your privacy, do not share names, contact details, Aadhaar/PAN, registration numbers, OTPs, passwords, payment details, or documents."
      )
      return
    }

    setPrivacyNotice("")
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setIsSending(true)

    const history = nextMessages
      .filter((item) => item.id !== "welcome")
      .slice(-4)
      .map(({ role, content }) => ({ role, content }))

    const response = await askRtiSahayak({
      message,
      history,
      safetyIdentifier: safetyIdentifier.current,
    })

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: "assistant",
        content: response.reply,
        source: response.source,
      },
    ])
    setIsSending(false)
  }

  const clearConversation = () => {
    setMessages([welcomeMessage])
    setDraft("")
    setPrivacyNotice("")
    safetyIdentifier.current = createSafetyIdentifier()
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section
          aria-label="RTI Sahayak chat"
          className="mb-3 flex h-[min(38rem,calc(100svh-7.5rem))] w-[calc(100vw-2.5rem)] max-w-[25rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[25rem]"
        >
          <header className="flex items-start gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">support_agent</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-headline-md text-base font-semibold">RTI Sahayak</h2>
              <p className="text-xs text-primary-foreground/75">General RTI guidance · No personal data</p>
            </div>
            <Button
              aria-label="Close RTI Sahayak"
              className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={() => setIsOpen(false)}
              size="icon-sm"
              variant="ghost"
            >
              <span aria-hidden="true" className="material-symbols-outlined">close</span>
            </Button>
          </header>

          <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs leading-5 text-muted-foreground">
            <span aria-hidden="true" className="material-symbols-outlined mr-1 align-[-3px] text-sm">shield</span>
            Never share contact details, IDs, application numbers, OTPs, passwords, payment details, or documents.
          </div>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "ml-9 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground" : "mr-5 whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-sm"}
                key={message.id}
              >
                {message.content}
              </div>
            ))}
            {isSending && (
              <div className="mr-5 flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-base">more_horiz</span>
                RTI Sahayak is preparing an answer…
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-3">
            {messages.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
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

            {privacyNotice && (
              <p className="mb-2 rounded-md bg-destructive/10 px-2.5 py-2 text-xs leading-4 text-destructive" role="alert">
                {privacyNotice}
              </p>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage(draft)
              }}
            >
              <label className="sr-only" htmlFor="rti-sahayak-message">Ask RTI Sahayak</label>
              <textarea
                className="max-h-24 min-h-10 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                disabled={isSending}
                id="rti-sahayak-message"
                maxLength={700}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a general RTI question…"
                rows={1}
                value={draft}
              />
              <Button aria-label="Send message" disabled={!draft.trim() || isSending} size="icon" type="submit">
                <span aria-hidden="true" className="material-symbols-outlined">send</span>
              </Button>
            </form>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link className="font-medium text-foreground hover:underline" to="/faq">Browse official FAQs</Link>
              <button className="hover:text-foreground hover:underline" onClick={clearConversation} type="button">Clear chat</button>
            </div>
          </div>
        </section>
      )}

      <Button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close RTI Sahayak" : "Open RTI Sahayak"}
        className="h-12 rounded-full px-4 shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        size="lg"
      >
        <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
        <span>RTI Sahayak</span>
      </Button>
    </div>
  )
}