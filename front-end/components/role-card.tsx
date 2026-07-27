/**
 * Arquivo: front-end/components/role-card.tsx
 * Area: Front-end React (componentes)
 * Funcao: Card interativo para escolha de perfil de acesso.
 * Onde fica: /front-end/components/role-card.tsx
 */
"use client"

import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface RoleCardProps {
  title: string
  description: string
  icon: LucideIcon
  accentColor: string
  onClick: () => void
}

export function RoleCard({ title, description, icon: Icon, accentColor, onClick }: RoleCardProps) {
  // TODO: REFACTOR - The card is acting as both navigation trigger and visual container, so role selection logic is coupled to presentation.
  return (
    // Card clicavel que representa um perfil de acesso na pagina inicial.
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-card-foreground",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.03] hover:border-primary/50 hover:shadow-[0_0_40px_rgba(74,222,128,0.1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "cursor-pointer w-full"
      )}
    >
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
          "group-hover:scale-110",
          accentColor
        )}
      >
        <Icon className="h-10 w-10 text-card-foreground" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-xl font-semibold font-mono tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
          {description}
        </p>
      </div>

      <div
        className={cn(
          "mt-2 flex items-center gap-2 text-sm font-medium transition-all duration-300",
          "text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
        )}
      >
        <span>Acessar</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
