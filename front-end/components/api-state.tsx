import { ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

interface ApiStateProps {
  loading: boolean
  error: string | null
  children: ReactNode
  loadingMessage?: string
  skeletonCount?: number
}

interface LoadingSkeletonProps {
  count?: number
  height?: string
  className?: string
}

interface ErrorAlertProps {
  error: string
  onDismiss?: () => void
  title?: string
}

export function LoadingSkeleton({
  count = 3,
  height = "h-12",
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  )
}

export function ErrorAlert({
  error,
  onDismiss,
  title = "Erro ao carregar dados",
}: ErrorAlertProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-red-200/30 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20 p-4">
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-red-900 dark:text-red-200 text-sm">
          {title}
        </h3>
        <p className="text-red-800 dark:text-red-300 text-sm mt-1">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          aria-label="Fechar alerta"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function LoadingOverlay({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function ApiState({
  loading,
  error,
  children,
  loadingMessage = "Carregando...",
  skeletonCount = 3,
}: ApiStateProps) {
  // TODO: REFACTOR - These shared state helpers now decide both UI rendering and error policy, which makes every new state variant harder to evolve.
  if (loading) {
    return <LoadingOverlay message={loadingMessage} />
  }

  if (error) {
    return <ErrorAlert error={error} />
  }

  return <>{children}</>
}

export function Empty({
  message = "Nenhum dado disponível",
  icon: Icon = AlertCircle,
}: {
  message?: string
  icon?: typeof AlertCircle
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
