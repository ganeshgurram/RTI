import { EndSensitivity, GoogleGenAI, Modality, StartSensitivity, Type, type FunctionCall, type LiveServerMessage, type Session } from "@google/genai"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import type { RequestReviewDraft } from "@/data/request-review"
import { usePortalLanguage, type PortalLanguage } from "@/i18n"
import { api } from "@/services/api"
import { findAuthoritySuggestions, type AuthoritySuggestion } from "@/services/authority-recommendations"
import { prepareAuthorityDraft } from "@/services/rti-sahayak"
import { publishVoiceStatus, recordVoiceTranscript, VOICE_TOGGLE_EVENT } from "@/services/voice-conversation"

type VoiceStatus = "idle" | "connecting" | "listening" | "answering" | "permissionRequired" | "unavailable"

type VoiceCopy = {
  name: string
  activate: string
  deactivate: string
  connecting: string
  listening: string
  answering: string
  permissionRequired: string
  unavailable: string
}

const voiceCopy: Record<PortalLanguage, VoiceCopy> = {
  en: {
    name: "Voice assistant",
    activate: "Enable voice assistant",
    deactivate: "Stop voice assistant",
    connecting: "Starting a secure voice session...",
    listening: "Say “Hey RTI” to begin",
    answering: "RTI Sahayak is answering...",
    permissionRequired: "Allow microphone access to use voice assistance.",
    unavailable: "Voice assistance is unavailable right now. Please try again.",
  },
  hi: {
    name: "वॉइस सहायक",
    activate: "वॉइस सहायक चालू करें",
    deactivate: "वॉइस सहायक बंद करें",
    connecting: "सुरक्षित वॉइस सत्र शुरू हो रहा है...",
    listening: "शुरू करने के लिए “हे आरटीआई” कहें",
    answering: "आरटीआई सहायक जवाब दे रहा है...",
    permissionRequired: "वॉइस सहायक इस्तेमाल करने के लिए माइक्रोफ़ोन की अनुमति दें।",
    unavailable: "वॉइस सहायक अभी उपलब्ध नहीं है। कृपया फिर कोशिश करें।",
  },
  te: {
    name: "వాయిస్ సహాయకుడు",
    activate: "వాయిస్ సహాయకుడిని ప్రారంభించండి",
    deactivate: "వాయిస్ సహాయకుడిని ఆపండి",
    connecting: "సురక్షిత వాయిస్ సెషన్ ప్రారంభమవుతోంది...",
    listening: "ప్రారంభించడానికి “హే RTI” అని చెప్పండి",
    answering: "RTI సహాయక్ సమాధానం ఇస్తోంది...",
    permissionRequired: "వాయిస్ సహాయాన్ని ఉపయోగించడానికి మైక్రోఫోన్ అనుమతిని ఇవ్వండి.",
    unavailable: "వాయిస్ సహాయం ప్రస్తుతం అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  kn: {
    name: "ಧ್ವನಿ ಸಹಾಯಕ",
    activate: "ಧ್ವನಿ ಸಹಾಯಕವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ",
    deactivate: "ಧ್ವನಿ ಸಹಾಯಕವನ್ನು ನಿಲ್ಲಿಸಿ",
    connecting: "ಸುರಕ್ಷಿತ ಧ್ವನಿ ಅವಧಿಯನ್ನು ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ...",
    listening: "ಪ್ರಾರಂಭಿಸಲು “ಹೇ RTI” ಎಂದು ಹೇಳಿ",
    answering: "RTI ಸಹಾಯಕ ಉತ್ತರಿಸುತ್ತಿದೆ...",
    permissionRequired: "ಧ್ವನಿ ಸಹಾಯವನ್ನು ಬಳಸಲು ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ.",
    unavailable: "ಧ್ವನಿ ಸಹಾಯವು ಇದೀಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
}

const INPUT_SAMPLE_RATE = 16_000
const OUTPUT_SAMPLE_RATE = 24_000
// Gemini still performs server-side VAD. This lightweight browser check only gives it a
// dependable end-of-turn signal when a continuously open microphone has a noisy floor.
const SPEECH_LEVEL_THRESHOLD = 0.012
const END_OF_SPEECH_SILENCE_MS = 800
const AUDIO_PRE_ROLL_CHUNKS = 4
const PAGE_PATHS = {
  submit_request: "/submit-request",
  request_history: "/request-history",
  view_status: "/view-status",
  first_appeal: "/submit-first-appeal",
  public_authorities: "/public-authorities",
} as const

type PortalPage = keyof typeof PAGE_PATHS

type VoiceAuthoritySearch = {
  description: string
  suggestions: AuthoritySuggestion[]
}

const VOICE_SYSTEM_INSTRUCTION = `You are RTI Sahayak, the concise, respectful voice guide for India's RTI Online portal.

The user explicitly started this microphone session, but remain quiet until they first address you with “Hey RTI”, “Hi RTI”, “Hello RTI”, or the Hindi equivalent “हे आरटीआई”. Once activated, have a natural ongoing conversation until the session ends. After the initial greeting, determine the reply language only from the applicant's current complete spoken request—not from the website language, a previous reply, or the wake phrase. If the applicant speaks English, reply entirely in English. Do not translate English speech into Hindi, Telugu, or Kannada. If the spoken language is unclear, reply in English. Keep answers short enough for voice.

Offer general guidance about RTI applications, first appeals, fees, Public Authorities, and request status. When the user asks which Central Public Authority could hold information, use search_public_authorities before answering. Explain that the returned candidates are suggestions from the portal directory, name no more than three, and ask the applicant to confirm the office before filing. Do not claim to be a government officer or give legal advice. Do not ask for or repeat OTPs, passwords, Aadhaar/PAN, payment card data, or documents.

To prepare an RTI request by voice: first call search_public_authorities, explain the best directory candidate, and ask the user to clearly confirm that they want an editable draft for that authority. A response such as “yes”, “go ahead”, “proceed”, or “create the draft” after you named an authority is clear confirmation. Immediately call prepare_rti_request_draft with the original general issue, the exact authorityId returned by the directory, and the language the user spoke. Do not merely describe the next step or ask them to use another form. This opens the normal guideline-gated request form with a draft the user can edit. Never say the request has been submitted.

You cannot submit an RTI, make a payment, edit a profile, or take any irreversible action. If a signed-in user asks about their personal requests, use only the provided functions. Never invent request data. Use page navigation only when the user clearly asks to open that page.`

function getVoiceSystemInstruction(portalLanguage: PortalLanguage) {
  const greetingLanguage = portalLanguage === "hi"
    ? "Hindi written in Devanagari"
    : portalLanguage === "te"
      ? "Telugu written in Telugu script"
      : portalLanguage === "kn"
        ? "Kannada written in Kannada script"
      : "English"
  return `${VOICE_SYSTEM_INSTRUCTION}

For the initial greeting only, use ${greetingLanguage} to match the portal language the applicant selected. Treat the wake phrase as language-neutral; it must not change the greeting language. After that one greeting, do not let the portal language influence the conversation: use the language in the applicant's latest complete spoken request.`
}

function audioToBase64(samples: Float32Array, sampleRate: number) {
  const ratio = sampleRate / INPUT_SAMPLE_RATE
  const length = Math.max(1, Math.round(samples.length / ratio))
  const bytes = new Uint8Array(length * 2)
  const view = new DataView(bytes.buffer)

  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio)
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((index + 1) * ratio)))
    let sum = 0
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) sum += samples[sampleIndex] ?? 0
    const value = Math.max(-1, Math.min(1, sum / (end - start)))
    view.setInt16(index * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true)
  }

  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return btoa(binary)
}

function getAudioLevel(samples: Float32Array) {
  let sumOfSquares = 0
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] ?? 0
    sumOfSquares += sample * sample
  }

  return Math.sqrt(sumOfSquares / Math.max(samples.length, 1))
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function cleanVoiceTranscript(value: string) {
  return value
    // Gemini 2.5 Live occasionally leaks internal control tokens such as <ctrl46>
    // into its transcription stream around a function call. They are not speech.
    .replace(/<\s*(?:ctrl\d+|noise|silence|inaudible|unknown|unintelligible)\s*>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Keep a transliterated English wake phrase readable in the visible chat. */
function normalizeWakePhraseTranscript(value: string) {
  const text = cleanVoiceTranscript(value)
  const withoutPunctuation = text.replace(/[.!?।]+$/u, "")
  const compact = withoutPunctuation.replace(/[\s.]/g, "")

  if (/^(?:hey|hi|hello)rti$/i.test(compact)) {
    return "Hey RTI"
  }

  // Gemini may render an English “Hey RTI” in Devanagari when it hears an
  // Indian accent. Those variants are still the English wake phrase, not a
  // language selection for the conversation.
  if (/^(?:हे|है|हाय|हेलो|हैलो)आरटी(?:आई|आय)$/u.test(compact)) {
    return "Hey RTI"
  }

  return text
}

/**
 * Live transcript events do not carry a language field. Keeping the portal's UI
 * language on those events made an English transcript appear to be Kannada or
 * Telugu, which could then trigger an unnecessary translation in the chat.
 */
function detectTranscriptLanguage(text: string, fallback: PortalLanguage): PortalLanguage {
  if (/[\u0C80-\u0CFF]/u.test(text)) return "kn"
  if (/[\u0C00-\u0C7F]/u.test(text)) return "te"
  if (/[\u0900-\u097F]/u.test(text)) return "hi"
  if (/[A-Za-z]/.test(text)) return "en"
  return fallback
}

function appendTranscript(current: string, incoming: string) {
  const next = cleanVoiceTranscript(incoming)
  if (!next) return current
  if (!current || next.startsWith(current)) return next
  if (current.endsWith(next)) return current
  return `${current} ${next}`.trim()
}

function getConfirmedAuthority(text: string, suggestions: AuthoritySuggestion[]) {
  const normalized = text.trim().toLowerCase()
  const isAffirmative = /^(?:yes|yeah|yep|go ahead|please go ahead|proceed|please proceed|continue|do it|create (?:the )?draft|draft it|haan|han|ha|avunu|haudu)\b/i.test(normalized)
  if (!isAffirmative) return null

  if (/\b(?:second|2nd)\b/i.test(normalized)) return suggestions[1] ?? null
  if (/\b(?:third|3rd)\b/i.test(normalized)) return suggestions[2] ?? null
  // The assistant presents the best directory match first before asking for confirmation.
  return suggestions[0] ?? null
}

function isPortalPage(value: unknown): value is PortalPage {
  return typeof value === "string" && value in PAGE_PATHS
}

/**
 * Gemini Live owns both native audio input and output. The browser only gets a
 * one-use ephemeral token from Express, never the permanent Gemini API key.
 */
export function VoiceAssistant() {
  const { language } = usePortalLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const copy = voiceCopy[language]
  const [isEnabled, setIsEnabled] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const sessionRef = useRef<Session | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const mutedGainRef = useRef<GainNode | null>(null)
  const outputSourcesRef = useRef(new Set<AudioBufferSourceNode>())
  const outputEndTimeRef = useRef(0)
  const isEnabledRef = useRef(false)
  const isStartingRef = useRef(false)
  const audioStreamOpenRef = useRef(false)
  const lastDetectedSpeechAtRef = useRef(0)
  const preRollAudioRef = useRef<string[]>([])
  const languageRef = useRef(language)
  const assistantTranscriptRef = useRef("")
  const assistantTranscriptIdRef = useRef<string | null>(null)
  const pendingInputTranscriptRef = useRef("")
  const authoritySearchRef = useRef<VoiceAuthoritySearch | null>(null)
  const isPreparingDraftRef = useRef(false)

  useEffect(() => {
    languageRef.current = language
  }, [language])

  const discardAssistantTranscript = () => {
    const id = assistantTranscriptIdRef.current
    if (id) {
      recordVoiceTranscript({
        role: "assistant",
        text: "",
        language: languageRef.current,
        id,
        isFinal: true,
        isDiscarded: true,
      })
    }
    assistantTranscriptRef.current = ""
    assistantTranscriptIdRef.current = null
  }

  const stopOutput = () => {
    for (const source of outputSourcesRef.current) {
      try {
        source.stop()
      } catch {
        // The source may already have ended between a server interruption and cleanup.
      }
    }
    outputSourcesRef.current.clear()
    outputEndTimeRef.current = 0
  }

  const stopVoiceAssistant = () => {
    isStartingRef.current = false
    isEnabledRef.current = false
    audioStreamOpenRef.current = false
    lastDetectedSpeechAtRef.current = 0
    preRollAudioRef.current = []
    setIsEnabled(false)
    setStatus("idle")
    discardAssistantTranscript()
    pendingInputTranscriptRef.current = ""
    authoritySearchRef.current = null
    stopOutput()

    try {
      sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true })
      sessionRef.current?.close()
    } catch {
      // The session may already have closed on the service.
    }
    sessionRef.current = null

    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    mutedGainRef.current?.disconnect()
    processorRef.current = null
    sourceRef.current = null
    mutedGainRef.current = null
    for (const track of streamRef.current?.getTracks() ?? []) track.stop()
    streamRef.current = null

    const context = audioContextRef.current
    audioContextRef.current = null
    if (context && context.state !== "closed") void context.close()
  }

  const playAudioChunk = (base64Audio: string) => {
    const context = audioContextRef.current
    if (!context || !isEnabledRef.current) return

    const bytes = base64ToBytes(base64Audio)
    if (bytes.byteLength < 2) return

    const frames = Math.floor(bytes.byteLength / 2)
    const audioBuffer = context.createBuffer(1, frames, OUTPUT_SAMPLE_RATE)
    const channel = audioBuffer.getChannelData(0)
    const view = new DataView(bytes.buffer, bytes.byteOffset, frames * 2)
    for (let index = 0; index < frames; index += 1) channel[index] = view.getInt16(index * 2, true) / 0x8000

    const source = context.createBufferSource()
    source.buffer = audioBuffer
    source.connect(context.destination)
    outputSourcesRef.current.add(source)
    const startsAt = Math.max(context.currentTime, outputEndTimeRef.current)
    outputEndTimeRef.current = startsAt + audioBuffer.duration
    source.onended = () => {
      outputSourcesRef.current.delete(source)
      if (!outputSourcesRef.current.size && isEnabledRef.current) setStatus("listening")
    }
    source.start(startsAt)
  }

  const publishAssistantTranscript = (isFinal = false) => {
    const text = cleanVoiceTranscript(assistantTranscriptRef.current)
    if (!text) return

    const id = assistantTranscriptIdRef.current ?? crypto.randomUUID()
    assistantTranscriptIdRef.current = id
    recordVoiceTranscript({
      role: "assistant",
      text,
      language: detectTranscriptLanguage(text, languageRef.current),
      id,
      isFinal,
    })
  }

  const completeAssistantTranscript = () => {
    publishAssistantTranscript(true)
    assistantTranscriptRef.current = ""
    assistantTranscriptIdRef.current = null
  }

  const openDraftedRequestForm = async (args: Record<string, unknown>) => {
    if (isPreparingDraftRef.current) {
      return { result: "The portal is already preparing the editable RTI draft." }
    }

    const cachedSearch = authoritySearchRef.current
    const description = String(args.description ?? cachedSearch?.description ?? "").trim().slice(0, 1400)
    const authorityId = String(args.authorityId ?? "").trim()
    const draftLanguage: PortalLanguage = args.language === "hi" || args.language === "te" || args.language === "kn" ? args.language : "en"
    if (!description || !authorityId) {
      return { error: "A general issue and a directory authority ID are required before drafting." }
    }

    // Gemini may shorten or paraphrase the previous search query when it calls the next
    // tool. Reuse the directory candidates it was given instead of searching again and
    // accidentally losing the confirmed authority.
    const authorityFromRecentSearch = cachedSearch?.suggestions.find((candidate) => candidate.authorityId === authorityId)
    const suggestions = authorityFromRecentSearch && cachedSearch
      ? cachedSearch.suggestions
      : await findAuthoritySuggestions(description)
    const authority = authorityFromRecentSearch ?? suggestions.find((candidate) => candidate.authorityId === authorityId)
    if (!authority) {
      return { error: "That authority was not returned by the directory for this issue. Search again and ask the user to choose a listed authority." }
    }

    isPreparingDraftRef.current = true
    try {
      const generated = await prepareAuthorityDraft({
        authority,
        description,
        language: draftLanguage,
        safetyIdentifier: `gemini-live-${crypto.randomUUID()}`,
      })
      const profile = user?.profile
      const reviewDraft: RequestReviewDraft = {
        applicantEmail: profile?.email ?? "",
        applicantName: profile?.fullName ?? "",
        applicantPhone: profile?.mobile ?? "",
        authority: authority.authorityName,
        ministry: authority.ministryName ?? authority.authorityName,
        subject: generated.subject,
        requestText: generated.requestText,
        isBplApplicant: false,
        citizenship: profile?.citizenship ?? "Indian",
        applicant: {
          gender: profile?.gender ?? "",
          addressLine1: profile?.address.line1 ?? "",
          addressLine2: profile?.address.line2 ?? "",
          addressLine3: profile?.address.city ?? "",
          pincode: profile?.address.pincode ?? "",
          country: profile?.country ?? "India",
          state: profile?.address.state ?? "",
          areaType: profile?.areaType ?? "",
          educationalStatus: profile?.educationalStatus ?? "",
        },
      }

      navigate("/submit-request", {
        state: {
          authority: { name: authority.authorityName, ministryName: authority.ministryName ?? authority.authorityName },
          reviewDraft,
        },
      })
      return {
        result: "An editable RTI draft has been placed in the request form. The applicant must read the guidelines and review the form before submitting.",
      }
    } catch (error) {
      isPreparingDraftRef.current = false
      throw error
    }
  }

  const prepareConfirmedVoiceDraft = (text: string, draftLanguage: PortalLanguage) => {
    const previousSearch = authoritySearchRef.current
    const authority = previousSearch ? getConfirmedAuthority(text, previousSearch.suggestions) : null
    if (!previousSearch || !authority || isPreparingDraftRef.current) return

    void openDraftedRequestForm({
      description: previousSearch.description,
      authorityId: authority.authorityId,
      language: draftLanguage,
    }).catch(() => {
      // The Live model still receives this turn and can give the applicant a recovery message.
      // Keep the microphone session available when draft generation has a transient failure.
      if (isEnabledRef.current) setStatus("listening")
    })
  }

  const completeInputTranscript = () => {
    const text = normalizeWakePhraseTranscript(pendingInputTranscriptRef.current)
    pendingInputTranscriptRef.current = ""
    if (text) {
      const transcriptLanguage = detectTranscriptLanguage(text, languageRef.current)
      recordVoiceTranscript({ role: "user", text, language: transcriptLanguage })
      prepareConfirmedVoiceDraft(text, transcriptLanguage)
    }
  }

  const resolveFunctionCall = async (call: FunctionCall) => {
    let response: Record<string, unknown>

    try {
      if (call.name === "search_public_authorities") {
        const query = String(call.args?.query ?? "").trim().slice(0, 700)
        const suggestions = query ? await findAuthoritySuggestions(query) : []
        authoritySearchRef.current = suggestions.length ? { description: query, suggestions } : null
        response = suggestions.length
          ? {
              candidates: suggestions.map((suggestion) => ({
                authorityId: suggestion.authorityId,
                authority: suggestion.authorityName,
                ministry: suggestion.ministryName ?? null,
                relatedOffices: suggestion.relatedOffices,
                directorySubject: suggestion.matchReason,
              })),
              note: "These are directory suggestions only. The applicant must confirm which authority holds the records before filing.",
            }
          : { candidates: [], note: "No relevant directory candidate was found. Ask the applicant to try the Public Authorities Directory." }
      } else if (call.name === "prepare_rti_request_draft") {
        response = await openDraftedRequestForm(call.args ?? {})
      } else if (call.name === "get_my_request_summary") {
        response = await api.runVoiceAction<Record<string, unknown>>("get_my_request_summary")
      } else if (call.name === "get_my_request_status") {
        response = await api.runVoiceAction<Record<string, unknown>>("get_my_request_status", call.args ?? {})
      } else if (call.name === "open_portal_page") {
        const page = call.args?.page
        if (!isPortalPage(page)) response = { error: "That page is not available." }
        else {
          navigate(PAGE_PATHS[page])
          response = { result: "The requested portal page is now open." }
        }
      } else {
        response = { error: "That action is unavailable." }
      }
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
      response = code === "authenticationRequired" || code === "sessionExpired"
        ? { error: "Sign in is required before viewing personal RTI request information." }
        : { error: "The portal could not complete that request right now." }
    }

    if (call.id && sessionRef.current && isEnabledRef.current) {
      sessionRef.current.sendToolResponse({ functionResponses: [{ id: call.id, name: call.name, response }] })
    }
  }

  const onLiveMessage = (message: LiveServerMessage) => {
    if (!isEnabledRef.current) return

    if (message.toolCall?.functionCalls?.length) {
      completeInputTranscript()
      setStatus("answering")
      for (const call of message.toolCall.functionCalls) void resolveFunctionCall(call)
    }

    const content = message.serverContent
    if (!content) return
    if (content.interrupted) {
      stopOutput()
      discardAssistantTranscript()
      setStatus("listening")
    }

    const inputText = content.inputTranscription?.text?.trim()
    if (inputText) pendingInputTranscriptRef.current = appendTranscript(pendingInputTranscriptRef.current, inputText)

    const outputText = content.outputTranscription?.text
    if (outputText) {
      completeInputTranscript()
      assistantTranscriptRef.current = appendTranscript(assistantTranscriptRef.current, outputText)
      publishAssistantTranscript()
    }
    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        completeInputTranscript()
        setStatus("answering")
        playAudioChunk(part.inlineData.data)
      }
    }

    if (content.turnComplete) {
      completeInputTranscript()
      completeAssistantTranscript()
      if (!outputSourcesRef.current.size) setStatus("listening")
    }
  }

  const startVoiceAssistant = async () => {
    if (isEnabledRef.current || isStartingRef.current || !navigator.mediaDevices?.getUserMedia) {
      if (!navigator.mediaDevices?.getUserMedia) setStatus("unavailable")
      return
    }

    isStartingRef.current = true
    setStatus("connecting")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (!isStartingRef.current) {
        for (const track of stream.getTracks()) track.stop()
        return
      }
      streamRef.current = stream

      // The voice assistant itself begins only after the user has explicitly granted access.
      const context = new AudioContext()
      audioContextRef.current = context
      void context.resume()
      isEnabledRef.current = true
      setIsEnabled(true)

      const token = await api.createVoiceSessionToken()
      if (!isEnabledRef.current) return

      const ai = new GoogleGenAI({ apiKey: token.token, httpOptions: { apiVersion: "v1beta" } })
      const session = await ai.live.connect({
        model: token.model,
        config: {
          responseModalities: [Modality.AUDIO],
          // Aoede is the selected softer female-presenting portal voice. Native audio chooses the
          // spoken language naturally, so this does not lock the conversation to English.
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
          inputAudioTranscription: {
            // These are recognition hints, not a forced portal-language setting.
            // English comes first as the portal's default, while the other supported
            // Indian languages remain available for automatic turn-by-turn detection.
            languageCodes: ["en-IN", "hi-IN", "te-IN", "kn-IN"],
            customVocabulary: [
              "Hey RTI",
              "Hi RTI",
              "Hello RTI",
              "RTI",
              "RTI Sahayak",
              "Public Authority",
              "CPIO",
              "First Appeal",
              "pension scheme",
            ],
          },
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              prefixPaddingMs: 120,
              silenceDurationMs: END_OF_SPEECH_SILENCE_MS,
            },
          },
          systemInstruction: getVoiceSystemInstruction(language),
          tools: [{
            functionDeclarations: [
              {
                name: "search_public_authorities",
                description: "Search the official in-app directory of Central Public Authorities for the office likely to hold records about the user's general issue. Use this before suggesting an authority.",
                parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "The user's general issue or subject to search for." } }, required: ["query"] },
              },
              {
                name: "prepare_rti_request_draft",
                description: "Create an editable RTI draft and open the guideline-gated request form. Call only after search_public_authorities returned this exact authorityId and the user clearly confirmed they want a draft for it. This never submits an RTI.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING, description: "The user's general, non-sensitive information request." },
                    authorityId: { type: Type.STRING, description: "The exact authorityId returned by search_public_authorities." },
                    language: { type: Type.STRING, enum: ["en", "hi", "te", "kn"], description: "The language used in the user's request." },
                  },
                  // The client keeps the previous directory query, so the model only needs
                  // to carry the confirmed authority ID into this follow-up tool call.
                  required: ["authorityId"],
                },
              },
              {
                name: "get_my_request_summary",
                description: "Retrieve the signed-in user's five most recent RTI requests when they ask about their requests or history.",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "get_my_request_status",
                description: "Retrieve the signed-in user's status for one specific RTI request ID. Use only when the user provides the ID or asks about a known request.",
                parameters: { type: Type.OBJECT, properties: { requestId: { type: Type.STRING, description: "The RTI request ID." } }, required: ["requestId"] },
              },
              {
                name: "open_portal_page",
                description: "Open a portal page only when the user clearly asks to navigate there.",
                parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING, enum: Object.keys(PAGE_PATHS), description: "The requested portal page." } }, required: ["page"] },
              },
            ],
          }],
        },
        callbacks: {
          onmessage: onLiveMessage,
          onerror: () => { if (isEnabledRef.current) setStatus("unavailable") },
          onclose: () => { if (isEnabledRef.current) setStatus("unavailable") },
        },
      })

      if (!isEnabledRef.current) {
        session.close()
        return
      }
      sessionRef.current = session

      const source = context.createMediaStreamSource(stream)
      const processor = context.createScriptProcessor(2048, 1, 1)
      const mutedGain = context.createGain()
      mutedGain.gain.value = 0
      source.connect(processor)
      processor.connect(mutedGain)
      mutedGain.connect(context.destination)
      sourceRef.current = source
      processorRef.current = processor
      mutedGainRef.current = mutedGain
      processor.onaudioprocess = (event) => {
        const activeSession = sessionRef.current
        if (!isEnabledRef.current || !activeSession) return

        const samples = event.inputBuffer.getChannelData(0)
        const audio = audioToBase64(samples, context.sampleRate)
        const isSpeech = getAudioLevel(samples) >= SPEECH_LEVEL_THRESHOLD
        const now = performance.now()

        if (!audioStreamOpenRef.current) {
          const preRoll = preRollAudioRef.current
          preRoll.push(audio)
          if (preRoll.length > AUDIO_PRE_ROLL_CHUNKS) preRoll.shift()
          if (!isSpeech) return

          audioStreamOpenRef.current = true
          lastDetectedSpeechAtRef.current = now
          for (const chunk of preRoll) {
            activeSession.sendRealtimeInput({ audio: { data: chunk, mimeType: "audio/pcm;rate=16000" } })
          }
          preRollAudioRef.current = []
          return
        }

        activeSession.sendRealtimeInput({ audio: { data: audio, mimeType: "audio/pcm;rate=16000" } })
        if (isSpeech) {
          lastDetectedSpeechAtRef.current = now
          return
        }

        if (now - lastDetectedSpeechAtRef.current >= END_OF_SPEECH_SILENCE_MS) {
          activeSession.sendRealtimeInput({ audioStreamEnd: true })
          audioStreamOpenRef.current = false
          lastDetectedSpeechAtRef.current = 0
          setStatus("answering")
        }
      }
      setStatus("listening")
    } catch (error) {
      const name = typeof error === "object" && error && "name" in error ? String(error.name) : ""
      stopVoiceAssistant()
      setStatus(name === "NotAllowedError" ? "permissionRequired" : "unavailable")
    } finally {
      isStartingRef.current = false
    }
  }

  useEffect(() => () => stopVoiceAssistant(), [])

  const toggleVoiceAssistant = useEffectEvent(() => {
    if (isEnabledRef.current || isStartingRef.current) stopVoiceAssistant()
    else void startVoiceAssistant()
  })

  useEffect(() => {
    publishVoiceStatus({
      isActive: isEnabled || isStartingRef.current,
      label: status === "idle" ? null : copy[status],
      status,
    })
  }, [copy, isEnabled, status])

  useEffect(() => {
    const onVoiceToggle = () => toggleVoiceAssistant()
    window.addEventListener(VOICE_TOGGLE_EVENT, onVoiceToggle)
    return () => window.removeEventListener(VOICE_TOGGLE_EVENT, onVoiceToggle)
  }, [])

  // The visible microphone control lives in RTI Sahayak's unified composer. This component
  // owns only the secure Live session, audio stream, and portal actions.
  return null
}
