import { useState, useCallback, useRef } from 'react'

/**
 * useApi — wraps any async API call with loading/error state.
 *
 * @param initial   - initial value for data (shown while loading)
 * @param fallback  - dummy data shown ONLY when the API returns empty on the
 *                    very first load. After a successful non-empty response the
 *                    fallback is permanently disabled so saves always show real data.
 */
export function useApi(initial = null, fallback = null) {
  const [data, setData]       = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Track whether we have ever received real data from the server.
  // Once we have, the fallback is never used again.
  const hasRealData = useRef(false)

  // Keep fallback in a ref so useCallback never needs it as a dependency.
  const fallbackRef = useRef(fallback)

  const run = useCallback(async (apiFn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFn(...args)
      const val  = res.data

      const isEmpty = (v) =>
        v === null || v === undefined ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)

      // If we got real data, latch the flag and never use fallback again
      if (!isEmpty(val)) hasRealData.current = true

      const resolved = (!hasRealData.current && fallbackRef.current) ? fallbackRef.current : val
      setData(resolved)
      return resolved
    } catch (err) {
      // On error only show fallback if we have never had real data
      if (!hasRealData.current && fallbackRef.current) {
        setData(fallbackRef.current)
        return fallbackRef.current
      }
      const msg = err.response?.data?.error || err.message || 'Request failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, []) // stable — no deps needed because we use refs

  return { data, setData, loading, error, setError, run }
}
