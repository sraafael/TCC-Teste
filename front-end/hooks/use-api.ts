import { useState, useCallback } from "react"
import { apiClient, type ApiResponse } from "@/lib/api-client"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiActions<T> {
  execute: (endpoint: string, method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: string | null) => void
}

type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const DEFAULT_ERROR_MESSAGE = "Erro ao processar requisição"

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE

const request = <T,>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<ApiResponse<T>> => {
  switch (method) {
    case "POST":
      return apiClient.post<T>(endpoint, body)
    case "PUT":
      return apiClient.put<T>(endpoint, body)
    case "PATCH":
      return apiClient.patch<T>(endpoint, body)
    case "DELETE":
      return apiClient.delete<T>(endpoint)
    default:
      return apiClient.get<T>(endpoint)
  }
}

export function useApi<T = unknown>(initialData: T | null = null): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (
      endpoint: string,
      method: HTTPMethod = "GET",
      body?: unknown
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await request<T>(endpoint, method, body)

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            error: result.error || DEFAULT_ERROR_MESSAGE,
            loading: false,
          }))
          return null
        }

        setState((prev) => ({
          ...prev,
          data: result.data || null,
          loading: false,
          error: null,
        }))

        return result.data || null
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(error),
          loading: false,
        }))

        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  }
}
