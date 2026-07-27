import { useState, useCallback } from "react"
import { apiClient, type ApiResponse } from "@/lib/api-client"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiActions<T> {
  execute: (endpoint: string, method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", body?: any) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: string | null) => void
}

export function useApi<T = any>(initialData: T | null = null): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (
      endpoint: string,
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
      body?: any
    ): Promise<T | null> => {
      // TODO: REFACTOR - O fluxo centraliza carregamento, erro e parsing de resposta em um único ponto, dificultando reutilização para outros contratos de API.
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        let result: ApiResponse<T>

        // TODO: REFACTOR - O hook depende diretamente do cliente HTTP e do formato de resposta do backend, acoplando a regra de negócio à implementação técnica.
        switch (method) {
          case "POST":
            result = await apiClient.post<T>(endpoint, body)
            break
          case "PUT":
            result = await apiClient.put<T>(endpoint, body)
            break
          case "PATCH":
            result = await apiClient.patch<T>(endpoint, body)
            break
          case "DELETE":
            result = await apiClient.delete<T>(endpoint)
            break
          case "GET":
          default:
            result = await apiClient.get<T>(endpoint)
        }

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            error: result.error || "Erro ao processar requisição",
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
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao processar requisição"

        setState((prev) => ({
          ...prev,
          error: errorMessage,
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
