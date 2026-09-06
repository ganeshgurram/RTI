const DEFAULT_TTS_MODEL = "fish-audio/s2.1-pro-free:free"
const DEFAULT_TTS_VOICE = "alloy"
const MAX_SPEECH_INPUT_CHARS = 1800

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.end(JSON.stringify(payload))
}

function getBody(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body)
  }

  return request.body ?? {}
}

function getSpeechText(value) {
  if (typeof value !== "string") return ""

  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SPEECH_INPUT_CHARS)
}

/**
 * Keeps text-to-speech server-side: the browser only receives the generated MP3 and never the
 * OpenRouter key. Fish Audio detects the language from the supplied text, including Hindi.
 */
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    return sendJson(response, 405, { error: "Method not allowed" })
  }

  let body
  try {
    body = getBody(request)
  } catch {
    return sendJson(response, 400, { error: "Invalid request body" })
  }

  const input = getSpeechText(body.text)
  if (!input) {
    return sendJson(response, 400, { error: "Speech text is required" })
  }

  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) {
    return sendJson(response, 503, { error: "Voice service is not configured" })
  }

  const model = process.env.VOICE_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL
  const voice = process.env.VOICE_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE

  try {
    console.info("[Voice assistant] Generating Fish Audio speech", {
      model,
      voice,
      characters: input.length,
    })
    const upstream = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input, voice, response_format: "mp3" }),
    })

    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => undefined)
      console.warn("[Voice assistant] Fish Audio TTS request failed", {
        status: upstream.status,
        model,
        message: payload?.error?.message ?? "(no message returned)",
      })
      return sendJson(response, 502, { error: "Voice service is temporarily unavailable" })
    }

    const audio = Buffer.from(await upstream.arrayBuffer())
    if (!audio.length) {
      return sendJson(response, 502, { error: "Voice service returned empty audio" })
    }

    console.info("[Voice assistant] Fish Audio speech ready", { model, bytes: audio.length })

    response.statusCode = 200
    response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg")
    response.setHeader("Content-Length", String(audio.length))
    response.setHeader("Cache-Control", "no-store")
    response.end(audio)
  } catch (error) {
    console.warn("[Voice assistant] Fish Audio TTS request failed", {
      model,
      message: error instanceof Error ? error.message : "(unknown error)",
    })
    return sendJson(response, 502, { error: "Voice service is temporarily unavailable" })
  }
}
