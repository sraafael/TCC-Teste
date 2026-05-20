"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface PaginationControlsProps {
  page: number
  pageSize: number
  total: number
  onNext: () => void
  onPrev: () => void
  isLoading?: boolean
}

export default function PaginationControls({
  page,
  pageSize,
  total,
  onNext,
  onPrev,
  isLoading = false,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={page <= 1 || isLoading}
      >
        <ChevronLeftIcon className="size-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      <div className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={page >= totalPages || isLoading}
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}
