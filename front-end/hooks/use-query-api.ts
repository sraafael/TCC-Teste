"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export function useQueryApi<T = any>(
  key: readonly unknown[],
  endpoint: string,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>(key, async () => {
    const result = await apiClient.get<T>(endpoint)
    if (!result.success) {
      throw new Error(result.error || "Erro ao buscar dados")
    }
    return result.data as T
  }, options)
}

export default useQueryApi
