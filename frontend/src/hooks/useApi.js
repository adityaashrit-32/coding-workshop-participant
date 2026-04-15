import { useState, useCallback } from 'react'

/**
 * useApi — thin wrapper around any async API call.
 *
 * Returns { data, loading, error, run }
 *   run(apiFn, ...args) executes the call, manages loading/error state,
 *   and returns the response data so callers can use it directly.
 */
export function useApi(initial = null) {
  const [data, setData]       = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const run = useCallback(async (apiFn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Request failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, setData, loading, error, setError, run }
}
