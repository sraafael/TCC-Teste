"use client"

import { LoadingOverlay, ErrorAlert, Empty } from "@/components/api-state"
import useQueryApi from "@/hooks/use-query-api"

interface StatsData {
  total_alunos: number
  total_professores: number
  total_planos: number
  total_turmas: number
}

const STAT_ITEMS: Array<{ label: string; key: keyof StatsData }> = [
  { label: "Total de Alunos", key: "total_alunos" },
  { label: "Total de Professores", key: "total_professores" },
  { label: "Total de Planos", key: "total_planos" },
  { label: "Total de Turmas", key: "total_turmas" },
]

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

export function StatsLoader() {
  const { data, isLoading, error } = useQueryApi<StatsData>(["stats"], "/api/stats")

  if (isLoading) return <LoadingOverlay message="Carregando estatísticas..." />
  if (error) return <ErrorAlert error={getErrorMessage(error)} />
  if (!data) return <Empty message="Sem dados disponíveis" />

  return (
    <div className="grid gap-4">
      {STAT_ITEMS.map(({ label, key }) => (
        <div key={key} className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{data[key]}</p>
        </div>
      ))}
    </div>
  )
}
