/**
 * Checks that every translation key the UI asks for actually exists, in every language.
 *
 *   npm run check:i18n
 *
 * A missing key is invisible in review and nearly invisible in the browser: i18next falls back to
 * echoing the key itself, so a tooltip quietly renders "home.lifecycle.nodes.transfer" instead of a
 * sentence, and only in the one state that reveals it. Hovering each element to look for that is
 * not a test, so this asserts three things instead:
 *
 *   1. English and Hindi describe exactly the same set of keys.
 *   2. Every literal key passed to t() resolves in both.
 *   3. Every interpolated key - t(`home.actions.${key}.title`) - resolves for at least one value,
 *      and resolves for the same set of values in both languages. This is the case that bites,
 *      because the key is assembled at runtime and no editor can follow it.
 */
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const i18nFile = path.join(frontendDir, "src", "i18n.tsx")

/**
 * The resources are a plain object literal in a .tsx file, which the type stripper cannot import
 * because of the JSX elsewhere in the module. Slicing the literal out by brace balance and
 * evaluating it keeps this script reading the same declaration the app ships, rather than a copy.
 */
function readResources() {
  const source = readFileSync(i18nFile, "utf8")
  const declaration = "const resources = "
  const start = source.indexOf(declaration)

  if (start < 0) {
    throw new Error(`${i18nFile} no longer declares ${declaration.trim()}`)
  }

  let depth = 0
  let end = -1

  for (let index = start + declaration.length; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1
    } else if (source[index] === "}") {
      depth -= 1

      if (depth === 0) {
        end = index + 1
        break
      }
    }
  }

  if (end < 0) {
    throw new Error(`${i18nFile}: could not find the end of the resources object`)
  }

  return new Function(`return (${source.slice(start + declaration.length, end)})`)()
}

/** Every leaf path in one language, as "a.b.c" strings. */
function flatten(value, prefix = "") {
  if (typeof value === "string") {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return sourceFiles(full)
    }

    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const resources = readResources()
const languages = Object.keys(resources)
const keysByLanguage = Object.fromEntries(
  languages.map((language) => [language, new Set(flatten(resources[language].translation))]),
)

/**
 * A counted key is stored per plural category - "authorities.officeCount_one" and "_other" - and
 * the call site asks for the bare stem, so a stem is resolved by any one of its categories.
 */
const pluralSuffixes = ["zero", "one", "two", "few", "many", "other"]

function resolves(language, key) {
  return (
    keysByLanguage[language].has(key) ||
    pluralSuffixes.some((suffix) => keysByLanguage[language].has(`${key}_${suffix}`))
  )
}

const failures = []

// 1. The languages must agree on which keys exist.
const [reference, ...others] = languages

for (const language of others) {
  for (const key of keysByLanguage[reference]) {
    if (!keysByLanguage[language].has(key)) {
      failures.push(`missing in ${language}: ${key}`)
    }
  }

  for (const key of keysByLanguage[language]) {
    if (!keysByLanguage[reference].has(key)) {
      failures.push(`missing in ${reference}: ${key}`)
    }
  }
}

// 2 and 3. Every key a t() call asks for must resolve.
const callPattern = /\bt\(\s*(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g
const usages = new Map()

for (const file of sourceFiles(path.join(frontendDir, "src"))) {
  const source = readFileSync(file, "utf8")

  for (const [, , key] of source.matchAll(callPattern)) {
    // Keys are dotted paths; anything else is an ordinary string that happens to reach a t() call.
    if (!key.includes(".")) {
      continue
    }

    if (!usages.has(key)) {
      usages.set(key, path.relative(frontendDir, file))
    }
  }
}

for (const [key, file] of usages) {
  if (!key.includes("${")) {
    for (const language of languages) {
      if (!resolves(language, key)) {
        failures.push(`${file}: t("${key}") has no ${language} translation`)
      }
    }

    continue
  }

  // An interpolated key becomes a pattern: each ${...} stands for exactly one path segment.
  const pattern = new RegExp(
    `^${key
      .split(/\$\{[^}]*\}/)
      .map((literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[^.]+")}$`,
  )
  const matchesByLanguage = Object.fromEntries(
    languages.map((language) => [language, [...keysByLanguage[language]].filter((candidate) => pattern.test(candidate)).sort()]),
  )

  for (const language of languages) {
    if (matchesByLanguage[language].length === 0) {
      failures.push(`${file}: t(\`${key}\`) matches no ${language} translation`)
    }
  }

  for (const language of others) {
    if (matchesByLanguage[language].join("|") !== matchesByLanguage[reference].join("|")) {
      failures.push(`${file}: t(\`${key}\`) resolves to different keys in ${reference} and ${language}`)
    }
  }
}

const checked = usages.size
const total = keysByLanguage[reference].size

if (failures.length > 0) {
  console.error(`Translation check failed (${failures.length} problem${failures.length === 1 ? "" : "s"}):\n`)

  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }

  process.exit(1)
}

console.log(`Translations OK: ${total} keys x ${languages.length} languages (${languages.join(", ")}), ${checked} t() call sites resolved.`)
