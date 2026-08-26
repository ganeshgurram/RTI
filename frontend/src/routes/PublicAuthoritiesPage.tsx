import { useEffect, useMemo, useState } from "react"
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

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const pageSize = 6

function authorityGroupName(authority: Authority) {
  return authority.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2) || "PA"
}

function AuthorityTree({
  authority,
  childrenByParent,
  depth = 0,
}: {
  authority: Authority
  childrenByParent: Map<string, Authority[]>
  depth?: number
}) {
  const children = childrenByParent.get(authority.id) ?? []

  return (
    <li className="relative">
      <div
        className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${depth === 0 ? "border-primary/30 bg-primary-fixed/30" : "border-outline-variant bg-surface-container-lowest"}`}
        style={{ marginLeft: `${Math.min(depth, 3) * 16}px` }}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${depth === 0 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
            {depth === 0 ? authorityGroupName(authority) : <MaterialIcon className="text-base">account_balance</MaterialIcon>}
          </div>
          <div className="min-w-0">
            <p className={`text-sm leading-5 ${depth === 0 ? "font-semibold text-primary" : "font-medium text-on-surface"}`}>{authority.name}</p>
            {children.length ? <p className="mt-1 text-xs text-on-surface-variant">{children.length} direct {children.length === 1 ? "authority" : "authorities"}</p> : <p className="mt-1 text-xs text-on-surface-variant">Direct authority</p>}
          </div>
        </div>
        <Link className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90" to="/login">
          File RTI
        </Link>
      </div>
      {children.length ? <ul className="mt-2 space-y-2">{children.map((child) => <AuthorityTree authority={child} childrenByParent={childrenByParent} depth={depth + 1} key={child.id} />)}</ul> : null}
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

  const { groups, childrenByParent } = useMemo(() => {
    const authorities = directory?.authorities ?? []
    const authorityById = new Map(authorities.map((authority) => [authority.id, authority]))
    const membersByRootId = new Map<string, Authority[]>()
    const children = new Map<string, Authority[]>()

    const rootFor = (authority: Authority) => {
      const visited = new Set<string>()
      let current = authority

      while (current.parentId && authorityById.has(current.parentId) && !visited.has(current.parentId)) {
        visited.add(current.id)
        current = authorityById.get(current.parentId) ?? current
      }

      return current.id
    }

    authorities.forEach((authority) => {
      if (authority.parentId) {
        children.set(authority.parentId, [...(children.get(authority.parentId) ?? []), authority])
      }

      const rootId = rootFor(authority)
      membersByRootId.set(rootId, [...(membersByRootId.get(rootId) ?? []), authority])
    })

    const roots = authorities.filter((authority) => !authority.parentId || !authorityById.has(authority.parentId))
    return {
      childrenByParent: children,
      groups: roots.map((root) => ({
        root,
        members: membersByRootId.get(root.id) ?? [root],
        directChildCount: (children.get(root.id) ?? []).length,
      })),
    }
  }, [directory])

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const result = groups.filter((group) => {
      const matchesLetter = !letter || group.root.name.toLocaleUpperCase().startsWith(letter)
      const matchesSearch = !query || group.members.some((authority) => authority.name.toLocaleLowerCase().includes(query))
      return matchesLetter && matchesSearch
    })

    return result.sort((first, second) => sortBy === "za"
      ? second.root.name.localeCompare(first.root.name)
      : first.root.name.localeCompare(second.root.name))
  }, [groups, letter, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedGroup = groups.find((group) => group.root.id === selectedGroupId) ?? null
  const mobilePagination = totalPages <= 4
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : currentPage <= 2
      ? [1, 2, "ellipsis", totalPages]
      : currentPage >= totalPages - 1
        ? [1, "ellipsis", totalPages - 1, totalPages]
        : [1, "ellipsis-start", currentPage, "ellipsis-end", totalPages]
  const paginationItems = isCompactPagination
    ? mobilePagination
    : Array.from({ length: totalPages }, (_, index) => index + 1)

  const resetPage = () => setPage(1)

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

  return (
    <div className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop md:py-10">
      <section className="w-full">
        {selectedGroup ? (
          <section aria-labelledby="authority-group-title">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <Button className="mb-4 px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => navigate("/public-authorities")} size="sm" type="button" variant="ghost">
                <MaterialIcon>arrow_back</MaterialIcon>
                All authority groups
              </Button>
              <h1 className="font-headline-lg text-2xl text-primary" id="authority-group-title">{selectedGroup.root.name}</h1>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{selectedGroup.members.length.toLocaleString()} public authorit{selectedGroup.members.length === 1 ? "y" : "ies"} are organized below according to the RTI Online portal hierarchy.</p>
            </div>
            <ul className="mt-5 space-y-2">
              <AuthorityTree authority={selectedGroup.root} childrenByParent={childrenByParent} />
            </ul>
          </section>
        ) : (
          <>
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <h1 className="font-headline-lg text-2xl text-primary">Public Authorities Directory</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                Browse the public authorities listed on the RTI Online portal. The directory preserves the portal’s official authority groups and their nested offices, institutions, and departments.
              </p>
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
                    <SelectTrigger aria-label="Sort authority groups" className="h-8 border-0 bg-transparent p-0 text-on-surface shadow-none focus-visible:ring-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="az">A to Z</SelectItem>
                      <SelectItem value="za">Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t border-outline-variant bg-surface-container-lowest px-3 py-3 md:px-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Browse by initial</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">Narrow the directory to authority groups that begin with a chosen letter.</p>
                  </div>
                  {search || letter || sortBy !== "az" ? <Button className="self-start text-primary hover:text-primary sm:self-auto" onClick={() => { setSearch(""); setLetter(null); setSortBy("az"); resetPage() }} size="sm" type="button" variant="ghost"><MaterialIcon>restart_alt</MaterialIcon>Reset</Button> : null}
                </div>
                <div aria-label="Filter authority groups by first letter" className="mt-3 flex gap-1 overflow-x-auto pb-1" role="group">
                  <Button className="h-9 min-w-11 rounded-md px-3 text-xs" onClick={() => { setLetter(null); resetPage() }} size="sm" type="button" variant={!letter ? "default" : "outline"}>All</Button>
                  {alphabet.map((item) => (
                    <Button aria-label={`Show authority groups beginning with ${item}`} className="size-9 shrink-0 rounded-md p-0 text-xs" key={item} onClick={() => { setLetter(item); resetPage() }} size="icon" type="button" variant={letter === item ? "default" : "outline"}>{item}</Button>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-5 flex items-center gap-4">
              <p className="text-sm text-on-surface-variant">{directory.authorities.length.toLocaleString()} authorities organized into {groups.length} top-level groups</p>
            </div>

            {pagedGroups.length ? (
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {pagedGroups.map((group) => {
                  const previewNames = group.members.filter((authority) => authority.parentId === group.root.id).slice(0, 2).map((authority) => authority.name)
                  const childTotal = group.members.length - 1

                  return (
                    <article className="flex min-h-60 flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md" key={group.root.id}>
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">Authority group</span>
                          <span className="text-xs text-outline">Central</span>
                        </div>
                        <h2 className="mt-3 text-lg font-semibold leading-6 text-on-surface">{group.root.name}</h2>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                          {childTotal.toLocaleString()} listed authorit{childTotal === 1 ? "y" : "ies"}{previewNames.length ? `, including ${previewNames.join(" and ")}.` : "."}
                        </p>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                        <Button className="px-0 text-primary hover:bg-transparent hover:text-primary" onClick={() => navigate(`/public-authorities?group=${group.root.id}`)} size="sm" type="button" variant="ghost">
                          View authorities
                          <MaterialIcon>arrow_forward</MaterialIcon>
                        </Button>
                        <Link className="inline-flex h-8 items-center justify-center rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/85" to="/login">File RTI</Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
                <MaterialIcon className="text-3xl text-outline">search_off</MaterialIcon>
                <p className="mt-3 font-medium text-on-surface">No authority groups found</p>
                <p className="mt-1 text-sm text-on-surface-variant">Try a different search term or clear the filters.</p>
              </div>
            )}

            {filteredGroups.length ? (
              <nav aria-label="Directory pagination" className="mt-7 flex justify-center">
                <div className="flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1">
                  <Button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} size="icon" type="button" variant="outline"><MaterialIcon>chevron_left</MaterialIcon></Button>
                  {paginationItems.map((item, index) => typeof item === "number" ? (
                    <Button aria-current={item === currentPage ? "page" : undefined} className="size-8 p-0" key={item} onClick={() => setPage(item)} size="icon" type="button" variant={item === currentPage ? "default" : "outline"}>{item}</Button>
                  ) : <span className="flex size-8 items-center justify-center text-sm text-on-surface-variant" key={`${item}-${index}`}>…</span>)}
                  <Button aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)} size="icon" type="button" variant="outline"><MaterialIcon>chevron_right</MaterialIcon></Button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
