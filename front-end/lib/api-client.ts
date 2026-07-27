const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

interface FetchOptions extends RequestInit {
  skipErrorHandling?: boolean
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}

class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  // TODO: REFACTOR - A lógica de normalização de erro e fallback de rede está misturada à execução HTTP, dificultando o reuso em outros clientes.
  const url = `${API_BASE_URL}${endpoint}`
  const { skipErrorHandling = false, ...fetchOptions } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  }

  try {
    // TODO: REFACTOR - O cliente assume um formato de resposta único e um contrato de erro do backend, deixando a regra de negócio presa à implementação.
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        `Erro ${response.status}: ${response.statusText}`

      if (!skipErrorHandling) {
        throw new ApiClientError(response.status, errorMessage, data)
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      }
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    }
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError &&
      (error.message.toLowerCase().includes("failed to fetch") ||
        error.message.toLowerCase().includes("network"))

    const errorMessage = isNetworkError
      ? `Não foi possível conectar na API (${API_BASE_URL}). Verifique se o backend está rodando.`
      : error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Erro desconhecido"

    if (!skipErrorHandling && !(error instanceof ApiClientError)) {
      throw new ApiClientError(0, errorMessage, error)
    }

    return {
      success: false,
      error: errorMessage,
      statusCode: error instanceof ApiClientError ? error.statusCode : 0,
    }
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),

  getBaseUrl: () => API_BASE_URL,
}

export type { ApiResponse, FetchOptions }
export { ApiClientError }
