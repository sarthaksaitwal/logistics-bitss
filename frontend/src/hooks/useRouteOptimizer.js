import { useCallback, useRef, useState } from 'react'
import { optimizeRoute } from '../api/optimize.js'

export function useRouteOptimizer() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  const optimize = useCallback(async (request) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const data = await optimizeRoute(request, controller.signal)
      setResult(data)
    } catch (err) {
      if (err.name === 'AbortError') return
      setResult(null)
      setError(err.message)
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }, [])

  return { result, loading, error, optimize }
}
