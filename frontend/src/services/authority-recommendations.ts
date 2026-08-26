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

/**
 * Ministries that own departments in this directory but have no row of their own. Naming them
 * keeps sibling departments in one group, matching the Public Authorities page.
 */
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

/**
 * Everyday words mapped to the vocabulary the directory actually uses. This is deliberately a
 * vocabulary bridge and not a routing table: it only adds search terms, and the directory's own
 * hierarchy decides which office wins. A wrong entry here can widen a search, never send an
 * applicant to an unrelated ministry.
 *
 * Only colloquial words need an entry. Anything already written the official way - "railway",
 * "passport", "textiles", "coal" - matches on its own and must not be listed.
 */
const vocabulary: Record<string, string[]> = {
  aadhaar: ["unique", "identification", "electronic"],
  aadhar: ["unique", "identification", "electronic"],
  adivasi: ["tribal"],
  airplane: ["aviation", "airport"],
  airline: ["aviation", "airport"],
  ambulance: ["health", "medical"],
  anganwadi: ["child", "women"],
  atm: ["bank", "financial"],
  bike: ["transport", "vehicle"],
  bill: ["power", "electricity"],
  borewell: ["ground", "water"],
  bribe: ["vigilance", "grievance"],
  bus: ["transport"],
  canal: ["water", "irrigation"],
  cbse: ["secondary", "education", "school"],
  cheque: ["bank", "financial"],
  cinema: ["film", "broadcasting"],
  clinic: ["health", "medical"],
  cooperative: ["cooperation", "cooperative"],
  court: ["justice", "judicial", "legal"],
  crop: ["agriculture", "farmer"],
  cylinder: ["petroleum", "gas"],
  dam: ["water", "river"],
  diesel: ["petroleum"],
  doctor: ["health", "medical"],
  drinking: ["drinking", "water"],
  electricity: ["power", "electricity"],
  epfo: ["provident", "fund", "employee"],
  exam: ["education", "examination"],
  factory: ["industrial", "industry"],
  farmer: ["agriculture", "farmer"],
  flight: ["aviation", "airport"],
  flood: ["water", "river"],
  ganga: ["ganga", "river", "water"],
  gas: ["petroleum", "gas"],
  gratuity: ["provident", "fund", "labour"],
  hospital: ["health", "medical"],
  irctc: ["railway"],
  kisan: ["agriculture", "farmer"],
  land: ["land", "resource"],
  loan: ["bank", "financial"],
  lpg: ["petroleum", "gas"],
  mandi: ["agriculture", "market"],
  medicine: ["health", "pharmaceutical", "drug"],
  mgnrega: ["rural", "employment"],
  mining: ["mine", "mineral"],
  mobile: ["telecommunication", "telecom"],
  nrega: ["rural", "employment"],
  nuclear: ["atomic"],
  otp: ["electronic"],
  passport: ["passport", "consular", "external"],
  pension: ["pension"],
  petrol: ["petroleum"],
  pf: ["provident", "fund"],
  pollution: ["pollution", "environment"],
  polluted: ["pollution", "environment"],
  polluting: ["pollution", "environment"],
  postal: ["post"],
  ration: ["food", "distribution", "consumer"],
  refinery: ["petroleum"],
  retire: ["pension"],
  retired: ["pension"],
  retirement: ["pension"],
  river: ["river", "water"],
  road: ["road", "highway"],
  scholarship: ["education"],
  school: ["school", "education"],
  sewage: ["sanitation"],
  sim: ["telecommunication", "telecom"],
  solar: ["solar", "renewable"],
  streetlight: ["power", "electricity"],
  student: ["education"],
  subsidy: ["subsidy", "scheme"],
  tap: ["drinking", "water"],
  teacher: ["education", "school"],
  ticket: ["railway"],
  toilet: ["sanitation"],
  toll: ["highway", "road"],
  tourist: ["tourism"],
  train: ["railway"],
  tubewell: ["ground", "water"],
  turbine: ["renewable", "power"],
  university: ["university", "education", "higher"],
  uranium: ["atomic", "mineral"],
  visa: ["visa", "consular", "external"],
  wildlife: ["wildlife", "forest", "environment"],
  wind: ["wind", "renewable"],
  windmill: ["wind", "renewable"],
  worker: ["labour", "employment"],
}

/** Multi-word everyday phrases, checked against the whole query before tokenising. */
const phraseVocabulary: Record<string, string[]> = {
  "air quality": ["pollution", "environment"],
  "bank account": ["bank", "financial"],
  "driving licence": ["transport", "vehicle"],
  "driving license": ["transport", "vehicle"],
  "fair price shop": ["food", "distribution"],
  "first appeal": [],
  "food grain": ["food", "distribution"],
  "gas cylinder": ["petroleum", "gas"],
  "ground water": ["ground", "water"],
  "health insurance": ["health"],
  "income tax": ["income", "tax", "revenue"],
  "installed capacity": ["power", "electricity"],
  "job card": ["rural", "employment"],
  "minimum wage": ["labour", "employment"],
  "power cut": ["power", "electricity"],
  "provident fund": ["provident", "fund", "employee"],
  "public distribution": ["food", "distribution"],
  "ration card": ["food", "distribution", "consumer"],
  "self help group": ["rural", "women"],
  "small business": ["micro", "small", "medium", "enterprise"],
  "solar panel": ["solar", "renewable"],
  "water supply": ["drinking", "water"],
  "wind energy": ["wind", "renewable"],
}

/**
 * Words that say nothing about which office is meant. Two kinds live here: ordinary English
 * filler, and the vocabulary of RTI requests themselves - every applicant asks for "records",
 * "data" or a "copy", so those words match hundreds of unrelated names and route nothing.
 * Leaving them in let "National Crime Record Bureau" win queries about school exams.
 */
const stopWords = new Set([
  "about", "across", "after", "against", "all", "and", "any", "application", "apply", "are",
  "authority", "avail", "can", "concerned", "department", "details", "directorate", "division",
  "does", "file", "filing", "for", "from", "get", "give", "government", "handle", "handles",
  "has", "have", "help", "how", "india", "indian", "information", "issue", "know", "like",
  "ministry", "much", "must", "my", "need", "office", "official", "regarding", "related",
  "please", "problem", "query", "question", "raise", "request", "rti", "seek", "should", "some",
  "submit", "tell", "that", "the", "their", "there", "they", "this", "under", "want", "was",
  "what", "when", "where", "which", "who", "whom", "why", "will", "with", "would", "you", "your",
  // The words an RTI request is made of. Rarity in the directory does not make these
  // meaningful: "scheme" appears in only 7 of 2907 names, so its IDF is enormous, and leaving
  // it in made "government education schemes" return the National Service Scheme and the
  // Central Herd Registration Scheme. These describe what is wanted, not who holds it.
  "acknowledgement", "amount", "annual", "copy", "data", "date", "document", "fee", "figure",
  "form", "government", "kindly", "list", "name", "number", "paid", "pay", "payment",
  "programme", "project", "provide", "receipt", "record", "report", "scheme", "statement",
  "status", "total", "upi", "year",
])

const MAX_SUGGESTIONS = 3
/** BM25 tuning. B is low because names are short and length varies wildly. */
const K1 = 1.4
const B = 0.5
/** How much the ministry's overall topic match counts versus the office's own name. */
const GROUP_WEIGHT = 1.6
const OFFICE_WEIGHT = 1
/**
 * Near full weight on purpose. A vocabulary hit means the subject was recognised, which is
 * stronger evidence than a bare word that merely happens to appear in some office name - "air"
 * matching the Air Force must not outrank "polluted" reaching Environment.
 */
const EXPANSION_WEIGHT = 0.95
/**
 * Morphology bridge. When a word appears nowhere in the directory, words sharing a long prefix
 * usually are the official form - "panchayat" reaching "panchayati", "cooperative" reaching
 * "cooperation". Only unmatched words expand, so common words are untouched.
 */
const PREFIX_LENGTH = 5
const PREFIX_WEIGHT = 0.55
const MAX_PREFIX_EXPANSIONS = 4
/**
 * A ministry matches either by its overall subject or by containing one office that fits
 * exactly. Without the second term a small specialised body - Food Safety inside the huge
 * Health group - is drowned out by its thousands of unrelated siblings.
 */
const GROUP_BEST_OFFICE_WEIGHT = 1.35
/** Only offices inside a convincingly matching ministry are considered at all. */
const GROUP_GATE_RATIO = 0.34
const MAX_GROUPS_CONSIDERED = 4
/** Ministries and apex bodies answer a general question better than a branch office. */
const ROOT_BONUS = 2.2
const APEX_PATTERN = /^(?:ministry|department|central|national|directorate\s?general)\b/i
const APEX_BONUS = 1.1
/** Research and training bodies hold studies; the administering office holds the records. */
const SUPPORT_BODY_PATTERN = /\b(?:research|institute|laborator\w*|training|academy|museum|society)\b/i
const SUPPORT_BODY_PENALTY = 1.4
/**
 * Territory offices answer only for their own territory, so a national question skips them.
 * Applied as a multiplier: a fixed subtraction would be meaningless against a strong match and
 * annihilating against a weak one, since scores are unbounded.
 */
const TERRITORY_PATTERN = /^UT\b/i
const TERRITORY_QUERY_PATTERN = /\b(?:ut|chandigarh|andaman|nicobar|puducherry|lakshadweep|daman|diu|dadra|ladakh)\b/i
const TERRITORY_MULTIPLIER = 0.3
/** Below this share of the best match, a result is noise however many slots remain. */
const RELATIVE_FLOOR = 0.5
const ABSOLUTE_FLOOR = 3.5

type QueryTerm = {
  token: string
  weight: number
}

type Group = {
  id: string
  name: string
  isTerritory: boolean
  termFrequency: Map<string, number>
  length: number
}

type Office = {
  authority: Authority
  groupId: string
  ministryName?: string
  termFrequency: Map<string, number>
  length: number
}

type DirectoryIndex = {
  offices: Office[]
  groups: Map<string, Group>
  groupIdf: Map<string, number>
  officeIdf: Map<string, number>
  /** First few letters of every word in the directory, for the morphology bridge. */
  prefixes: Map<string, string[]>
  averageGroupLength: number
  averageOfficeLength: number
  childrenByParent: Map<string, Authority[]>
}

let indexPromise: Promise<DirectoryIndex> | undefined

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

/**
 * Plural folding only. Aggressive stemming would collapse unrelated words in a directory this
 * dense ("mining" and "mine" reduce differently), so irregular forms live in the vocabulary.
 */
function singularize(token: string) {
  if (token.length <= 3) {
    return token
  }

  if (token.endsWith("ies") && token.length > 4) {
    return token.slice(0, -3) + "y"
  }

  if (/(?:ses|xes|zes|ches|shes)$/.test(token)) {
    return token.slice(0, -2)
  }

  if (token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1)
  }

  return token
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 3)
    .map(singularize)
}

function countTerms(tokens: string[]) {
  const termFrequency = new Map<string, number>()

  tokens.forEach((token) => {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1)
  })

  return termFrequency
}

function bm25(termFrequency: number, documentLength: number, averageLength: number, idf: number) {
  if (!termFrequency) {
    return 0
  }

  return (idf * termFrequency * (K1 + 1)) /
    (termFrequency + K1 * (1 - B + (B * documentLength) / Math.max(averageLength, 1)))
}

function inverseDocumentFrequency(documentFrequency: number, documentCount: number) {
  return Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5))
}

/** Walks to the highest ancestor, reuniting departments under a ministry absent from the data. */
function resolveGroup(authority: Authority, authorityById: Map<string, Authority>) {
  const seen = new Set<string>()
  let current = authority

  while (current.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId)
    const parent = authorityById.get(current.parentId)

    if (!parent) {
      const ministryName = ministryNames[current.parentId]
      return ministryName
        ? { id: "ministry-" + current.parentId, name: ministryName }
        : { id: current.id, name: current.name }
    }

    current = parent
  }

  return { id: current.id, name: current.name }
}

function buildIndex(directory: DirectoryData): DirectoryIndex {
  const authorities = directory.authorities
  const authorityById = new Map(authorities.map((authority) => [authority.id, authority]))
  const childrenByParent = new Map<string, Authority[]>()

  authorities.forEach((authority) => {
    if (!authority.parentId) {
      return
    }

    const siblings = childrenByParent.get(authority.parentId)
    if (siblings) {
      siblings.push(authority)
    } else {
      childrenByParent.set(authority.parentId, [authority])
    }
  })

  const groups = new Map<string, Group>()
  const groupTokens = new Map<string, string[]>()

  // A ministry's topic is whatever its whole subtree talks about. Reading it off the tree is
  // what removes the need to hand-write "wind energy lives in New & Renewable Energy".
  const offices = authorities.map((authority) => {
    const group = resolveGroup(authority, authorityById)
    const tokens = tokenize(authority.name)
    const collected = groupTokens.get(group.id)

    if (collected) {
      collected.push(...tokens)
    } else {
      groupTokens.set(group.id, [...tokens])
      groups.set(group.id, {
        id: group.id,
        name: group.name,
        isTerritory: TERRITORY_PATTERN.test(group.name),
        termFrequency: new Map(),
        length: 0,
      })
    }

    return {
      authority,
      groupId: group.id,
      ministryName: group.id === authority.id ? undefined : group.name,
      termFrequency: countTerms(tokens),
      length: tokens.length,
    }
  })

  const groupDocumentFrequency = new Map<string, number>()
  groupTokens.forEach((tokens, groupId) => {
    const group = groups.get(groupId)
    if (!group) {
      return
    }

    group.termFrequency = countTerms(tokens)
    group.length = tokens.length
    group.termFrequency.forEach((_count, token) => {
      groupDocumentFrequency.set(token, (groupDocumentFrequency.get(token) ?? 0) + 1)
    })
  })

  const officeDocumentFrequency = new Map<string, number>()
  offices.forEach((office) => {
    office.termFrequency.forEach((_count, token) => {
      officeDocumentFrequency.set(token, (officeDocumentFrequency.get(token) ?? 0) + 1)
    })
  })

  const groupIdf = new Map<string, number>()
  groupDocumentFrequency.forEach((frequency, token) => {
    groupIdf.set(token, inverseDocumentFrequency(frequency, groups.size))
  })

  const officeIdf = new Map<string, number>()
  officeDocumentFrequency.forEach((frequency, token) => {
    officeIdf.set(token, inverseDocumentFrequency(frequency, offices.length))
  })

  const prefixes = new Map<string, string[]>()
  officeDocumentFrequency.forEach((_frequency, token) => {
    if (token.length < PREFIX_LENGTH) {
      return
    }

    const prefix = token.slice(0, PREFIX_LENGTH)
    const bucket = prefixes.get(prefix)
    if (bucket) {
      bucket.push(token)
    } else {
      prefixes.set(prefix, [token])
    }
  })

  const totalGroupLength = [...groups.values()].reduce((total, group) => total + group.length, 0)
  const totalOfficeLength = offices.reduce((total, office) => total + office.length, 0)

  return {
    offices,
    groups,
    groupIdf,
    officeIdf,
    prefixes,
    averageGroupLength: totalGroupLength / Math.max(groups.size, 1),
    averageOfficeLength: totalOfficeLength / Math.max(offices.length, 1),
    childrenByParent,
  }
}

function loadIndex() {
  indexPromise ??= fetch("/data/public-authorities.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load Public Authorities")
      }

      return response.json() as Promise<DirectoryData>
    })
    .then(buildIndex)

  return indexPromise
}

/** The words the applicant used, once stop words are removed. */
function getOwnTokens(query: string) {
  return normalize(query)
    .split(" ")
    .filter(Boolean)
    .map(singularize)
    .filter((token) => token.length >= 3 && !stopWords.has(token))
}

/** The applicant's own words at full weight, plus official vocabulary they did not use. */
function buildQueryTerms(query: string, index: DirectoryIndex): QueryTerm[] {
  const normalizedQuery = normalize(query)
  const weights = new Map<string, number>()

  const add = (rawToken: string, weight: number) => {
    const token = singularize(rawToken)
    if (token.length < 3 || stopWords.has(token)) {
      return
    }

    weights.set(token, Math.max(weights.get(token) ?? 0, weight))
  }

  const ownTokens = getOwnTokens(query)
  ownTokens.forEach((token) => add(token, 1))

  ownTokens.forEach((token) => {
    const expansions = vocabulary[token]
    expansions?.forEach((expansion) => add(expansion, EXPANSION_WEIGHT))
  })

  Object.entries(phraseVocabulary).forEach(([phrase, expansions]) => {
    if (normalizedQuery.includes(phrase)) {
      expansions.forEach((expansion) => add(expansion, EXPANSION_WEIGHT))
    }
  })

  // Only words the directory has never seen are bridged, so ordinary words are left alone.
  ownTokens.forEach((token) => {
    if (token.length < PREFIX_LENGTH || index.officeIdf.has(token)) {
      return
    }

    const candidates = index.prefixes.get(token.slice(0, PREFIX_LENGTH)) ?? []
    candidates.slice(0, MAX_PREFIX_EXPANSIONS).forEach((candidate) => add(candidate, PREFIX_WEIGHT))
  })

  return [...weights].map(([token, weight]) => ({ token, weight }))
}

function scoreGroup(group: Group, terms: QueryTerm[], index: DirectoryIndex) {
  return terms.reduce((total, term) => {
    const idf = index.groupIdf.get(term.token)
    if (idf === undefined) {
      return total
    }

    const frequency = group.termFrequency.get(term.token) ?? 0
    return total + term.weight * bm25(frequency, group.length, index.averageGroupLength, idf)
  }, 0)
}

function scoreOffice(office: Office, terms: QueryTerm[], index: DirectoryIndex) {
  return terms.reduce((total, term) => {
    const idf = index.officeIdf.get(term.token)
    if (idf === undefined) {
      return total
    }

    const frequency = office.termFrequency.get(term.token) ?? 0
    return total + term.weight * bm25(frequency, office.length, index.averageOfficeLength, idf)
  }, 0)
}

/**
 * Branch offices repeat one name with a location appended - fifty "…Labour Court, <city>" rows.
 * Collapsing them to a shared signature stops three branches of one office filling every slot
 * and pushing out genuinely different authorities.
 */
function getNameSignature(name: string) {
  return normalize(name.replace(/\(.*?\)/g, "").split(",")[0])
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
  // Cheap check first, so a greeting never pays for loading the directory.
  if (!getOwnTokens(query).length) {
    return []
  }

  const index = await loadIndex()
  const terms = buildQueryTerms(query, index)

  if (!terms.length) {
    return []
  }

  const wantsSupportBody = SUPPORT_BODY_PATTERN.test(query)
  const wantsTerritory = TERRITORY_QUERY_PATTERN.test(query)

  const officeScores = new Map<string, number>()
  const bestOfficeByGroup = new Map<string, number>()

  index.offices.forEach((office) => {
    const score = scoreOffice(office, terms, index)
    officeScores.set(office.authority.id, score)

    if (score > (bestOfficeByGroup.get(office.groupId) ?? 0)) {
      bestOfficeByGroup.set(office.groupId, score)
    }
  })

  // Stage one: which ministry is this about? Scoring the whole subtree as one document means a
  // ministry wins on its overall subject, not on one office name happening to share a word.
  // Its single best-fitting office counts too, so a small specialised body still lifts it.
  const rankedGroups = [...index.groups.values()]
    .map((group) => {
      let score = scoreGroup(group, terms, index) +
        GROUP_BEST_OFFICE_WEIGHT * (bestOfficeByGroup.get(group.id) ?? 0)

      if (group.isTerritory && !wantsTerritory) {
        score *= TERRITORY_MULTIPLIER
      }

      return { group, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)

  if (!rankedGroups.length) {
    return []
  }

  const groupGate = rankedGroups[0].score * GROUP_GATE_RATIO
  const selectedGroups = new Map(
    rankedGroups
      .filter((entry) => entry.score >= groupGate)
      .slice(0, MAX_GROUPS_CONSIDERED)
      .map((entry) => [entry.group.id, entry.score])
  )

  // Stage two: rank offices, but only inside those ministries. An office in an unrelated
  // ministry cannot surface no matter how its name reads.
  const ranked = index.offices
    .filter((office) => selectedGroups.has(office.groupId))
    .map((office) => {
      const groupScore = selectedGroups.get(office.groupId) ?? 0
      const normalizedGroupScore = groupScore / rankedGroups[0].score
      let score =
        GROUP_WEIGHT * normalizedGroupScore * 4 +
        OFFICE_WEIGHT * (officeScores.get(office.authority.id) ?? 0)

      if (!office.authority.parentId) {
        score += ROOT_BONUS
      }

      if (APEX_PATTERN.test(office.authority.name)) {
        score += APEX_BONUS
      }

      if (!wantsSupportBody && SUPPORT_BODY_PATTERN.test(office.authority.name)) {
        score -= SUPPORT_BODY_PENALTY
      }

      return { office, score }
    })
    .sort((left, right) => right.score - left.score)

  if (!ranked.length) {
    return []
  }

  const cutoff = Math.max(ranked[0].score * RELATIVE_FLOOR, ABSOLUTE_FLOOR)
  // Only the winning ministry. Lower-ranked groups clear the gate to widen the office search,
  // but naming them would tell the applicant their question is about a department it is not.
  const reason = rankedGroups[0].group.name

  const seenSignatures = new Set<string>()
  const chosen = ranked.filter((entry) => {
    if (entry.score < cutoff || seenSignatures.size >= MAX_SUGGESTIONS) {
      return false
    }

    const signature = getNameSignature(entry.office.authority.name)
    if (seenSignatures.has(signature)) {
      return false
    }

    seenSignatures.add(signature)
    return true
  })

  return chosen
    .map(({ office }) => ({
      authorityId: office.authority.id,
      authorityName: office.authority.name,
      ministryName: office.ministryName,
      relatedOffices: getRelatedOffices(office.authority, index.childrenByParent),
      matchReason: reason,
    }))
}
