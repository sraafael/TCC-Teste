"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

const fetchQueryData = async <T,>(endpoint: string): Promise<T> => {
  const result = await apiClient.get<T>(endpoint)
  if (!result.success) {
    throw new Error(result.error || "Erro ao buscar dados")
  }
  return result.data as T
}

export function useQueryApi<T = unknown>(
  key: readonly unknown[],
  endpoint: string,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>(key, () => fetchQueryData<T>(endpoint), options)
}

export default useQueryApi
