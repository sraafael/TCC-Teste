"use client"

import { useCallback } from "react"
import { useMutation as useRQMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

type HTTPMethod = "POST" | "PUT" | "PATCH" | "DELETE"

interface UseMutationState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

interface UseMutationActions<T> {
  mutate: (endpoint: string, data?: any, method?: HTTPMethod) => Promise<T | null>
  reset: () => void
}

export function useMutation<T = any>(): UseMutationState<T> & UseMutationActions<T> {
  const queryClient = useQueryClient()

  const rq = useRQMutation(async ({ endpoint, data, method = "POST" }: { endpoint: string; data?: any; method?: HTTPMethod }) => {
    switch (method) {
      case "PUT":
        return (await apiClient.put<T>(endpoint, data)).data || null
      case "PATCH":
        return (await apiClient.patch<T>(endpoint, data)).data || null
      case "DELETE":
        return (await apiClient.delete<T>(endpoint)).data || null
      case "POST":
      default:
        return (await apiClient.post<T>(endpoint, data)).data || null
    }
  })

  // mutate wrapper to keep previous signature
  const mutate = useCallback(
    async (endpoint: string, data?: any, method: HTTPMethod = "POST") => {
      const res = await rq.mutateAsync({ endpoint, data, method })
      // Basic strategy: invalidate queries that include the endpoint path
      // so cached lists are refreshed. This is coarse but practical.
      try {
        queryClient.invalidateQueries({ predicate: (query) => {
          try {
            return JSON.stringify(query.queryKey).includes(endpoint)
          } catch {
            return false
          }
        }})
      } catch {
        // ignore invalidation errors
      }
      return res as T | null
    },
    [rq, queryClient]
  )

  const reset = rq.reset

  return {
    data: (rq.data as T) || null,
    loading: rq.isLoading,
    error: rq.error ? (rq.error instanceof Error ? rq.error.message : String(rq.error)) : null,
    success: rq.isSuccess,
    mutate,
    reset,
  }
}

export default useMutation
