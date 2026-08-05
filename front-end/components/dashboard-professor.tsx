/**
 * Arquivo: front-end/components/dashboard-professor.tsx
 * Area: Front-end React (componentes)
 * Funcao: Dashboard do professor com controle de treinos, alunos e evolucao.
 * Onde fica: /front-end/components/dashboard-professor.tsx
 */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dumbbell,
  LogOut,
  Users,
  Clock,
  ClipboardList,
  Calendar,
  ChevronRight,
  ArrowLeftRight,
  Trash2,
  Search,
  Weight,
  Ruler,
  AlertTriangle,
  AlertCircle,
  Plus,
  FileText,
  PenLine,
  TrendingUp,
  UserCheck,
  UserX,
  CheckCircle2,
  MapPin,
} from "lucide-react"
import { workoutPlans, getAllExercises, getExercisesByCategory, getCategoryLabel, type Exercise, type WorkoutPlan, type GoalType, type ExerciseCategory } from "@/lib/workout-data"

interface DashboardProfessorProps {
  onLogout: () => void
}

type TrainingStatus = "ativo" | "vencendo" | "sem-treino"
type ProfessorAgendaStatus = "concluida" | "em-andamento" | "proxima"
type ProfessorAgendaPaymentStatus = "em-dia" | "atrasado"

interface EvolutionEntry {
  date: string
  weight: number
  note: string
}

interface StudentData {
  id: string
  name: string
  cpf: string
  age: number
  weight: number
  height: number
  imc: number
  goal: GoalType | ""
  plan: WorkoutPlan | null
  status: "ativo" | "inativo"
  trainingStatus: TrainingStatus
  startDate: string
  lastPlanDate: string
  evolution: EvolutionEntry[]
}

interface ProfessorAgendaStudent {
  name: string
  payment: ProfessorAgendaPaymentStatus
  present: boolean
}

interface ProfessorAgendaClass {
  id: string
  time: string
  name: string
  room: string
  status: ProfessorAgendaStatus
  students: ProfessorAgendaStudent[]
}

type ScratchWorkoutDay = {
  label: string
  muscleGroups: string
  exercises: Exercise[]
}

type StudentPlanUpdate = (plan: WorkoutPlan) => WorkoutPlan

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "peito", "costas", "pernas", "ombros", "biceps", "triceps", "abdomen", "gluteos", "cardio",
]

const createScratchWorkoutDays = (): ScratchWorkoutDay[] => [
  { label: "Treino A", muscleGroups: "", exercises: [] },
  { label: "Treino B", muscleGroups: "", exercises: [] },
  { label: "Treino C", muscleGroups: "", exercises: [] },
]

const getToday = () => new Date().toISOString().split("T")[0]

const cloneWorkoutPlan = (plan: WorkoutPlan): WorkoutPlan => ({
  ...plan,
  days: plan.days.map((day) => ({ ...day, exercises: day.exercises.map((exercise) => ({ ...exercise })) })),
})

const updatePlanExercise = (
  plan: WorkoutPlan,
  dayIndex: number,
  exerciseIndex: number,
  updateExercise: (exercises: Exercise[]) => Exercise[]
): WorkoutPlan => {
  const day = plan.days[dayIndex]
  if (!day) return plan

  return {
    ...plan,
    days: plan.days.map((currentDay, index) =>
      index === dayIndex ? { ...currentDay, exercises: updateExercise(currentDay.exercises) } : currentDay
    ),
  }
}

const filterExercises = (category: ExerciseCategory | "all", search: string): Exercise[] => {
  const exercises = category === "all" ? getAllExercises() : getExercisesByCategory(category)
  const normalizedSearch = search.trim().toLowerCase()

  return normalizedSearch
    ? exercises.filter((exercise) => exercise.name.toLowerCase().includes(normalizedSearch))
    : exercises
}

function calculateIMC(weight: number, height: number): number {
  // O IMC é usado como regra de classificação de risco para a tela, então qualquer ajuste na fórmula precisa ser tratado com cuidado.
  if (height <= 0) return 0
  const heightM = height / 100
  return Math.round((weight / (heightM * heightM)) * 10) / 10
}

function getIMCLabel(imc: number): { label: string; color: string } {
  // Traduz faixa de IMC para texto e classe visual no painel.
  if (imc < 18.5) return { label: "Abaixo do peso", color: "text-[oklch(0.65_0.18_250)]" }
  if (imc < 25) return { label: "Peso normal", color: "text-primary" }
  if (imc < 30) return { label: "Sobrepeso", color: "text-[oklch(0.75_0.15_85)]" }
  return { label: "Obesidade", color: "text-destructive" }
}

function getTrainingStatusInfo(status: TrainingStatus) {
  // Mapeia status do treino para rotulo e cores exibidas nos cards/tabelas.
  switch (status) {
    case "ativo":
      return { label: "Treino Ativo", dotColor: "bg-primary", textColor: "text-primary" }
    case "vencendo":
      return { label: "Treino Vencendo", dotColor: "bg-[oklch(0.75_0.15_85)]", textColor: "text-[oklch(0.75_0.15_85)]" }
    case "sem-treino":
      return { label: "Sem Treino", dotColor: "bg-destructive", textColor: "text-destructive" }
  }
}

export function DashboardProfessor({ onLogout }: DashboardProfessorProps) {
  // Estado principal de alunos acompanhados pelo professor.
  const [students, setStudents] = useState<StudentData[]>([
    {
      id: "1", name: "Ana Costa", cpf: "2024001001", age: 25, weight: 62, height: 165,
      imc: calculateIMC(62, 165), goal: "hipertrofia",
      plan: cloneWorkoutPlan(workoutPlans[0]),
      status: "ativo", trainingStatus: "ativo", startDate: "2025-01-15", lastPlanDate: "2026-01-20",
      evolution: [
        { date: "2026-01-20", weight: 62, note: "Inicio do treino de hipertrofia." },
        { date: "2026-02-10", weight: 63.2, note: "Bom progresso, aumentando cargas." },
      ],
    },
    {
      id: "2", name: "Bruno Lima", cpf: "2024001002", age: 30, weight: 95, height: 178,
      imc: calculateIMC(95, 178), goal: "emagrecimento",
      plan: cloneWorkoutPlan(workoutPlans[1]),
      status: "ativo", trainingStatus: "vencendo", startDate: "2025-02-01", lastPlanDate: "2026-01-05",
      evolution: [
        { date: "2026-01-05", weight: 97, note: "Inicio com foco em emagrecimento." },
        { date: "2026-02-01", weight: 95, note: "Perdeu 2kg, manter cardio intenso." },
      ],
    },
    {
      id: "3", name: "Carla Mota", cpf: "2024001003", age: 22, weight: 55, height: 160,
      imc: calculateIMC(55, 160), goal: "condicionamento",
      plan: cloneWorkoutPlan(workoutPlans[2]),
      status: "ativo", trainingStatus: "ativo", startDate: "2025-01-20", lastPlanDate: "2026-02-15",
      evolution: [
        { date: "2026-02-15", weight: 55, note: "Condicionamento em dia. Mantendo." },
      ],
    },
    {
      id: "4", name: "Diego Reis", cpf: "2024001004", age: 28, weight: 82, height: 175,
      imc: calculateIMC(82, 175), goal: "",
      plan: null,
      status: "ativo", trainingStatus: "sem-treino", startDate: "2026-02-20", lastPlanDate: "",
      evolution: [],
    },
    {
      id: "5", name: "Fernanda Souza", cpf: "2024001005", age: 24, weight: 68, height: 170,
      imc: calculateIMC(68, 170), goal: "",
      plan: null,
      status: "ativo", trainingStatus: "sem-treino", startDate: "2026-02-22", lastPlanDate: "",
      evolution: [],
    },
  ])

  // Estados de controle dos dialogs, filtros e pesquisa.
  const [showStudentDetail, setShowStudentDetail] = useState<StudentData | null>(null)
  const [detailTab, setDetailTab] = useState<"treino" | "evolucao">("treino")
  const [showSwapExercise, setShowSwapExercise] = useState<{
    studentId: string
    dayIndex: number
    exerciseIndex: number
  } | null>(null)
  const [swapCategoryFilter, setSwapCategoryFilter] = useState<ExerciseCategory | "all">("all")
  const [swapSearch, setSwapSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fluxo de criacao/edicao de treino personalizado.
  const [showAddWorkout, setShowAddWorkout] = useState<string | null>(null) // student id
  const [addWorkoutMode, setAddWorkoutMode] = useState<"choose" | "template" | "scratch" | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<GoalType | "">("")
  const [scratchGoal, setScratchGoal] = useState<GoalType | "">("")
  const [scratchDays, setScratchDays] = useState<ScratchWorkoutDay[]>(createScratchWorkoutDays)
  const [scratchAddExDay, setScratchAddExDay] = useState<number | null>(null)
  const [scratchExCategoryFilter, setScratchExCategoryFilter] = useState<ExerciseCategory | "all">("all")
  const [scratchExSearch, setScratchExSearch] = useState("")

  
  // Estados do formulario de evolucao corporal.
  const [evoWeight, setEvoWeight] = useState("")
  const [evoNote, setEvoNote] = useState("")
  
  // Refatoração tirar toda essa parte da agenda e colocar no back-end, mas por enquanto é mock para visualizacao de turmas e alunos.

  // Agenda diaria do professor (mock para visualizacao de turmas).
  const [todayClasses, setTodayClasses] = useState<ProfessorAgendaClass[]>([
    {
      id: "prof-class-1",
      time: "06:00",
      name: "Musculacao - Turma A",
      room: "Sala de Musculacao 1",
      status: "concluida",
      students: [
        { name: "Ana Costa", payment: "em-dia", present: true },
        { name: "Bruno Lima", payment: "em-dia", present: true },
        { name: "Diego Reis", payment: "atrasado", present: false },
      ],
    },
    {
      id: "prof-class-2",
      time: "08:00",
      name: "Funcional",
      room: "Studio A",
      status: "concluida",
      students: [
        { name: "Carla Mota", payment: "em-dia", present: true },
        { name: "Fernanda Souza", payment: "atrasado", present: true },
      ],
    },
    {
      id: "prof-class-3",
      time: "10:00",
      name: "Musculacao - Turma B",
      room: "Sala de Musculacao 2",
      status: "em-andamento",
      students: [
        { name: "Ana Costa", payment: "em-dia", present: true },
        { name: "Diego Reis", payment: "atrasado", present: false },
        { name: "Fernanda Souza", payment: "atrasado", present: false },
      ],
    },
    {
      id: "prof-class-4",
      time: "14:00",
      name: "Personal - Maria Silva",
      room: "Sala Funcional",
      status: "proxima",
      students: [{ name: "Maria Silva", payment: "em-dia", present: false }],
    },
    {
      id: "prof-class-5",
      time: "16:00",
      name: "Crossfit",
      room: "Box Cross",
      status: "proxima",
      students: [
        { name: "Bruno Lima", payment: "em-dia", present: false },
        { name: "Carla Mota", payment: "em-dia", present: false },
        { name: "Ana Costa", payment: "em-dia", present: false },
        { name: "Diego Reis", payment: "atrasado", present: false },
      ],
    },
    {
      id: "prof-class-6",
      time: "18:00",
      name: "Musculacao - Turma C",
      room: "Sala de Musculacao 3",
      status: "proxima",
      students: [
        { name: "Fernanda Souza", payment: "atrasado", present: false },
        { name: "Bruno Lima", payment: "em-dia", present: false },
        { name: "Carla Mota", payment: "em-dia", present: false },
        { name: "Ana Costa", payment: "em-dia", present: false },
        { name: "Diego Reis", payment: "atrasado", present: false },
      ],
    },
  ])
  const [showClassDetail, setShowClassDetail] = useState<ProfessorAgendaClass | null>(null)

  const updateStudent = (studentId: string, update: (student: StudentData) => StudentData) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) => (student.id === studentId ? update(student) : student))
    )
    setShowStudentDetail((student) => (student?.id === studentId ? update(student) : student))
  }

  const updateStudentPlan = (studentId: string, update: StudentPlanUpdate) => {
    updateStudent(studentId, (student) => (student.plan ? { ...student, plan: update(student.plan) } : student))
  }

  // Subconjuntos para priorizar alunos sem treino ou com treino para vencer.
  const pendingStudents = students.filter((s) => s.trainingStatus === "sem-treino")
  const expiringStudents = students.filter((s) => s.trainingStatus === "vencendo")

  const toggleStudentPresence = (classId: string, studentName: string) => {
    setTodayClasses((prev) =>
      prev.map((cls) =>
        cls.id === classId
          ? {
              ...cls,
              students: cls.students.map((student) =>
                student.name === studentName ? { ...student, present: !student.present } : student
              ),
            }
          : cls
      )
    )

    setShowClassDetail((prev) =>
      prev && prev.id === classId
        ? {
            ...prev,
            students: prev.students.map((student) =>
              student.name === studentName ? { ...student, present: !student.present } : student
            ),
          }
        : prev
    )
  }

  // Troca um exercicio especifico dentro do treino de um aluno.
  const handleSwapExercise = (newExercise: Exercise) => {
    if (!showSwapExercise) return
    const { studentId, dayIndex, exerciseIndex } = showSwapExercise

    updateStudentPlan(studentId, (plan) =>
      updatePlanExercise(plan, dayIndex, exerciseIndex, (exercises) =>
        exercises.map((exercise, index) => (index === exerciseIndex ? { ...newExercise } : exercise))
      )
    )

    setShowSwapExercise(null)
    setSwapCategoryFilter("all")
    setSwapSearch("")
  }

  // Remove exercicio do dia de treino selecionado.
  const handleRemoveExercise = (studentId: string, dayIndex: number, exerciseIndex: number) => {
    updateStudentPlan(studentId, (plan) =>
      updatePlanExercise(plan, dayIndex, exerciseIndex, (exercises) =>
        exercises.filter((_, index) => index !== exerciseIndex)
      )
    )
  }

  // Atribui plano pronto a partir dos templates definidos em workout-data.ts.
  const handleAssignTemplate = (studentId: string) => {
    if (!selectedTemplate) return
    const plan = workoutPlans.find((p) => p.goal === selectedTemplate)
    if (!plan) return
    const newPlan = cloneWorkoutPlan(plan)
    const today = getToday()

    updateStudent(studentId, (student) => ({
      ...student,
      plan: newPlan,
      goal: selectedTemplate,
      trainingStatus: "ativo",
      lastPlanDate: today,
    }))

    resetAddWorkout()
  }

  // Cria e atribui um plano totalmente customizado montado no modal.
  const handleAssignScratch = (studentId: string) => {
    if (!scratchGoal) return
    const goalLabel = workoutPlans.find((p) => p.goal === scratchGoal)?.goalLabel || scratchGoal
    const newPlan: WorkoutPlan = {
      id: `custom-${Date.now()}`,
      goalLabel,
      goal: scratchGoal,
      description: "Treino personalizado",
      days: scratchDays.map((d) => ({ ...d })),
    }
    const today = getToday()

    updateStudent(studentId, (student) => ({
      ...student,
      plan: newPlan,
      goal: scratchGoal,
      trainingStatus: "ativo",
      lastPlanDate: today,
    }))

    resetAddWorkout()
  }

  // Reseta estados do fluxo de criacao para evitar lixo de interacao anterior.
  const resetAddWorkout = () => {
    setShowAddWorkout(null)
    setAddWorkoutMode(null)
    setSelectedTemplate("")
    setScratchGoal("")
    setScratchDays(createScratchWorkoutDays())
    setScratchAddExDay(null)
    setScratchExCategoryFilter("all")
    setScratchExSearch("")
  }

  // Adiciona exercicio no treino em construcao (modo scratch).
  const addExerciseToScratchDay = (dayIndex: number, exercise: Exercise) => {
    setScratchDays((prev) => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], exercises: [...updated[dayIndex].exercises, { ...exercise }] }
      return updated
    })
  }

  // Remove exercicio de um dia no treino customizado.
  const removeExerciseFromScratchDay = (dayIndex: number, exIndex: number) => {
    setScratchDays((prev) => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], exercises: updated[dayIndex].exercises.filter((_, i) => i !== exIndex) }
      return updated
    })
  }

  const handleAddEvolution = (studentId: string) => {
    if (!evoWeight) return
    const weight = Number(evoWeight)
    const entry: EvolutionEntry = {
      date: getToday(),
      weight,
      note: evoNote,
    }

    updateStudent(studentId, (student) => ({
      ...student,
      weight,
      imc: calculateIMC(weight, student.height),
      evolution: [...student.evolution, entry],
    }))

    setEvoWeight("")
    setEvoNote("")
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cpf.includes(searchQuery)
  )

  const getSwapExercises = () => filterExercises(swapCategoryFilter, swapSearch)
  const getScratchExercises = () => filterExercises(scratchExCategoryFilter, scratchExSearch)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.55_0.15_250)]">
              <Dumbbell className="h-5 w-5 text-foreground" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-semibold font-mono text-foreground">FitPro</h1>
              <p className="text-xs text-muted-foreground">Painel do Professor</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold font-mono text-foreground">Ola, Professor</h2>
          <p className="mt-1 text-sm text-muted-foreground">Confira sua agenda, seus alunos e gerencie os treinos.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Aulas Hoje", value: "6", icon: Calendar },
            { label: "Meus Alunos", value: String(students.length), icon: Users },
            { label: "Horas Trabalhadas", value: "4h 30m", icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.55_0.15_250)]/15">
                  <stat.icon className="h-6 w-6 text-[oklch(0.65_0.18_250)]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold font-mono text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Tasks Alert */}
        {(pendingStudents.length > 0 || expiringStudents.length > 0) && (
          <Card className="mt-6 border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-[oklch(0.75_0.15_85)] font-mono">
                <AlertTriangle className="h-5 w-5" />
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {pendingStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setShowStudentDetail(s); setDetailTab("treino") }}
                  className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left transition-colors hover:bg-destructive/10"
                >
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name} <span className="text-xs text-destructive font-normal">(Novo)</span></p>
                    <p className="text-xs text-muted-foreground">Aguardando Ficha de Treino</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
              {expiringStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setShowStudentDetail(s); setDetailTab("treino") }}
                  className="flex items-center gap-3 rounded-lg border border-[oklch(0.75_0.15_85)]/20 bg-[oklch(0.75_0.15_85)]/5 p-3 text-left transition-colors hover:bg-[oklch(0.75_0.15_85)]/10"
                >
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[oklch(0.75_0.15_85)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Ficha com mais de 45 dias - Atualizar treino</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tabs: Agenda / Meus Alunos (no more "Cadastrar Aluno" tab) */}
        <Tabs defaultValue="agenda" className="mt-8">
          <TabsList className="bg-secondary">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="alunos">Meus Alunos</TabsTrigger>
          </TabsList>

          {/* TAB: Agenda */}
          <TabsContent value="agenda">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground font-mono">
                  <ClipboardList className="h-5 w-5 text-[oklch(0.65_0.18_250)]" />
                  Agenda de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {todayClasses.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setShowClassDetail(cls)}
                      className="flex items-center gap-4 rounded-lg border border-border bg-secondary p-3 text-left transition-colors hover:border-[oklch(0.55_0.15_250)]/30"
                    >
                      <span className="w-14 text-sm font-mono font-medium text-muted-foreground">{cls.time}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.students.length} aluno{cls.students.length > 1 ? "s" : ""}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cls.status === "concluida"
                            ? "bg-primary/15 text-primary"
                            : cls.status === "em-andamento"
                            ? "bg-[oklch(0.75_0.15_85)]/15 text-[oklch(0.75_0.15_85)]"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {cls.status === "concluida" ? "Concluida" : cls.status === "em-andamento" ? "Em andamento" : "Proxima"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Meus Alunos */}
          <TabsContent value="alunos">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground font-mono">
                    <Users className="h-5 w-5 text-[oklch(0.65_0.18_250)]" />
                    Meus Alunos ({students.length})
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {filteredStudents.map((student) => {
                    const imcInfo = getIMCLabel(student.imc)
                    const tsInfo = getTrainingStatusInfo(student.trainingStatus)
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 rounded-lg border border-border bg-secondary p-4 transition-colors hover:border-[oklch(0.55_0.15_250)]/30 cursor-pointer"
                        onClick={() => { setShowStudentDetail(student); setDetailTab("treino") }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") { setShowStudentDetail(student); setDetailTab("treino") } }}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/20 text-sm font-semibold text-[oklch(0.65_0.18_250)]">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{student.name}</p>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${tsInfo.dotColor}`} />
                              <span className={`text-xs font-medium ${tsInfo.textColor} hidden sm:inline`}>{tsInfo.label}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">CPF: {student.cpf}</p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          {student.plan && (
                            <Badge variant="outline" className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)]">
                              {student.plan.goalLabel}
                            </Badge>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Weight className="h-3 w-3" />{student.weight}kg
                            </span>
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />{student.height}cm
                            </span>
                            <span className={`font-medium ${imcInfo.color}`}>
                              IMC {student.imc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    )
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOG: Class Detail (Agenda) */}
      <Dialog open={!!showClassDetail} onOpenChange={(open) => !open && setShowClassDetail(null)}>
        <DialogContent className="bg-card border-border">
          {showClassDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground font-mono">
                  <Calendar className="h-5 w-5 text-[oklch(0.65_0.18_250)]" />
                  {showClassDetail.name}
                </DialogTitle>
                <DialogDescription>
                  Horario: {showClassDetail.time} - {showClassDetail.students.length} aluno{showClassDetail.students.length > 1 ? "s" : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-secondary p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Lista de Chamada</p>
                      <p className="text-xs text-muted-foreground">Marque a presenca e acompanhe a mensalidade da turma.</p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {showClassDetail.room}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {showClassDetail.students.map((student) => (
                    <div key={`${showClassDetail.id}-${student.name}`} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/20 text-xs font-semibold text-[oklch(0.65_0.18_250)]">
                        {student.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{student.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs ${student.payment === "em-dia" ? "text-primary" : "text-destructive"}`}>
                            {student.payment === "em-dia" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {student.payment === "em-dia" ? "Mensalidade em dia" : "Mensalidade atrasada"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={student.present ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStudentPresence(showClassDetail.id, student.name)}
                        className={student.present ? "gap-2" : "gap-2 border-border text-foreground hover:bg-background"}
                      >
                        {student.present ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        {student.present ? "Presente" : "Marcar Presenca"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowClassDetail(null)} className="text-muted-foreground">Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Student Detail */}
      <Dialog open={!!showStudentDetail} onOpenChange={(open) => { if (!open) setShowStudentDetail(null) }}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
          {showStudentDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-foreground font-mono">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/20 text-sm font-semibold text-[oklch(0.65_0.18_250)]">
                    {showStudentDetail.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  {showStudentDetail.name}
                </DialogTitle>
                <DialogDescription>CPF: {showStudentDetail.cpf}</DialogDescription>
              </DialogHeader>

              {/* Student info grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Idade", value: `${showStudentDetail.age} anos` },
                  { label: "Peso", value: `${showStudentDetail.weight} kg` },
                  { label: "Altura", value: `${showStudentDetail.height} cm` },
                  { label: "IMC", value: `${showStudentDetail.imc} - ${getIMCLabel(showStudentDetail.imc).label}` },
                ].map((info) => (
                  <div key={info.label} className="rounded-lg bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="text-sm font-medium text-foreground">{info.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {showStudentDetail.plan && (
                  <Badge variant="outline" className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)]">
                    {showStudentDetail.plan.goalLabel}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-muted-foreground">
                  Inicio: {new Date(showStudentDetail.startDate).toLocaleDateString("pt-BR")}
                </Badge>
                {(() => {
                  const tsInfo = getTrainingStatusInfo(showStudentDetail.trainingStatus)
                  return (
                    <Badge variant="outline" className={`${tsInfo.textColor} border-current/30`}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${tsInfo.dotColor}`} />
                      {tsInfo.label}
                    </Badge>
                  )
                })()}
              </div>

              {/* Detail tabs: Treino / Evolucao */}
              <div className="flex gap-1 rounded-lg bg-secondary p-1">
                <button
                  onClick={() => setDetailTab("treino")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    detailTab === "treino" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ClipboardList className="mr-1.5 inline h-4 w-4" />
                  Plano de Treino
                </button>
                <button
                  onClick={() => setDetailTab("evolucao")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    detailTab === "evolucao" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="mr-1.5 inline h-4 w-4" />
                  Evolucao
                </button>
              </div>

              {/* TAB: Treino */}
              {detailTab === "treino" && (
                <div className="flex flex-col gap-4">
                  {showStudentDetail.plan ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground font-mono">Plano de Treino ABC</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10"
                          onClick={() => { setShowAddWorkout(showStudentDetail.id); setAddWorkoutMode("choose") }}
                        >
                          <PenLine className="mr-1.5 h-3.5 w-3.5" />
                          Trocar Plano
                        </Button>
                      </div>
                      {showStudentDetail.plan.days.map((day, dayIdx) => (
                        <div key={dayIdx} className="rounded-lg border border-border bg-secondary p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{day.label}</p>
                              <p className="text-xs text-muted-foreground">{day.muscleGroups}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {day.exercises.map((exercise, exIdx) => (
                              <div key={exIdx} className="flex items-center gap-3 rounded-md bg-background p-2.5 text-sm">
                                <span className="w-5 text-xs font-mono text-muted-foreground">{exIdx + 1}</span>
                                <span className="flex-1 text-foreground">{exercise.name}</span>
                                <span className="text-xs text-muted-foreground">{exercise.sets}x{exercise.reps}</span>
                                <button
                                  onClick={() => setShowSwapExercise({ studentId: showStudentDetail.id, dayIndex: dayIdx, exerciseIndex: exIdx })}
                                  className="rounded p-1 text-muted-foreground hover:text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10 transition-colors"
                                  title="Trocar exercicio"
                                >
                                  <ArrowLeftRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveExercise(showStudentDetail.id, dayIdx, exIdx)}
                                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Remover exercicio"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Este aluno ainda nao possui treino</p>
                        <p className="text-xs text-muted-foreground mt-1">Crie uma ficha de treino para esse aluno.</p>
                      </div>
                      <Button
                        className="bg-[oklch(0.55_0.15_250)] text-foreground hover:bg-[oklch(0.55_0.15_250)]/90"
                        onClick={() => { setShowAddWorkout(showStudentDetail.id); setAddWorkoutMode("choose") }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Treino
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Evolucao */}
              {detailTab === "evolucao" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-foreground font-mono">Historico de Evolucao</p>

                  {/* Add new entry */}
                  <div className="rounded-lg border border-border bg-secondary p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Nova Anotacao</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-foreground">Peso Atual (kg)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 65"
                          value={evoWeight}
                          onChange={(e) => setEvoWeight(e.target.value)}
                          className="h-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-foreground">Observacao</Label>
                        <Input
                          placeholder="Ex: Evitar agachamento pesado"
                          value={evoNote}
                          onChange={(e) => setEvoNote(e.target.value)}
                          className="h-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={!evoWeight}
                      onClick={() => handleAddEvolution(showStudentDetail.id)}
                      className="mt-3 bg-[oklch(0.55_0.15_250)] text-foreground hover:bg-[oklch(0.55_0.15_250)]/90"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Registrar
                    </Button>
                  </div>

                  {/* Timeline */}
                  {showStudentDetail.evolution.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {[...showStudentDetail.evolution].reverse().map((entry, i) => (
                        <div key={i} className="flex gap-3 rounded-lg bg-secondary p-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.18_250)]" />
                            {i < showStudentDetail.evolution.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString("pt-BR")}
                              </span>
                              <Badge variant="secondary" className="text-xs">{entry.weight} kg</Badge>
                            </div>
                            {entry.note && <p className="text-sm text-foreground">{entry.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhum registro de evolucao ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Add/Change Workout */}
      <Dialog open={!!showAddWorkout} onOpenChange={(open) => { if (!open) resetAddWorkout() }}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-mono">
              <Plus className="h-5 w-5 text-[oklch(0.65_0.18_250)]" />
              {addWorkoutMode === "choose" ? "Adicionar Treino" : addWorkoutMode === "template" ? "Usar Treino Padrao" : "Criar do Zero"}
            </DialogTitle>
            <DialogDescription>
              {addWorkoutMode === "choose"
                ? "Escolha como deseja criar o treino para este aluno."
                : addWorkoutMode === "template"
                ? "Selecione um template pre-pronto para aplicar."
                : "Monte a ficha de treino exercicio por exercicio."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Choose mode */}
          {addWorkoutMode === "choose" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setAddWorkoutMode("template")}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-secondary p-6 transition-all hover:border-[oklch(0.55_0.15_250)]/40 hover:bg-[oklch(0.55_0.15_250)]/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/15">
                  <FileText className="h-7 w-7 text-[oklch(0.65_0.18_250)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Usar Treino Padrao</p>
                  <p className="text-xs text-muted-foreground mt-1">Selecione um template pre-pronto e personalize depois.</p>
                </div>
              </button>
              <button
                onClick={() => setAddWorkoutMode("scratch")}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-secondary p-6 transition-all hover:border-[oklch(0.55_0.15_250)]/40 hover:bg-[oklch(0.55_0.15_250)]/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/15">
                  <PenLine className="h-7 w-7 text-[oklch(0.65_0.18_250)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Criar do Zero</p>
                  <p className="text-xs text-muted-foreground mt-1">Monte a ficha manualmente, exercicio por exercicio.</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2a: Template selection */}
          {addWorkoutMode === "template" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Selecione o Template</Label>
                <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as GoalType)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Escolha um plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutPlans.map((p) => (
                      <SelectItem key={p.id} value={p.goal}>
                        {p.goalLabel} - ABC ({p.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="flex flex-col gap-3">
                  {workoutPlans
                    .find((p) => p.goal === selectedTemplate)
                    ?.days.map((day, i) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary p-3">
                        <p className="text-sm font-medium text-foreground">{day.label}</p>
                        <p className="text-xs text-muted-foreground mb-2">{day.muscleGroups}</p>
                        {day.exercises.map((ex, j) => (
                          <p key={j} className="text-xs text-muted-foreground">
                            {j + 1}. {ex.name} - {ex.sets}x{ex.reps}
                          </p>
                        ))}
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAddWorkoutMode("choose")} className="text-muted-foreground">Voltar</Button>
                <Button
                  disabled={!selectedTemplate}
                  onClick={() => showAddWorkout && handleAssignTemplate(showAddWorkout)}
                  className="bg-[oklch(0.55_0.15_250)] text-foreground hover:bg-[oklch(0.55_0.15_250)]/90"
                >
                  Aplicar Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2b: Create from scratch */}
          {addWorkoutMode === "scratch" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Objetivo do Treino</Label>
                <Select value={scratchGoal} onValueChange={(v) => setScratchGoal(v as GoalType)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione o objetivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="condicionamento">Condicionamento</SelectItem>
                    <SelectItem value="funcional">Funcional</SelectItem>
                    <SelectItem value="forca">Forca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Days editor */}
              {scratchDays.map((day, dayIdx) => (
                <div key={dayIdx} className="rounded-lg border border-border bg-secondary p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{day.label}</p>
                      <Input
                        placeholder="Ex: Peito / Triceps"
                        value={day.muscleGroups}
                        onChange={(e) => {
                          setScratchDays((prev) => {
                            const updated = [...prev]
                            updated[dayIdx] = { ...updated[dayIdx], muscleGroups: e.target.value }
                            return updated
                          })
                        }}
                        className="mt-1 h-8 text-xs bg-background border-border text-foreground placeholder:text-muted-foreground w-48"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScratchAddExDay(scratchAddExDay === dayIdx ? null : dayIdx)}
                      className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)]"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Exercicio
                    </Button>
                  </div>

                  {/* Exercise list for this day */}
                  {day.exercises.length > 0 ? (
                    <div className="flex flex-col gap-2 mb-2">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex items-center gap-3 rounded-md bg-background p-2.5 text-sm">
                          <span className="w-5 text-xs font-mono text-muted-foreground">{exIdx + 1}</span>
                          <span className="flex-1 text-foreground">{ex.name}</span>
                          <span className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</span>
                          <button
                            onClick={() => removeExerciseFromScratchDay(dayIdx, exIdx)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mb-2">Nenhum exercicio adicionado.</p>
                  )}

                  {/* Exercise search panel (inline) */}
                  {scratchAddExDay === dayIdx && (
                    <div className="mt-2 rounded-lg border border-[oklch(0.55_0.15_250)]/20 bg-background p-3">
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar exercicio..."
                            value={scratchExSearch}
                            onChange={(e) => setScratchExSearch(e.target.value)}
                            className="pl-8 h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setScratchExCategoryFilter("all")}
                            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                              scratchExCategoryFilter === "all"
                                ? "bg-[oklch(0.55_0.15_250)] text-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Todos
                          </button>
                          {EXERCISE_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setScratchExCategoryFilter(cat)}
                              className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                                scratchExCategoryFilter === cat
                                  ? "bg-[oklch(0.55_0.15_250)] text-foreground"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {getCategoryLabel(cat)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {getScratchExercises().map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => addExerciseToScratchDay(dayIdx, ex)}
                            className="flex items-center gap-2 rounded-md bg-secondary p-2 text-left text-xs transition-colors hover:bg-[oklch(0.55_0.15_250)]/10"
                          >
                            <Plus className="h-3.5 w-3.5 text-[oklch(0.65_0.18_250)] shrink-0" />
                            <span className="flex-1 text-foreground">{ex.name}</span>
                            <span className="text-muted-foreground capitalize">{ex.category}</span>
                            <span className="text-muted-foreground">{ex.sets}x{ex.reps}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAddWorkoutMode("choose")} className="text-muted-foreground">Voltar</Button>
                <Button
                  disabled={!scratchGoal || scratchDays.every((d) => d.exercises.length === 0)}
                  onClick={() => showAddWorkout && handleAssignScratch(showAddWorkout)}
                  className="bg-[oklch(0.55_0.15_250)] text-foreground hover:bg-[oklch(0.55_0.15_250)]/90"
                >
                  Salvar Treino
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Swap Exercise */}
      <Dialog open={!!showSwapExercise} onOpenChange={(open) => { if (!open) { setShowSwapExercise(null); setSwapCategoryFilter("all"); setSwapSearch("") } }}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-mono">Trocar Exercicio</DialogTitle>
            <DialogDescription>Selecione o novo exercicio para substituir.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercicio..."
                value={swapSearch}
                onChange={(e) => setSwapSearch(e.target.value)}
                className="pl-9 h-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSwapCategoryFilter("all")}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  swapCategoryFilter === "all" ? "bg-[oklch(0.55_0.15_250)] text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
              {EXERCISE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSwapCategoryFilter(cat)}
                  className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                    swapCategoryFilter === cat ? "bg-[oklch(0.55_0.15_250)] text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {getSwapExercises().map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSwapExercise(ex)}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-colors hover:border-[oklch(0.55_0.15_250)]/30 hover:bg-secondary/80"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ex.category} - {ex.sets}x{ex.reps}</p>
                </div>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowSwapExercise(null); setSwapCategoryFilter("all"); setSwapSearch("") }} className="text-muted-foreground">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
