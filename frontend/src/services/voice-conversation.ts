export const VOICE_MESSAGE_EVENT = "rti-sahayak:voice-message"
export const VOICE_TRANSCRIPT_EVENT = "rti-sahayak:voice-transcript"
export const VOICE_TOGGLE_EVENT = "rti-sahayak:voice-toggle"
export const VOICE_STATUS_EVENT = "rti-sahayak:voice-status"

export type VoiceMessageEventDetail = {
  message: string
  onError: () => void
  onReply: (reply: string) => void
}

/** A completed native-audio turn which should be visible in the RTI Sahayak chat. */
export type VoiceTranscriptEventDetail = {
  role: "user" | "assistant"
  text: string
  language: "en" | "hi" | "te" | "kn"
  /** A stable ID lets the chat update one spoken reply in place as words arrive. */
  id?: string
  /** The final transcript is eligible for normal conversation translation. */
  isFinal?: boolean
  /** A Live interruption removes its unfinished assistant bubble. */
  isDiscarded?: boolean
}

/** State shared with RTI Sahayak's unified text-and-voice composer. */
export type VoiceStatusEventDetail = {
  isActive: boolean
  label: string | null
  status: "idle" | "connecting" | "listening" | "answering" | "permissionRequired" | "unavailable"
}

export function requestVoiceToggle() {
  window.dispatchEvent(new Event(VOICE_TOGGLE_EVENT))
}

export function publishVoiceStatus(detail: VoiceStatusEventDetail) {
  window.dispatchEvent(new CustomEvent<VoiceStatusEventDetail>(VOICE_STATUS_EVENT, { detail }))
}

export function recordVoiceTranscript(detail: VoiceTranscriptEventDetail) {
  window.dispatchEvent(new CustomEvent<VoiceTranscriptEventDetail>(VOICE_TRANSCRIPT_EVENT, { detail }))
}

/**
 * Voice owns microphone and speech playback, while the chat owns the actual conversation state.
 * A small browser event boundary keeps those concerns separate and guarantees there is only one
 * AI request and one transcript for each spoken question.
 */
export function requestVoiceReply(message: string) {
  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Voice reply timed out")), 35_000)
    const finish = (callback: () => void) => {
      window.clearTimeout(timeout)
      callback()
    }

    const detail: VoiceMessageEventDetail = {
      message,
      onReply: (reply) => finish(() => resolve(reply)),
      onError: () => finish(() => reject(new Error("Voice reply was unavailable"))),
    }

    window.dispatchEvent(new CustomEvent<VoiceMessageEventDetail>(VOICE_MESSAGE_EVENT, { detail }))
  })
}
