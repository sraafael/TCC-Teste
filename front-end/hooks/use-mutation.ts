"use client"

import { useCallback } from "react"
import { useMutation as useRQMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, type ApiResponse } from "@/lib/api-client"

type HTTPMethod = "POST" | "PUT" | "PATCH" | "DELETE"

interface UseMutationState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

interface UseMutationActions<T> {
  mutate: (endpoint: string, data?: unknown, method?: HTTPMethod) => Promise<T | null>
  reset: () => void
}

interface MutationRequest {
  endpoint: string
  data?: unknown
  method?: HTTPMethod
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

const queryKeyIncludesEndpoint = (queryKey: unknown, endpoint: string) => {
  try {
    return JSON.stringify(queryKey).includes(endpoint)
  } catch {
    return false
  }
}

const executeMutation = async <T,>({ endpoint, data, method = "POST" }: MutationRequest): Promise<T | null> => {
  let response: ApiResponse<T>

  switch (method) {
    case "PUT":
      response = await apiClient.put<T>(endpoint, data)
      break
    case "PATCH":
      response = await apiClient.patch<T>(endpoint, data)
      break
    case "DELETE":
      response = await apiClient.delete<T>(endpoint)
      break
    default:
      response = await apiClient.post<T>(endpoint, data)
  }

  if (!response.success) throw new Error(response.error || "Erro ao processar requisição")
  return response.data ?? null
}

const invalidateEndpointQueries = (endpoint: string, queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({
    predicate: (query) => queryKeyIncludesEndpoint(query.queryKey, endpoint),
  })
}

export function useMutation<T = unknown>(): UseMutationState<T> & UseMutationActions<T> {
  const queryClient = useQueryClient()

  const rq = useRQMutation((request: MutationRequest) => executeMutation<T>(request))

  const mutate = useCallback(
    async (endpoint: string, data?: unknown, method: HTTPMethod = "POST") => {
      const res = await rq.mutateAsync({ endpoint, data, method })
      invalidateEndpointQueries(endpoint, queryClient)
      return res
    },
    [rq, queryClient]
  )

  const reset = rq.reset

  return {
    data: rq.data ?? null,
    loading: rq.isLoading,
    error: rq.error ? getErrorMessage(rq.error) : null,
    success: rq.isSuccess,
    mutate,
    reset,
  }
}

export default useMutation
