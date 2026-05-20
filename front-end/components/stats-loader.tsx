"use client"

import { LoadingOverlay, ErrorAlert, Empty } from "@/components/api-state"
import useQueryApi from "@/hooks/use-query-api"

interface StatsData {
  total_alunos: number
  total_professores: number
  total_planos: number
  total_turmas: number
}

export function StatsLoader() {
  const { data, isLoading, error } = useQueryApi<StatsData>(["stats"], "/api/stats")

  if (isLoading) return <LoadingOverlay message="Carregando estatísticas..." />
  if (error) return <ErrorAlert error={error instanceof Error ? error.message : String(error)} />
  if (!data) return <Empty message="Sem dados disponíveis" />

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total de Alunos</p>
        <p className="text-2xl font-bold">{data.total_alunos}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total de Professores</p>
        <p className="text-2xl font-bold">{data.total_professores}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total de Planos</p>
        <p className="text-2xl font-bold">{data.total_planos}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total de Turmas</p>
        <p className="text-2xl font-bold">{data.total_turmas}</p>
      </div>
    </div>
  )
}
