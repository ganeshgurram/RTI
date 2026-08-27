import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRequests } from "@/requests/RequestContext"
import { MaterialIcon } from "@/routes/stitch-shell"

export function RequestHistoryTable() {
  const { requests } = useRequests()
  const [requestSearch, setRequestSearch] = useState("")
  const [requestStatus, setRequestStatus] = useState("all")
  const [requestPage, setRequestPage] = useState(1)
  const { t } = useTranslation()
  const requestPageSize = 10
  const requestQuery = requestSearch.trim().toLowerCase()
  const requestStatuses = [...new Set(requests.map((request) => request.status))]
  const filteredRequests = requests.filter((request) => {
    const matchesSearch = !requestQuery || [request.id, request.subject, request.authority].some((value) => value.toLowerCase().includes(requestQuery))
    return matchesSearch && (requestStatus === "all" || request.status === requestStatus)
  })
  const requestPageCount = Math.max(1, Math.ceil(filteredRequests.length / requestPageSize))
  const activeRequestPage = Math.min(requestPage, requestPageCount)
  const visibleRequests = filteredRequests.slice((activeRequestPage - 1) * requestPageSize, activeRequestPage * requestPageSize)
  const firstVisibleRequest = filteredRequests.length ? (activeRequestPage - 1) * requestPageSize + 1 : 0
  const lastVisibleRequest = Math.min(activeRequestPage * requestPageSize, filteredRequests.length)

  return (
    <Card className="border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col gap-3 border-b border-outline-variant/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label className="sr-only" htmlFor="request-search">{t("history.searchLabel")}</label>
          <Input id="request-search" onChange={(event) => { setRequestSearch(event.target.value); setRequestPage(1) }} placeholder={t("history.searchPlaceholder")} value={requestSearch} />
        </div>
        <div className="w-full sm:w-48">
          <label className="sr-only" htmlFor="request-status">{t("history.filterLabel")}</label>
          <Select onValueChange={(value) => { setRequestStatus(value ?? "all"); setRequestPage(1) }} value={requestStatus}>
            <SelectTrigger aria-label={t("history.filterLabel")} className="w-full" id="request-status"><SelectValue placeholder={t("history.allStatuses")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.allStatuses")}</SelectItem>
              {requestStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              <th className="px-5 py-4 font-semibold">{t("history.requestId")}</th>
              <th className="px-5 py-4 font-semibold">{t("history.subjectAuthority")}</th>
              <th className="px-5 py-4 font-semibold">{t("history.submitted")}</th>
              <th className="px-5 py-4 font-semibold">{t("history.status")}</th>
              <th className="px-5 py-4 font-semibold">{t("history.nextAction")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50 text-sm text-on-surface">
            {visibleRequests.map((request) => (
              <tr className="transition-colors hover:bg-surface-container/30" key={request.id}>
                <td className="px-5 py-4 font-semibold text-primary">{request.id}</td>
                <td className="max-w-[300px] px-5 py-4"><p className="font-medium">{request.subject}</p><p className="mt-1 text-xs text-on-surface-variant">{request.authority}</p></td>
                <td className="px-5 py-4 text-on-surface-variant"><p>{request.submittedOn}</p><p className="mt-1 text-xs">{t("history.updated", { date: request.lastUpdated })}</p></td>
                <td className="px-5 py-4"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${request.statusClass}`}>{request.status}</span></td>
                <td className="px-5 py-4 text-on-surface-variant">{request.nextAction}</td>
              </tr>
            ))}
            {!visibleRequests.length ? <tr><td className="px-5 py-10 text-center text-sm text-on-surface-variant" colSpan={5}>{t("history.noMatches")}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-outline-variant/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-on-surface-variant">Showing {firstVisibleRequest}–{lastVisibleRequest} of {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"}</p>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs text-on-surface-variant">{t("history.page", { page: activeRequestPage, total: requestPageCount })}</p>
          <div className="flex gap-2">
            <Button disabled={activeRequestPage === 1} onClick={() => setRequestPage((page) => Math.max(1, page - 1))} size="sm" type="button" variant="outline"><MaterialIcon>chevron_left</MaterialIcon>{t("history.previous")}</Button>
            <Button disabled={activeRequestPage === requestPageCount} onClick={() => setRequestPage((page) => Math.min(requestPageCount, page + 1))} size="sm" type="button" variant="outline">{t("history.next")}<MaterialIcon>chevron_right</MaterialIcon></Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
