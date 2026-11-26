import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiClientError } from '../lib/api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Runs an async fetcher on mount (and whenever `deps` change), exposing a
 * consistent loading/error/data shape plus a `refetch` for retry buttons.
 * Ignores results from a fetch that was superseded by a newer one.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const requestId = useRef(0)

  const run = useCallback(() => {
    const id = ++requestId.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetcher()
      .then((data) => {
        if (requestId.current === id) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (requestId.current !== id) return
        const message = error instanceof ApiClientError ? error.message : 'Something went wrong.'
        setState({ data: null, loading: false, error: message })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { ...state, refetch: run }
}
