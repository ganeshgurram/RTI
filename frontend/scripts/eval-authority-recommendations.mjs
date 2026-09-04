/**
 * Evaluates the Public Authority recommender against the real directory.
 *
 *   npm run eval:authorities
 *
 * A case passes when any of the top three suggestions belongs to the expected authority
 * family. Cases expecting null must return nothing at all - those are questions about using
 * the portal, where suggesting a department would be noise.
 *
 * Add a case whenever a query comes back wrong. The point of this file is that a fix for one
 * subject cannot quietly break another, which hand-checking a few queries never caught.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const directory = readFileSync(
  path.join(frontendDir, "public", "data", "public-authorities.json"),
  "utf8"
)

// The service fetches the directory over HTTP in the browser; on Node we hand it the file.
globalThis.fetch = async () => ({ ok: true, json: async () => JSON.parse(directory) })

const { findAuthoritySuggestions } = await import(
  new URL("../src/services/authority-recommendations.ts", import.meta.url).href
)

/** [query, expected substring of the office name or its ministry; null means no suggestions] */
const cases = [
  // energy - these must stay apart, renewable and atomic are different ministries
  ["wind energy consumption in India", "Renewable"],
  ["solar panel subsidy scheme", "Renewable"],
  ["nuclear power plant safety records", "Atomic"],
  ["uranium stock records", "Atomic"],
  ["electricity power cut in my area", "Power"],
  // water
  ["river water division", "Water Resources"],
  ["my borewell has dried up", "Water"],
  ["ganga cleaning expenditure", "Water Resources"],
  ["my tap water is dirty", "Water"],
  // transport and travel
  ["train ticket refund not credited", "Railway"],
  ["passport application delay", "External Affairs"],
  ["national highway toll collection", "Road Transport"],
  ["airport security records", "Civil Aviation"],
  ["port shipping cargo records", "Ports"],
  // money
  ["income tax refund not received", "Income Tax"],
  ["I want to file an RTI about IPO", "Securities and Exchange Board"],
  ["gst registration records", "GST"],
  ["my provident fund withdrawal is stuck", "Labour"],
  ["I did not get my pension after retiring", "Pension"],
  ["msme loan for small business", "Micro"],
  ["export import licence", "Commerce"],
  ["company registration roc records", "Corporate"],
  // identity and communications
  ["aadhaar enrolment data", "Unique Identification"],
  ["mobile network tower permissions", "Telecommunication"],
  ["speed post parcel lost", "Post"],
  // education and health
  ["cbse exam evaluation records", "Education"],
  ["university grants for colleges", "Education"],
  ["hospital medicine stock", "Health"],
  ["ayurveda clinic registration", "Ayurveda"],
  // land, food and environment
  ["crop insurance for farmers", "Agriculture"],
  ["fertiliser subsidy records", "Fertilis"],
  ["fishery boat licence", "Fisheries"],
  ["air pollution from a factory", "Environment"],
  ["forest land clearance", "Environment"],
  ["ration card fair price shop", "Food"],
  ["food safety inspection of a restaurant", "Food Safety"],
  ["coal mine lease records", "Coal"],
  ["iron ore mining lease", "Mines"],
  ["lpg cylinder subsidy stopped", "Petroleum"],
  ["steel plant production data", "Steel"],
  // welfare and local government
  ["army pension for ex servicemen", "Defence"],
  ["anganwadi centre funds", "Women"],
  ["tribal welfare scheme funds", "Tribal"],
  ["disability certificate rules", "Disabilities"],
  ["pmay housing scheme list", "Housing"],
  ["mgnrega job card records", "Rural"],
  ["panchayat election records", "Panchayati"],
  ["cooperative society registration", "Cooperat"],
  ["police recruitment records", "Home Affairs"],
  // the rest
  ["isro satellite launch data", "Space"],
  ["weather forecast data", "Earth Sciences"],
  ["court case pendency data", "Justice"],
  ["skill development training centre", "Skill"],
  ["tourist visa arrivals data", "Tourism"],
  ["handloom weaver scheme", "Textiles"],
  ["sports stadium funds", "Youth"],
  ["doordarshan broadcast records", "Broadcasting"],
  // colloquial phrasing - leans on the vocabulary bridge, not official wording
  ["the air near my house is very polluted from a factory", "Environment"],
  ["my borewell water dried up, who do I ask", "Water"],
  ["my tap water is dirty and comes once a week", "Water"],
  ["my train ticket refund was never credited", "Railway"],
  ["streetlights and roads in my town are broken", "Road"],
  ["my LPG cylinder subsidy has stopped", "Petroleum"],
  ["my provident fund withdrawal is stuck", "Provident"],
  ["I want to know about my old age pension", "Pension"],
  ["the ration shop is not giving us wheat", "Food"],
  ["my child's school has no teachers", "Education"],
  // "scheme", "government" and "project" describe the request, not the office that holds it
  ["government education schemes", "Education"],
  ["central government scheme for farmers", "Agriculture"],
  ["details of the housing scheme project", "Housing"],
  ["government programme for tribal students", "Tribal"],
  // portal mechanics - suggesting a department here would be noise
  ["What is the RTI fee?", null],
  ["How do I file a First Appeal?", null],
  ["How can I check my status?", null],
  ["How long does a reply take?", null],
  ["Can I pay by UPI?", null],
  ["hello", null],
  ["thank you", null],
]

let passed = 0
const failures = []

for (const [query, expected] of cases) {
  const suggestions = await findAuthoritySuggestions(query)
  const haystack = suggestions.map((item) => `${item.authorityName} | ${item.ministryName ?? ""}`)

  const ok = expected === null
    ? suggestions.length === 0
    : haystack.some((entry) => entry.toLowerCase().includes(expected.toLowerCase()))

  if (ok) {
    passed += 1
  } else {
    failures.push({ query, expected, got: suggestions.map((item) => item.authorityName) })
  }
}

console.log(`\n${passed}/${cases.length} passed (${Math.round((passed / cases.length) * 100)}%)\n`)

for (const { query, expected, got } of failures) {
  console.log(`  "${query}"`)
  console.log(`    expected: ${expected === null ? "(no suggestions)" : expected}`)
  console.log(`    got     : ${got.length ? got.join(" / ") : "(none)"}\n`)
}

process.exit(failures.length ? 1 : 0)
