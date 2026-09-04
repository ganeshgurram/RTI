export function notFound(_request, response) {
  response.status(404).json({ error: "notFound" })
}

export function errorHandler(error, _request, response, _next) {
  console.error(error)
  if (response.headersSent) return
  response.status(500).json({ error: "serverError" })
}
