"use client"

import { useState, useCallback } from "react"
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

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

const createPaginatedEndpoint = (endpoint: string, page: number, pageSize: number) => {
  const separator = endpoint.includes("?") ? "&" : "?"
  return `${endpoint}${separator}page=${page}&pageSize=${pageSize}`
}

export function usePaginatedData<T>(endpoint: string, options: UsePaginatedDataOptions = {}): UsePaginatedDataResult<T> {
  const { pageSize = 10, autoFetch = true } = options
  const [page, setPage] = useState(1)
  const [manualError, setManualError] = useState<string | null>(null)

  const queryKey = [endpoint, page, pageSize] as const

  const { data, isLoading, error, refetch } = useQuery(
    queryKey,
    async () => {
      const url = createPaginatedEndpoint(endpoint, page, pageSize)
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
        setManualError(getErrorMessage(err))
      },
    }
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = page * pageSize < total

  const nextPage = useCallback(() => {
    if (hasMore) setPage((p) => p + 1)
  }, [hasMore])

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const goToPage = useCallback((newPage: number) => {
    if (newPage > 0) setPage(newPage)
  }, [])

  const refresh = useCallback(() => {
    void refetch()
  }, [refetch])

  return {
    items,
    loading: isLoading,
    error: manualError ?? (error ? getErrorMessage(error) : null),
    page,
    pageSize,
    total,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    setError: setManualError,
  }
}

export default usePaginatedData
