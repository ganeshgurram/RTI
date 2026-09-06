import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv, type Plugin } from "vite"

import rtiSahayakHandler from "./api/rti-sahayak.js"
import voiceSpeechHandler from "./api/voice-speech.js"

type ApiRequest = IncomingMessage & {
  body?: unknown
}

const aiRouteHandlers = {
  "/api/rti-sahayak": rtiSahayakHandler,
  "/api/voice-speech": voiceSpeechHandler,
}

function aiDevRoutes(): Plugin {
  return {
    name: "ai-dev-routes",
    configureServer(server) {
      server.middlewares.use((request: ApiRequest, response: ServerResponse, next) => {
        const pathname = request.url?.split("?")[0]
        const handler = pathname ? aiRouteHandlers[pathname as keyof typeof aiRouteHandlers] : undefined
        if (!handler) {
          next()
          return
        }

        const chunks: Buffer[] = []
        request.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
        request.on("error", next)
        request.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8")
            request.body = body ? JSON.parse(body) : {}
          } catch {
            response.statusCode = 400
            response.setHeader("Content-Type", "application/json; charset=utf-8")
            response.end(JSON.stringify({ error: "Invalid request body" }))
            return
          }

          void handler(request, response)
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, ".", "")
  const workspaceEnv = loadEnv(mode, path.resolve(import.meta.dirname, ".."), "")
  for (const variableName of [
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL",
    "OPENAI_API_KEY",
    "VOICE_TTS_MODEL",
    "VOICE_TTS_VOICE",
  ]) {
    const apiKey =
      frontendEnv[variableName] ??
      workspaceEnv[variableName] ??
      process.env[variableName]

    if (apiKey) {
      process.env[variableName] = apiKey
    }
  }

  return {
    plugins: [react(), tailwindcss(), aiDevRoutes()],
    server: {
      proxy: {
        "/api/auth": "http://127.0.0.1:8787",
        "/api/profile": "http://127.0.0.1:8787",
        "/api/requests": "http://127.0.0.1:8787",
        "/api/public": "http://127.0.0.1:8787",
        "/api/payments": "http://127.0.0.1:8787",
        "/api/notifications": "http://127.0.0.1:8787",
        "/api/voice": "http://127.0.0.1:8787",
        "/api/health": "http://127.0.0.1:8787",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
