import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv, type Plugin } from "vite"

import rtiSahayakHandler from "./api/rti-sahayak.js"

type RtiSahayakRequest = IncomingMessage & {
  body?: unknown
}

function rtiSahayakDevRoute(): Plugin {
  return {
    name: "rti-sahayak-dev-route",
    configureServer(server) {
      server.middlewares.use((request: RtiSahayakRequest, response: ServerResponse, next) => {
        const pathname = request.url?.split("?")[0]
        if (pathname !== "/api/rti-sahayak") {
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

          void rtiSahayakHandler(request, response)
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, ".", "")
  const workspaceEnv = loadEnv(mode, path.resolve(import.meta.dirname, ".."), "")
  for (const variableName of ["OPENROUTER_API_KEY", "OPENAI_API_KEY"]) {
    const apiKey =
      process.env[variableName] ??
      frontendEnv[variableName] ??
      workspaceEnv[variableName]

    if (apiKey) {
      process.env[variableName] = apiKey
    }
  }

  return {
    plugins: [react(), tailwindcss(), rtiSahayakDevRoute()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})