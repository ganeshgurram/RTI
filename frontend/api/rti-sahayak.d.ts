import type { IncomingMessage, ServerResponse } from "node:http"

declare const rtiSahayakHandler: (
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse
) => Promise<unknown>

export default rtiSahayakHandler