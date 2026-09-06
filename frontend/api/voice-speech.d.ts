import type { IncomingMessage, ServerResponse } from "node:http"

declare const voiceSpeechHandler: (
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse
) => Promise<unknown>

export default voiceSpeechHandler
