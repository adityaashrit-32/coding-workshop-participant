import { useState, useMemo } from 'react'

/**
 * useSearch — client-side real-time filtering.
 *
 * @param items   array   — the full data array to filter
 * @param fields  array   — list of accessor functions (item) => string
 *
 * Returns { query, setQuery, filtered }
 *
 * Example:
 *   const { query, setQuery, filtered } = useSearch(employees, [
 *     (e) => `${e.first_name} ${e.last_name}`,
 *     (e) => e.email,
 *     (e) => e.department,
 *   ])
 */
export function useSearch(items, fields) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items ?? []
    return (items ?? []).filter((item) =>
      fields.some((fn) => {
        const val = fn(item)
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [items, fields, query])

  return { query, setQuery, filtered }
}
