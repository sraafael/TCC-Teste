const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"
const NETWORK_ERROR_MESSAGE = `Não foi possível conectar na API (${API_BASE_URL}). Verifique se o backend está rodando.`

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
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

const isNetworkError = (error: unknown) =>
  error instanceof TypeError
  && (error.message.toLowerCase().includes("failed to fetch") || error.message.toLowerCase().includes("network"))

const getResponseErrorMessage = (data: unknown, response: Response) => {
  if (typeof data === "object" && data !== null) {
    const { error, message } = data as { error?: unknown; message?: unknown }
    if (typeof error === "string") return error
    if (typeof message === "string") return message
  }

  return `Erro ${response.status}: ${response.statusText}`
}

const getRequestErrorMessage = (error: unknown) => {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE
  if (error instanceof Error) return error.message
  return "Erro desconhecido"
}

const parseResponseBody = async (response: Response) => response.json().catch(() => null)

const createJsonBody = (body: unknown) => body ? JSON.stringify(body) : undefined

async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const { skipErrorHandling = false, ...fetchOptions } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    const data = await parseResponseBody(response)

    if (!response.ok) {
      const errorMessage = getResponseErrorMessage(data, response)

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
    const errorMessage = getRequestErrorMessage(error)

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
  get: <T = unknown>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: createJsonBody(body),
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: createJsonBody(body),
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: createJsonBody(body),
    }),

  delete: <T = unknown>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),

  getBaseUrl: () => API_BASE_URL,
}

export type { ApiResponse, FetchOptions }
export { ApiClientError }
