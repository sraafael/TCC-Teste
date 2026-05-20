"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

interface UsePaginatedDataOptions {
  pageSize?: number
  autoFetch?: boolean
}

interface UsePaginatedDataResult<T> {
  items: T[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  refresh: () => void
  setError: (error: string | null) => void
}

export function usePaginatedData<T>(endpoint: string, options: UsePaginatedDataOptions = {}): UsePaginatedDataResult<T> {
  const { pageSize = 10, autoFetch = true } = options
  const [page, setPage] = useState(1)
  const [localError, setLocalError] = useState<string | null>(null)

  const queryKey = [endpoint, page, pageSize] as const

  const { data, isLoading, error, refetch } = useQuery(
    queryKey,
    async () => {
      const separator = endpoint.includes("?") ? "&" : "?"
      const url = `${endpoint}${separator}page=${page}&pageSize=${pageSize}`
      const result = await apiClient.get<{ items: T[]; total: number }>(url)
      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar dados paginados")
      }
      return result.data!
    },
    {
      keepPreviousData: true,
      enabled: autoFetch,
      onError: (err) => {
        setLocalError(err instanceof Error ? err.message : String(err))
      },
    }
  )

  const items = data?.items || []
  const total = data?.total || 0
  const hasMore = page * pageSize < total

  return {
    items,
    loading: isLoading,
    error: localError || (error instanceof Error ? error.message : null),
    page,
    pageSize,
    total,
    hasMore,
    nextPage: () => hasMore && setPage((p) => p + 1),
    prevPage: () => page > 1 && setPage((p) => p - 1),
    goToPage: (newPage: number) => newPage > 0 && setPage(newPage),
    refresh: () => refetch(),
    setError: setLocalError,
  }
}

export default usePaginatedData
