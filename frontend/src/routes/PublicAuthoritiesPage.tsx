import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { IconTooltip } from "@/components/IconTooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ministryNames } from "@/data/ministry-names"
import { useRequestGuidelines } from "@/request-guidelines/RequestGuidelinesDialog"
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

function OfficeCard({ authority, childrenByParent, ministryName, query }: { authority: Authority; childrenByParent: Map<string, Authority[]>; ministryName: string; query: string }) {
  const { t } = useTranslation()
  const { openRequestGuidelines } = useRequestGuidelines()
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
                <button className="shrink-0 text-xs font-medium text-primary hover:underline" onClick={() => openRequestGuidelines({ authority: { name: child.name, ministryName } })} type="button">{t("authorities.file")}</button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button className="mt-4 inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" onClick={() => openRequestGuidelines({ authority: { name: authority.name, ministryName } })} type="button">
        {t("authorities.fileRti")}
      </button>
    </li>
  )
}

function EntrySection({
  childrenByParent,
  entry,
  ministryName,
  offices,
  query,
}: {
  childrenByParent: Map<string, Authority[]>
  entry: Authority
  ministryName: string
  offices: Authority[]
  query: string
}) {
  const { t } = useTranslation()
  const { openRequestGuidelines } = useRequestGuidelines()
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
                ? t("authorities.officesShown", {
                    count: total,
                    label: offices.length === total
                      ? total.toLocaleString()
                      : t("authorities.ofTotal", { shown: offices.length.toLocaleString(), total: total.toLocaleString() }),
                  })
                : t("authorities.canFileHere")}
            </p>
          </div>
        </div>
        <button className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" onClick={() => openRequestGuidelines({ authority: { name: entry.name, ministryName } })} type="button">
          {t("authorities.fileRti")}
        </button>
      </div>
      {offices.length ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {offices.map((office) => <OfficeCard authority={office} childrenByParent={childrenByParent} key={office.id} ministryName={ministryName} query={query} />)}
        </ul>
      ) : null}
    </section>
  )
}

function StepCard({ children, icon, step, title }: { children: ReactNode; icon: string; step: number; title: string }) {
  const { t } = useTranslation()

  return (
    <li className="flex gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <MaterialIcon className="text-lg!">{icon}</MaterialIcon>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{t("authorities.step", { step, title })}</p>
        <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{children}</p>
      </div>
    </li>
  )
}

export function PublicAuthoritiesPage() {
  const { t } = useTranslation()
  const [directory, setDirectory] = useState<DirectoryData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const navigate = useNavigate()
  const { openRequestGuidelines } = useRequestGuidelines()
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
          <h1 className="mt-3 text-lg font-semibold text-on-surface">{t("authorities.errorTitle")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("authorities.errorBody")}</p>
        </div>
      </div>
    )
  }

  if (!directory) {
    return (
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">{t("authorities.loading")}</div>
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
              {t("authorities.backToAll")}
            </Button>
            <h1 className="font-headline-lg text-2xl text-primary" id="authority-group-title">{selectedGroup.name}</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              <Trans
                components={{ b: <span className="font-medium text-on-surface" /> }}
                i18nKey="authorities.groupIntro"
                values={{ count: selectedGroup.members.length, total: selectedGroup.members.length.toLocaleString() }}
              />
            </p>
            {selectedGroup.filable ? null : (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                <MaterialIcon className="text-base! shrink-0 text-primary">info</MaterialIcon>
                <span>{t("authorities.ministryNotice")}</span>
              </p>
            )}
            {selectedGroup.members.length > 12 ? (
              <div className="relative mt-4">
                <MaterialIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-outline">search</MaterialIcon>
                <Input
                  className="h-12 border-outline-variant bg-surface-container-low pl-12 pr-4 text-sm focus-visible:border-primary [&::-webkit-search-cancel-button]:appearance-none"
                  onChange={(event) => setInsideSearch(event.target.value)}
                  placeholder={t("authorities.findInside", { name: significantName(selectedGroup.name) })}
                  type="search"
                  value={insideSearch}
                />
              </div>
            ) : null}
            {insideQuery ? <p className="mt-2 text-xs text-on-surface-variant">{t("authorities.matchingOffices", { count: matchingIds.size })}</p> : null}
          </div>
          {visibleSections.length ? (
            <div className="mt-5 space-y-6">
              {visibleSections.map(({ entry, offices }) => (
                <EntrySection childrenByParent={childrenByParent} entry={entry} key={entry.id} ministryName={selectedGroup.name} offices={offices} query={insideQuery} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
              <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
              <p className="mt-3 font-medium text-on-surface">{t("authorities.nothingMatchesInside", { query: insideSearch.trim() })}</p>
              <Button className="mt-4" onClick={() => setInsideSearch("")} size="sm" type="button" variant="outline">{t("authorities.showEveryOffice")}</Button>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
        <h1 className="font-headline-lg text-2xl text-primary">{t("authorities.title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
          {t("authorities.intro", { total: directory.authorities.length.toLocaleString() })}
        </p>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          <StepCard icon="search" step={1} title={t("authorities.steps.search.title")}>{t("authorities.steps.search.body")}</StepCard>
          <StepCard icon="account_balance" step={2} title={t("authorities.steps.group.title")}>{t("authorities.steps.group.body")}</StepCard>
          <StepCard icon="edit_document" step={3} title={t("authorities.steps.file.title")}>
            <Trans components={{ b: <span className="font-medium text-on-surface" /> }} i18nKey="authorities.steps.file.body" />
          </StepCard>
        </ul>
      </div>

      <section aria-label={t("authorities.searchSectionLabel")} className="mt-4 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:p-4">
          <div className="relative flex-1">
            <MaterialIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-outline">search</MaterialIcon>
            <Input
              className="h-12 border-transparent bg-surface-container-lowest pl-12 pr-11 text-sm shadow-sm focus-visible:border-primary [&::-webkit-search-cancel-button]:appearance-none"
              onChange={(event) => { setSearch(event.target.value); resetPage() }}
              placeholder={t("authorities.searchPlaceholder")}
              type="search"
              value={search}
            />
            {search ? <IconTooltip label={t("authorities.clearSearch")} render={<Button aria-label={t("authorities.clearSearch")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" onClick={() => { setSearch(""); resetPage() }} size="icon-sm" type="button" variant="ghost" />} side="left"><MaterialIcon className="text-lg!">close</MaterialIcon></IconTooltip> : null}
          </div>
          <div className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 shadow-sm">
            <MaterialIcon className="text-lg! text-primary">sort_by_alpha</MaterialIcon>
            <Select onValueChange={(value) => { setSortBy(value ?? "az"); resetPage() }} value={sortBy}>
              <SelectTrigger aria-label={t("authorities.sortLabel")} className="h-8 border-0 bg-transparent p-0 text-on-surface shadow-none focus-visible:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="az">{t("authorities.sortAz")}</SelectItem>
                <SelectItem value="za">{t("authorities.sortZa")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={`border-t border-outline-variant bg-surface-container-lowest px-3 py-3 md:px-4 ${isSearching ? "opacity-60" : ""}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-on-surface">{t("authorities.browseTitle")}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {isSearching
                  ? t("authorities.browseHintSearching")
                  : t("authorities.browseHint")}
              </p>
            </div>
            {hasFilters ? <Button className="self-start text-primary hover:text-primary sm:self-auto" onClick={clearEverything} size="sm" type="button" variant="ghost"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>{t("authorities.startOver")}</Button> : null}
          </div>
          <div aria-label={t("authorities.letterGroupLabel")} className="mt-3 flex gap-1 overflow-x-auto pb-1" role="group">
            <Button className="h-9 min-w-11 shrink-0 rounded-md px-3 text-xs" disabled={isSearching} onClick={() => { setLetter(null); resetPage() }} size="sm" type="button" variant={!letter ? "default" : "outline"}>{t("authorities.all")}</Button>
            {alphabet.map((item) => (
              <Button
                aria-label={t("authorities.letterLabel", { letter: item })}
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
              ? <Trans
                  components={{ b: <span className="font-semibold text-on-surface" /> }}
                  i18nKey="authorities.foundOffices"
                  // The query is whatever was typed. Trans keeps basic tags like <i> as real
                  // elements, so escape the value and unescape after the parse: the sentence
                  // keeps its own bold, and the query lands as text the way it used to.
                  shouldUnescape
                  tOptions={{ interpolation: { escapeValue: true } }}
                  values={{
                    count: matches.length,
                    groupText: t("authorities.matchedGroups", { count: matchedGroupCount }),
                    query: search.trim(),
                    total: matches.length.toLocaleString(),
                  }}
                />
              : t("authorities.noOfficeMatches", { query: search.trim() })
            : <Trans
                components={{ b: <span className="font-semibold text-on-surface" /> }}
                i18nKey={letter ? "authorities.browseCountLetter" : "authorities.browseCount"}
                values={{
                  count: browseGroups.length,
                  letter,
                  offices: directory.authorities.length.toLocaleString(),
                  total: browseGroups.length.toLocaleString(),
                }}
              />}
        </p>
        {resultTotal > pageSize ? <p className="text-xs text-on-surface-variant">{t("authorities.showingRange", { from: (sliceStart + 1).toLocaleString(), to: Math.min(sliceStart + pageSize, resultTotal).toLocaleString(), total: resultTotal.toLocaleString() })}</p> : null}
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
                <button className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" onClick={() => openRequestGuidelines({ authority: { name: match.authority.name, ministryName: match.group.name } })} type="button">
                  {t("authorities.fileRti")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
            <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
            <p className="mt-3 font-medium text-on-surface">{t("authorities.nothingMatches", { query: search.trim() })}</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-on-surface-variant">
              {t("authorities.nothingMatchesBody")}
            </p>
            <Button className="mt-4" onClick={clearEverything} size="sm" type="button" variant="outline"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>{t("authorities.clearAndBrowse")}</Button>
          </div>
        )
      ) : pagedGroups.length ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedGroups.map((group) => {
            const officeCount = group.members.length
            const filable = group.filable
            const previewNames = group.entries.length > 1
              ? group.entries.slice(0, 3).map((entry) => entry.name)
              : (childrenByParent.get(group.entries[0].id) ?? []).slice(0, 2).map((child) => child.name)
            const remaining = officeCount - previewNames.length - (group.filable ? 1 : 0)

            return (
              <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md" key={group.id}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {t(group.filable ? "authorities.badgeAuthority" : "authorities.badgeMinistry")}
                    </span>
                    <span className="shrink-0 text-xs text-outline">{t("authorities.officeCount", { count: officeCount, total: officeCount.toLocaleString() })}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-6 text-on-surface">{group.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {officeCount === 1
                      ? t("authorities.noSubOffices")
                      : previewNames.length
                        ? remaining > 0
                          ? t("authorities.includesMore", { more: remaining.toLocaleString(), names: previewNames.join(", ") })
                          : t("authorities.includes", { names: previewNames.join(", ") })
                        : t("authorities.officesListed", { total: officeCount.toLocaleString() })}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                  <Button className="px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => navigate(`/public-authorities?group=${group.id}`)} size="sm" type="button" variant="ghost">
                    {officeCount === 1 ? t("authorities.viewDetails") : t("authorities.viewAllOffices", { total: officeCount.toLocaleString() })}
                    <MaterialIcon className="text-lg!">arrow_forward</MaterialIcon>
                  </Button>
                  {filable ? (
                    <button className="inline-flex h-8 items-center justify-center rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/85" onClick={() => openRequestGuidelines({ authority: { name: filable.name, ministryName: group.name } })} type="button">{t("authorities.fileRti")}</button>
                  ) : (
                    <span className="text-xs text-outline">{t("authorities.fileToDepartment")}</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
          <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
          <p className="mt-3 font-medium text-on-surface">{t("authorities.noGroupsUnder", { letter })}</p>
          <Button className="mt-4" onClick={clearEverything} size="sm" type="button" variant="outline"><MaterialIcon className="text-lg!">restart_alt</MaterialIcon>{t("authorities.showEveryGroup")}</Button>
        </div>
      )}

      {resultTotal > pageSize ? (
        <nav aria-label={t("authorities.pagination")} className="mt-7 flex justify-center">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1">
            <IconTooltip label={t("authorities.previousPage")} render={<Button aria-label={t("authorities.previousPage")} disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} size="icon" type="button" variant="outline" />}><MaterialIcon className="text-lg!">chevron_left</MaterialIcon></IconTooltip>
            {paginationItems.map((item, index) => typeof item === "number" ? (
              <Button aria-current={item === currentPage ? "page" : undefined} className="size-8 p-0" key={item} onClick={() => setPage(item)} size="icon" type="button" variant={item === currentPage ? "default" : "outline"}>{item}</Button>
            ) : <span className="flex size-8 items-center justify-center text-sm text-on-surface-variant" key={`${item}-${index}`}>…</span>)}
            <IconTooltip label={t("authorities.nextPage")} render={<Button aria-label={t("authorities.nextPage")} disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)} size="icon" type="button" variant="outline" />}><MaterialIcon className="text-lg!">chevron_right</MaterialIcon></IconTooltip>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
