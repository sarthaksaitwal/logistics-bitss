const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const MAX_STOPS = 25 // must match the backend's max_stops setting

export async function optimizeRoute({ stops, depotIndex = 0, returnToDepot = true }, signal) {
  let response
  try {
    response = await fetch(`${API_URL}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stops,
        depot_index: depotIndex,
        return_to_depot: returnToDepot,
      }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error(`Cannot reach the backend at ${API_URL}. Is it running?`, { cause: err })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(errorMessage(response.status, data))
  }
  return data
}

function errorMessage(status, data) {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) return detail[0].msg
  return `Request failed (HTTP ${status})`
}
