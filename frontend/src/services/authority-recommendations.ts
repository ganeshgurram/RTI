export type AuthoritySuggestion = {
  authorityId: string
  authorityName: string
  ministryName?: string
  relatedOffices: string[]
  matchReason: string
}

type Authority = {
  id: string
  parentId: string
  level: number
  name: string
}

type DirectoryData = {
  authorities: Authority[]
}

const ministryNames: Record<string, string> = {
  "9": "Ministry of Agriculture & Farmers Welfare",
  "16": "Ministry of Chemicals & Fertilizers",
  "22": "Ministry of Commerce & Industry",
  "26": "Ministry of Communications",
  "30": "Ministry of Consumer Affairs, Food & Public Distribution",
  "33": "Ministry of Defence",
  "41": "Ministry of Finance",
  "46": "Ministry of Health & Family Welfare",
  "50": "Ministry of Heavy Industries & Public Enterprises",
  "65": "Ministry of Law & Justice",
  "74": "Ministry of Personnel, Public Grievances & Pensions",
  "87": "Ministry of Science & Technology",
}

const topicRules = [
  { pattern: /\b(passport|visa|consular|embassy|foreign affairs)\b/i, terms: ["passport", "visa", "consular", "external affairs"] },
  { pattern: /\b(income tax|pan|gst|customs|tax return)\b/i, terms: ["income tax", "goods and services tax", "customs", "revenue"] },
  { pattern: /\b(train|railway|railways|irctc)\b/i, terms: ["railway", "railways"] },
  { pattern: /\b(aadhaar|aadhar|uidai|digital identity)\b/i, terms: ["unique identification", "uidai", "electronics"] },
  { pattern: /\b(epfo|provident fund|labour|labor|employment)\b/i, terms: ["employees provident", "labour", "labor", "employment"] },
  { pattern: /\b(telecom|telephone|mobile network|sim card|broadband)\b/i, terms: ["telecommunications", "telecom", "communications"] },
  { pattern: /\b(river|water|watershed|irrigation|ganga|flood|dam|groundwater|ground water)\b/i, terms: ["water resources", "river development", "ganga rejuvenation", "central water commission", "river management board", "river board", "national water development", "ground water"] },
  { pattern: /\b(across\s+states|inter[-\s]?state|interstate|shared river)\b/i, terms: ["central water commission", "river management board", "water resources", "water disputes"] },
  { pattern: /\b(road|highway|toll|nhai|transport)\b/i, terms: ["national highways", "road transport", "highways", "transport"] },
  { pattern: /\b(bank|banking|rbi|financial service)\b/i, terms: ["reserve bank", "banking", "financial services"] },
  { pattern: /\b(school|college|university|cbse|ugc|education|exam)\b/i, terms: ["secondary education", "university grants", "education"] },
  { pattern: /\b(health|hospital|medicine|medical|drug)\b/i, terms: ["health", "medical", "drug", "food safety"] },
  { pattern: /\b(farmer|farmers|agriculture|crop|pm kisan)\b/i, terms: ["agriculture", "farmers", "icar"] },
  { pattern: /\b(environment|pollution|forest|wildlife|climate)\b/i, terms: ["environment", "forest", "climate", "pollution"] },
  { pattern: /\b(ration|pds|food grain|food grains|food corporation)\b/i, terms: ["food corporation", "consumer affairs", "public distribution"] },
  { pattern: /\b(electricity|electric|power)\b/i, terms: ["power", "electric"] },
  { pattern: /\b(defence|defense|army|navy|air force)\b/i, terms: ["defence", "defense", "army", "navy", "air force"] },
]

const stopWords = new Set([
  "about",
  "across",
  "application",
  "authority",
  "department",
  "directorate",
  "division",
  "file",
  "for",
  "help",
  "information",
  "ministry",
  "need",
  "office",
  "offices",
  "please",
  "problem",
  "request",
  "rti",
  "state",
  "states",
  "the",
  "to",
  "which",
  "with",
])

let directoryPromise: Promise<DirectoryData> | undefined

function loadDirectory() {
  directoryPromise ??= fetch("/data/public-authorities.json").then((response) => {
    if (!response.ok) {
      throw new Error("Unable to load Public Authorities")
    }

    return response.json() as Promise<DirectoryData>
  })

  return directoryPromise
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function getQueryTerms(query: string) {
  return normalize(query)
    .split(" ")
    .filter((term) => term.length >= 3 && !stopWords.has(term))
}

function getMinistryName(authority: Authority, authorityById: Map<string, Authority>) {
  const seen = new Set<string>()
  let current: Authority | undefined = authority
  let topLevelAuthority: Authority | undefined

  while (current.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId)
    const parent = authorityById.get(current.parentId)

    if (!parent) {
      return ministryNames[current.parentId] ?? topLevelAuthority?.name
    }

    topLevelAuthority = parent
    current = parent
  }

  return topLevelAuthority?.name
}

function getRelatedOffices(authority: Authority, childrenByParent: Map<string, Authority[]>) {
  const directOffices = childrenByParent.get(authority.id) ?? []
  if (directOffices.length) {
    return directOffices.slice(0, 3).map((office) => office.name)
  }

  return (childrenByParent.get(authority.parentId) ?? [])
    .filter((office) => office.id !== authority.id)
    .slice(0, 3)
    .map((office) => office.name)
}

export async function findAuthoritySuggestions(query: string): Promise<AuthoritySuggestion[]> {
  const rules = topicRules.filter((rule) => rule.pattern.test(query))
  const queryTerms = getQueryTerms(query)
  const directory = await loadDirectory()
  const authorityById = new Map(directory.authorities.map((authority) => [authority.id, authority]))
  const childrenByParent = new Map<string, Authority[]>()

  directory.authorities.forEach((authority) => {
    if (!authority.parentId) {
      return
    }

    const offices = childrenByParent.get(authority.parentId)
    if (offices) {
      offices.push(authority)
    } else {
      childrenByParent.set(authority.parentId, [authority])
    }
  })

  const matches = directory.authorities
    .map((authority) => {
      const name = normalize(authority.name)
      const ministryName = getMinistryName(authority, authorityById)
      const haystack = normalize([authority.name, ministryName].filter(Boolean).join(" "))
      const matchedTerms = new Set<string>()
      let score = 0

      queryTerms.forEach((term) => {
        if (haystack.includes(term)) {
          score += term.length >= 6 ? 16 : 8
          matchedTerms.add(term)
        }
      })

      rules.forEach((rule) => {
        rule.terms.forEach((term) => {
          if (haystack.includes(normalize(term))) {
            score += 40
            matchedTerms.add(term)
          }
        })
      })

      if (name === normalize(query)) {
        score += 80
      }

      return { authority, ministryName, matchedTerms: [...matchedTerms], score }
    })
    .filter((match) => match.score >= 16)
    .sort((left, right) => right.score - left.score)

  const usedGroups = new Set<string>()
  const suggestions: AuthoritySuggestion[] = []

  matches.forEach((match) => {
    if (suggestions.length === 3) {
      return
    }

    const groupId = match.authority.parentId || match.authority.id
    if (usedGroups.has(groupId)) {
      return
    }

    usedGroups.add(groupId)
    suggestions.push({
      authorityId: match.authority.id,
      authorityName: match.authority.name,
      ministryName: match.ministryName,
      relatedOffices: getRelatedOffices(match.authority, childrenByParent),
      matchReason: match.matchedTerms.slice(0, 2).join(", "),
    })
  })

  return suggestions
}