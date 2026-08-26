import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MaterialIcon } from "@/routes/stitch-shell"

type Authority = {
  id: string
  parentId: string
  level: number
  name: string
}

type DirectoryData = {
  sourceUrl: string
  authorities: Authority[]
}

type Group = {
  id: string
  name: string
  initial: string
  /** null for a ministry we reconstructed: you file to its departments, not to it. */
  filable: Authority | null
  entries: Authority[]
  members: Authority[]
}

type Match = {
  authority: Authority
  group: Group
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const groupPageSize = 12
const matchPageSize = 20

// The portal list (allpa.php) contains only authorities an RTI can actually be filed
// against, so the ministries these departments belong to never appear as rows - they are
// referenced by parentId and nothing else. Naming them here keeps sibling departments
// together instead of scattering them through the D's. A ministry is not a filing target.
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

/** "Ministry of Railways" -> "Railways", so A-Z buckets on the word people actually look for. */
function significantName(name: string) {
  return name.replace(/^(?:the\s+)?(?:ministry|departments?|deptt?|ut)\s+of\s+/i, "").trim() || name
}

function initialOf(name: string) {
  const match = significantName(name).match(/[A-Za-z0-9]/)
  return match ? match[0].toUpperCase() : "#"
}

function Highlight({ query, text }: { query: string; text: string }) {
  const index = query ? text.toLocaleLowerCase().indexOf(query) : -1
  if (index < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary-fixed px-0.5 font-semibold text-primary">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

function OfficeCard({ authority, childrenByParent, query }: { authority: Authority; childrenByParent: Map<string, Authority[]>; query: string }) {
  const nested = childrenByParent.get(authority.id) ?? []

  return (
    <li className="flex flex-col justify-between rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <MaterialIcon className="text-base!">corporate_fare</MaterialIcon>
          </div>
          <p className="min-w-0 break-words text-sm font-medium leading-5 text-on-surface"><Highlight query={query} text={authority.name} /></p>
        </div>
        {nested.length ? (
          <ul className="mt-3 space-y-1.5 border-l-2 border-outline-variant pl-3">
            {nested.map((child) => (
              <li className="flex items-start justify-between gap-2" key={child.id}>
                <span className="min-w-0 break-words text-xs leading-4 text-on-surface-variant"><Highlight query={query} text={child.name} /></span>
                <Link className="shrink-0 text-xs font-medium text-primary hover:underline" to="/login">File</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Link className="mt-4 inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" to="/login">
        File RTI
      </Link>
    </li>
  )
}

function EntrySection({
  childrenByParent,
  entry,
  offices,
  query,
}: {
  childrenByParent: Map<string, Authority[]>
  entry: Authority
  offices: Authority[]
  query: string
}) {
  const total = (childrenByParent.get(entry.id) ?? []).length

  return (
    <section>
      <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary-fixed/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <MaterialIcon className="text-base!">account_balance</MaterialIcon>
          </div>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold leading-5 text-primary"><Highlight query={query} text={entry.name} /></p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {total
                ? `${offices.length === total ? total : `${offices.length} of ${total}`} office${total === 1 ? "" : "s"} shown below`
                : "You can file an RTI to this office"}
            </p>
          </div>
        </div>
        <Link className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" to="/login">
          File RTI
        </Link>
      </div>
      {offices.length ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {offices.map((office) => <OfficeCard authority={office} childrenByParent={childrenByParent} key={office.id} query={query} />)}
        </ul>
      ) : null}
    </section>
  )
}

function StepCard({ children, icon, step, title }: { children: ReactNode; icon: string; step: number; title: string }) {
  return (
    <li className="flex gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <MaterialIcon className="text-lg!">{icon}</MaterialIcon>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">Step {step} &middot; {title}</p>
        <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{children}</p>
      </div>
    </li>
  )
}

export function PublicAuthoritiesPage() {
  const [directory, setDirectory] = useState<DirectoryData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState("az")
  const [search, setSearch] = useState("")
  const [insideSearch, setInsideSearch] = useState("")
  const [lastGroupId, setLastGroupId] = useState<string | null>(null)
  const [letter, setLetter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isCompactPagination, setIsCompactPagination] = useState(() => window.innerWidth < 640)
  const selectedGroupId = searchParams.get("group")

  useEffect(() => {
    let isCurrent = true

    void fetch("/data/public-authorities.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load the directory")
        return response.json() as Promise<DirectoryData>
      })
      .then((data) => {
        if (isCurrent) setDirectory(data)
      })
      .catch(() => {
        if (isCurrent) setLoadError(true)
      })

    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    const updatePaginationMode = () => setIsCompactPagination(window.innerWidth < 640)

    updatePaginationMode()
    window.addEventListener("resize", updatePaginationMode)
    return () => window.removeEventListener("resize", updatePaginationMode)
  }, [])

  // Opening a different group starts its own "find inside" box empty.
  if (lastGroupId !== selectedGroupId) {
    setLastGroupId(selectedGroupId)
    setInsideSearch("")
  }

  const { childrenByParent, groups } = useMemo(() => {
    const authorities = directory?.authorities ?? []
    const authorityById = new Map(authorities.map((authority) => [authority.id, authority]))
    const children = new Map<string, Authority[]>()

    authorities.forEach((authority) => {
      if (!authority.parentId) return
      const siblings = children.get(authority.parentId)
      if (siblings) siblings.push(authority)
      else children.set(authority.parentId, [authority])
    })

    const subtreeOf = (root: Authority) => {
      const collected: Authority[] = []
      const seen = new Set<string>()
      const stack = [root]

      while (stack.length) {
        const current = stack.pop()
        if (!current || seen.has(current.id)) continue
        seen.add(current.id)
        collected.push(current)
        stack.push(...(children.get(current.id) ?? []))
      }

      return collected
    }

    // A root is anything whose parent is absent from the dataset.
    const roots = authorities.filter((authority) => !authority.parentId || !authorityById.has(authority.parentId))
    const byMissingParent = new Map<string, Authority[]>()

    roots.forEach((root) => {
      if (!root.parentId) return
      const siblings = byMissingParent.get(root.parentId)
      if (siblings) siblings.push(root)
      else byMissingParent.set(root.parentId, [root])
    })

    const built: Group[] = []
    const absorbed = new Set<string>()

    // Reunite departments that share an absent ministry, but only when we can name it
    // and it actually brings more than one department together.
    byMissingParent.forEach((departments, parentId) => {
      const name = ministryNames[parentId]
      if (!name || departments.length < 2) return

      departments.forEach((department) => absorbed.add(department.id))
      built.push({
        id: `ministry-${parentId}`,
        name,
        initial: initialOf(name),
        filable: null,
        entries: departments,
        members: departments.flatMap(subtreeOf),
      })
    })

    roots.forEach((root) => {
      if (absorbed.has(root.id)) return
      built.push({
        id: root.id,
        name: root.name,
        initial: initialOf(root.name),
        filable: root,
        entries: [root],
        members: subtreeOf(root),
      })
    })

    return { childrenByParent: children, groups: built }
  }, [directory])

  const query = search.trim().toLocaleLowerCase()
  const isSearching = query.length > 0

  const availableLetters = useMemo(() => new Set(groups.map((group) => group.initial)), [groups])

  const browseGroups = useMemo(() => groups
    .filter((group) => !letter || group.initial === letter)
    .sort((first, second) => {
      const compared = significantName(first.name).localeCompare(significantName(second.name))
      return sortBy === "za" ? -compared : compared
    }), [groups, letter, sortBy])

  const matches = useMemo(() => {
    if (!isSearching) return [] as Match[]

    const found: Match[] = []
    groups.forEach((group) => {
      group.members.forEach((authority) => {
        if (authority.name.toLocaleLowerCase().includes(query)) found.push({ authority, group })
      })
    })

    return found.sort((first, second) => {
      const byGroup = significantName(first.group.name).localeCompare(significantName(second.group.name))
      if (byGroup !== 0) return sortBy === "za" ? -byGroup : byGroup
      return first.authority.name.localeCompare(second.authority.name)
    })
  }, [groups, isSearching, query, sortBy])

  const matchedGroupCount = useMemo(() => new Set(matches.map((match) => match.group.id)).size, [matches])

  const resultTotal = isSearching ? matches.length : browseGroups.length
  const pageSize = isSearching ? matchPageSize : groupPageSize
  const totalPages = Math.max(1, Math.ceil(resultTotal / pageSize))
  const currentPage = Math.min(page, totalPages)
  const sliceStart = (currentPage - 1) * pageSize
  const pagedMatches = matches.slice(sliceStart, sliceStart + pageSize)
  const pagedGroups = browseGroups.slice(sliceStart, sliceStart + pageSize)

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null
  const compactPagination = totalPages <= 4
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : currentPage <= 2
      ? [1, 2, "ellipsis", totalPages]
      : currentPage >= totalPages - 1
        ? [1, "ellipsis", totalPages - 1, totalPages]
        : [1, "ellipsis-start", currentPage, "ellipsis-end", totalPages]
  const paginationItems = isCompactPagination
    ? compactPagination
    : Array.from({ length: totalPages }, (_, index) => index + 1)

  const resetPage = () => setPage(1)
  const clearEverything = () => { setSearch(""); setLetter(null); setSortBy("az"); resetPage() }
  const hasFilters = Boolean(search || letter || sortBy !== "az")

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
          <MaterialIcon className="text-3xl text-outline">error</MaterialIcon>
          <h1 className="mt-3 text-lg font-semibold text-on-surface">The authority directory could not be loaded</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Please refresh the page and try again.</p>
        </div>
      </div>
    )
  }

  if (!directory) {
    return (
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">Loading public authorities…</div>
      </div>
    )
  }

  if (selectedGroup) {
    const insideQuery = insideSearch.trim().toLocaleLowerCase()
    const matchingIds = new Set(insideQuery
      ? selectedGroup.members.filter((member) => member.name.toLocaleLowerCase().includes(insideQuery)).map((member) => member.id)
      : [])
    // While filtering, an office stays visible if it matches or one of its own offices does.
    const officeMatches = (office: Authority) => matchingIds.has(office.id)
      || (childrenByParent.get(office.id) ?? []).some((child) => matchingIds.has(child.id))
    const visibleSections = selectedGroup.entries
      .map((entry) => {
        const offices = childrenByParent.get(entry.id) ?? []
        return { entry, offices: insideQuery ? offices.filter(officeMatches) : offices }
      })
      .filter(({ entry, offices }) => !insideQuery || offices.length > 0 || matchingIds.has(entry.id))

    return (
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-10">
        <section aria-labelledby="authority-group-title">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <Button className="mb-4 px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => navigate("/public-authorities")} size="sm" type="button" variant="ghost">
              <MaterialIcon className="text-lg!">arrow_back</MaterialIcon>
              Back to all authorities
            </Button>
            <h1 className="font-headline-lg text-2xl text-primary" id="authority-group-title">{selectedGroup.name}</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {selectedGroup.members.length.toLocaleString()} public authorit{selectedGroup.members.length === 1 ? "y" : "ies"} listed here.
              Find the office your question is about, then choose <span className="font-medium text-on-surface">File RTI</span> next to it.
            </p>
            {selectedGroup.filable ? null : (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                <MaterialIcon className="text-base! shrink-0 text-primary">info</MaterialIcon>
                <span>An RTI is not filed to a ministry directly. Pick one of its departments or offices below.</span>
              </p>
            )}
            {selectedGroup.members.length > 12 ? (
              <div className="relative mt-4">
                <MaterialIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-outline">search</MaterialIcon>
                <Input
                  className="h-12 border-outline-variant bg-surface-container-low pl-12 pr-4 text-sm focus-visible:border-primary [&::-webkit-search-cancel-button]:appearance-none"
                  onChange={(event) => setInsideSearch(event.target.value)}
                  placeholder={`Find an office inside ${significantName(selectedGroup.name)}...`}
                  type="search"
                  value={insideSearch}
                />
              </div>
            ) : null}
            {insideQuery ? <p className="mt-2 text-xs text-on-surface-variant">{matchingIds.size} matching office{matchingIds.size === 1 ? "" : "s"} highlighted below.</p> : null}
          </div>
          {visibleSections.length ? (
            <div className="mt-5 space-y-6">
              {visibleSections.map(({ entry, offices }) => (
                <EntrySection childrenByParent={childrenByParent} entry={entry} key={entry.id} offices={offices} query={insideQuery} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
              <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
              <p className="mt-3 font-medium text-on-surface">Nothing here matches “{insideSearch.trim()}”</p>
              <Button className="mt-4" onClick={() => setInsideSearch("")} size="sm" type="button" variant="outline">Show every office</Button>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
        <h1 className="font-headline-lg text-2xl text-primary">Find a public authority</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
          An RTI request goes to one specific government office. This directory lists all {directory.authorities.length.toLocaleString()} offices
          you can file to, grouped under the ministry or department they belong to.
        </p>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          <StepCard icon="search" step={1} title="Search">Type what the office does — “passport”, “railway”, “income tax”. You do not need to know its ministry.</StepCard>
          <StepCard icon="account_balance" step={2} title="Open a group">No luck searching? Browse the ministries below and open one to see every office inside it.</StepCard>
          <StepCard icon="edit_document" step={3} title="File">Choose <span className="font-medium text-on-surface">File RTI</span> beside the exact office, then sign in to continue.</StepCard>
        </ul>
      </div>

      <section aria-label="Search and filter public authorities" className="mt-4 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:p-4">
          <div className="relative flex-1">
            <MaterialIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-outline">search</MaterialIcon>
            <Input
              className="h-12 border-transparent bg-surface-container-lowest pl-12 pr-11 text-sm shadow-sm focus-visible:border-primary [&::-webkit-search-cancel-button]:appearance-none"
              onChange={(event) => { setSearch(event.target.value); resetPage() }}
              placeholder="Search an authority, office, institution, or department..."
              type="search"
              value={search}
            />
            {search ? <Button aria-label="Clear search" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" onClick={() => { setSearch(""); resetPage() }} size="icon-sm" type="button" variant="ghost"><MaterialIcon className="text-lg!">close</MaterialIcon></Button> : null}
          </div>
          <div className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 shadow-sm">
            <MaterialIcon className="text-lg! text-primary">sort_by_alpha</MaterialIcon>
            <Select onValueChange={(value) => { setSortBy(value ?? "az"); resetPage() }} value={sortBy}>
              <SelectTrigger aria-label="Sort results" className="h-8 border-0 bg-transparent p-0 text-on-surface shadow-none focus-visible:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="az">A to Z</SelectItem>
                <SelectItem value="za">Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={`border-t border-outline-variant bg-surface-container-lowest px-3 py-3 md:px-4 ${isSearching ? "opacity-60" : ""}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-on-surface">Or browse by name</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {isSearching
                  ? "Clear the search box to browse by letter."
                  : "Letters use the main word, so Ministry of Railways sits under R. Greyed-out letters have nothing listed."}
              </p>
            </div>
            {hasFilters ? <Button className="self-start text-primary hover:text-primary sm:self-auto" onClick={clearEverything} size="sm" type="button" variant="ghost"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>Start over</Button> : null}
          </div>
          <div aria-label="Browse authority groups by letter" className="mt-3 flex gap-1 overflow-x-auto pb-1" role="group">
            <Button className="h-9 min-w-11 shrink-0 rounded-md px-3 text-xs" disabled={isSearching} onClick={() => { setLetter(null); resetPage() }} size="sm" type="button" variant={!letter ? "default" : "outline"}>All</Button>
            {alphabet.map((item) => (
              <Button
                aria-label={`Show authorities starting with ${item}`}
                className="size-9 shrink-0 rounded-md p-0 text-xs"
                disabled={isSearching || !availableLetters.has(item)}
                key={item}
                onClick={() => { setLetter(item); resetPage() }}
                size="icon"
                type="button"
                variant={letter === item ? "default" : "outline"}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          {isSearching
            ? matches.length
              ? <>Found <span className="font-semibold text-on-surface">{matches.length.toLocaleString()}</span> office{matches.length === 1 ? "" : "s"} matching “{search.trim()}”, across {matchedGroupCount} group{matchedGroupCount === 1 ? "" : "s"}.</>
              : <>No office matches “{search.trim()}”.</>
            : <><span className="font-semibold text-on-surface">{browseGroups.length}</span> group{browseGroups.length === 1 ? "" : "s"}{letter ? ` under ${letter}` : ""}, covering {directory.authorities.length.toLocaleString()} offices.</>}
        </p>
        {resultTotal > pageSize ? <p className="text-xs text-on-surface-variant">Showing {(sliceStart + 1).toLocaleString()}–{Math.min(sliceStart + pageSize, resultTotal).toLocaleString()} of {resultTotal.toLocaleString()}</p> : null}
      </div>

      {isSearching ? (
        pagedMatches.length ? (
          <ul className="mt-4 space-y-2">
            {pagedMatches.map((match) => (
              <li className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" key={`${match.group.id}-${match.authority.id}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-on-surface"><Highlight query={query} text={match.authority.name} /></p>
                  <button
                    className="mt-1 inline-flex items-center gap-1 text-xs text-on-surface-variant transition-colors hover:text-primary"
                    onClick={() => navigate(`/public-authorities?group=${match.group.id}`)}
                    type="button"
                  >
                    <MaterialIcon className="text-sm!">account_balance</MaterialIcon>
                    {match.group.name}
                  </button>
                </div>
                <Link className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" to="/login">
                  File RTI
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
            <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
            <p className="mt-3 font-medium text-on-surface">Nothing matches “{search.trim()}”</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-on-surface-variant">
              Try a shorter word, or the subject instead of the full office name — searching “rail” finds more than “railway board north”.
            </p>
            <Button className="mt-4" onClick={clearEverything} size="sm" type="button" variant="outline"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>Clear search and browse instead</Button>
          </div>
        )
      ) : pagedGroups.length ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedGroups.map((group) => {
            const officeCount = group.members.length
            const previewNames = group.entries.length > 1
              ? group.entries.slice(0, 3).map((entry) => entry.name)
              : (childrenByParent.get(group.entries[0].id) ?? []).slice(0, 2).map((child) => child.name)
            const remaining = officeCount - previewNames.length - (group.filable ? 1 : 0)

            return (
              <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md" key={group.id}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {group.filable ? "Authority" : "Ministry"}
                    </span>
                    <span className="shrink-0 text-xs text-outline">{officeCount.toLocaleString()} office{officeCount === 1 ? "" : "s"}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-6 text-on-surface">{group.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {officeCount === 1
                      ? "No sub-offices listed — an RTI goes straight to this authority."
                      : previewNames.length
                        ? <>Includes {previewNames.join(", ")}{remaining > 0 ? ` and ${remaining.toLocaleString()} more.` : "."}</>
                        : `${officeCount.toLocaleString()} offices listed.`}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                  <Button className="px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => navigate(`/public-authorities?group=${group.id}`)} size="sm" type="button" variant="ghost">
                    {officeCount === 1 ? "View details" : `View all ${officeCount.toLocaleString()} offices`}
                    <MaterialIcon className="text-lg!">arrow_forward</MaterialIcon>
                  </Button>
                  {group.filable ? (
                    <Link className="inline-flex h-8 items-center justify-center rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/85" to="/login">File RTI</Link>
                  ) : (
                    <span className="text-xs text-outline">File to a department inside</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
          <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
          <p className="mt-3 font-medium text-on-surface">No groups listed under “{letter}”</p>
          <Button className="mt-4" onClick={clearEverything} size="sm" type="button" variant="outline"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>Show every group</Button>
        </div>
      )}

      {resultTotal > pageSize ? (
        <nav aria-label="Directory pagination" className="mt-7 flex justify-center">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1">
            <Button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} size="icon" type="button" variant="outline"><MaterialIcon className="text-lg!">chevron_left</MaterialIcon></Button>
            {paginationItems.map((item, index) => typeof item === "number" ? (
              <Button aria-current={item === currentPage ? "page" : undefined} className="size-8 p-0" key={item} onClick={() => setPage(item)} size="icon" type="button" variant={item === currentPage ? "default" : "outline"}>{item}</Button>
            ) : <span className="flex size-8 items-center justify-center text-sm text-on-surface-variant" key={`${item}-${index}`}>…</span>)}
            <Button aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)} size="icon" type="button" variant="outline"><MaterialIcon className="text-lg!">chevron_right</MaterialIcon></Button>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
