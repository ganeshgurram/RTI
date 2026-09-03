import { useState } from "react"

type DraftValues = Record<string, string>

type UseFormDraftOptions = {
  /** Captchas and files are intentionally never persisted. */
  exclude?: string[]
}

function readDraft(storageKey: string): DraftValues {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return {}

    const parsed = JSON.parse(stored) as { values?: unknown }
    if (!parsed.values || typeof parsed.values !== "object" || Array.isArray(parsed.values)) return {}

    return Object.fromEntries(Object.entries(parsed.values).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
  } catch {
    return {}
  }
}

/**
 * Keeps a form's ordinary text/select/radio values on this device. It is deliberately a small
 * browser-only layer: attachment bytes and security codes must never be placed in localStorage.
 */
export function useFormDraft(storageKey: string, { exclude = [] }: UseFormDraftOptions = {}) {
  const [values, setValues] = useState<DraftValues>(() => readDraft(storageKey))
  const [wasRestored, setWasRestored] = useState(() => Object.keys(readDraft(storageKey)).length > 0)
  const [saveState, setSaveState] = useState<"idle" | "saved" | "saving">("idle")
  const excluded = new Set(exclude)

  const save = (form: HTMLFormElement | null) => {
    if (!form) return

    const nextValues = Object.fromEntries(
      Array.from(new FormData(form).entries())
        .filter(([name, value]) => !excluded.has(name) && typeof value === "string")
        .map(([name, value]) => [name, String(value)]),
    )

    if (!Object.keys(nextValues).length) return

    setValues(nextValues)
    setSaveState("saving")
    try {
      localStorage.setItem(storageKey, JSON.stringify({ values: nextValues }))
    } catch {
      // A private browser can deny storage; the current form still behaves normally.
    }
    setSaveState("saved")
  }

  const clear = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Keep the UI reset even if this browser refuses storage access.
    }
    setValues({})
    setWasRestored(false)
    setSaveState("idle")
  }

  return {
    clear,
    hasDraft: Object.keys(values).length > 0,
    wasRestored,
    save,
    saveState,
    value: (name: string, fallback?: string) => values[name] ?? fallback,
    values,
  }
}
