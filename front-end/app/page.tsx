/**
 * Arquivo: front-end/app/page.tsx
 * Area: Front-end Next.js (App Router)
 * Funcao: Tela inicial do sistema FitPro: selecao de perfil, login e redirecionamento para dashboards.
 * Onde fica: /front-end/app/page.tsx
 */
"use client"

import { useState } from "react"
import { RoleCard } from "@/components/role-card"
import { LoginForm } from "@/components/login-form"
import { DashboardAdmin } from "@/components/dashboard-admin"
import { DashboardProfessor } from "@/components/dashboard-professor"
import { DashboardStudent } from "@/components/dashboard-student"
import { Shield, GraduationCap, User, Dumbbell } from "lucide-react"

type Role = "admin" | "professor" | "student" | null
type View = "select" | "login" | "dashboard"

type RoleConfig = {
  label: string
  description: string
  icon: typeof Shield
  accentColor: string
}

const roles: Record<Exclude<Role, null>, RoleConfig> = {
  admin: {
    label: "Administração",
    description: "Gerencie alunos, professores, financeiro e relatorios.",
    icon: Shield,
    accentColor: "bg-primary/15",
  },
  professor: {
    label: "Professor",
    description: "Acompanhe seus alunos, agenda e planos de treino.",
    icon: GraduationCap,
    accentColor: "bg-[oklch(0.55_0.15_250)]/20",
  },
  student: {
    label: "Aluno",
    description: "Veja seu treino, progresso e conquistas pessoais.",
    icon: User,
    accentColor: "bg-[oklch(0.65_0.20_30)]/15",
  },
}

const roleOrder = Object.keys(roles) as Array<Exclude<Role, null>>

const dashboardByRole = {
  admin: DashboardAdmin,
  professor: DashboardProfessor,
  student: DashboardStudent,
} as const

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [view, setView] = useState<View>("select")

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role)
    setView("login")
  }

  const handleBack = () => {
    setView("select")
    setSelectedRole(null)
  }

  const handleLogin = () => {
    setView("dashboard")
  }

  const handleLogout = () => {
    setView("select")
    setSelectedRole(null)
  }

  if (view === "dashboard" && selectedRole) {
    const DashboardComponent = dashboardByRole[selectedRole]
    return <DashboardComponent onLogout={handleLogout} />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[oklch(0.55_0.15_250)]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        {view === "select" && (
          <div className="flex w-full flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                <Dumbbell className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground sm:text-4xl text-balance">
                  FitPro
                </h1>
                <p className="mt-2 text-base text-muted-foreground max-w-md text-pretty">
                  Sistema de gerenciamento de academia. Selecione seu perfil para continuar.
                </p>
              </div>
            </div>

            <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-3">
              {roleOrder.map((roleKey) => {
                const role = roles[roleKey]

                return (
                  <RoleCard
                    key={roleKey}
                    title={role.label}
                    description={role.description}
                    icon={role.icon}
                    accentColor={role.accentColor}
                    onClick={() => handleSelectRole(roleKey)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {view === "login" && selectedRole && (
          <LoginForm
            role={selectedRole}
            roleLabel={roles[selectedRole].label}
            icon={roles[selectedRole].icon}
            accentColor={roles[selectedRole].accentColor}
            onBack={handleBack}
            onLogin={handleLogin}
          />
        )}
      </div>
    </main>
  )
}
