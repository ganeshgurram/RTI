export const VOICE_MESSAGE_EVENT = "rti-sahayak:voice-message"
export const VOICE_TRANSCRIPT_EVENT = "rti-sahayak:voice-transcript"

export type VoiceMessageEventDetail = {
  message: string
  onError: () => void
  onReply: (reply: string) => void
}

/** A completed native-audio turn which should be visible in the RTI Sahayak chat. */
export type VoiceTranscriptEventDetail = {
  role: "user" | "assistant"
  text: string
  language: "en" | "hi"
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
