
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
  Users,
  Dumbbell,
  DollarSign,
  TrendingUp,
  LogOut,
  BarChart3,
  Calendar,
  Settings,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Plus,
  UserPlus,
  Phone,
  Mail,
  CreditCard,
  Edit,
  Trash2,
  XCircle,
  Tag,
  MapPin,
  ArrowLeftRight,
  MessageCircle,
  Wrench,
  Package,
  ClipboardCheck,
  UserX,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DashboardAdminProps {
  onLogout: () => void
}

type SheetType = "alunos" | "professores" | "financeiro" | "agenda" | "relatorios" | "planos" | null
type StudentFilter = "todos" | "em-dia" | "atrasado" | "inativo"
type ProfessorFilter = "todos" | "ativo" | "ferias" | "inativo"
type FinanceDialogType = "despesa" | "recebimento" | null
type AgendaDialogType = "criar-turma" | "editar-turma" | "cancelar-aula" | null
type AlertView = "prioridade" | "informativos"
type ProfessorStatus = "ativo" | "ferias" | "inativo"
type FinanceEntryType = "receita" | "despesa"
type ReceiptStatus = "pago" | "pendente" | "atrasado"
type ClassProfessorStatus = "confirmado" | "presente"

interface Student {
  name: string
  cpf: string
  plan: string
  status: string
  payment: string
  phone: string
  email: string
  vencimento: string
  lastPayment: string
  age: number
  weight: string
}

interface Professor {
  name: string
  cpf: string
  speciality: string
  students: number
  status: ProfessorStatus
  phone: string
  email: string
  horario: string
  salario: string
  modalidades: string[]
}

interface Plan {
  id: string
  name: string
  price: string
  duration: string
  modalities: string[]
  benefits: string[]
  active: boolean
  activeStudentsCount?: number
}

interface PlanForm {
  name: string
  price: string
  duration: string
  modalities: string[]
  benefits: string[]
}

interface PlanReallocationForm {
  targetPlanId: string
}

interface StudentClassReallocationForm {
  sourceClassId: string
  targetClassId: string
}

interface AgendaClassForm {
  event: string
  professor: string
  time: string
  room: string
  capacity: string
}

interface DashboardAlert {
  id: string
  type: "danger" | "warning" | "info"
  group: AlertView
  title: string
  message: string
  detail?: string
  icon: typeof AlertCircle
  primaryActionLabel: string
  secondaryActionLabel?: string
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
}

interface DashboardAlertApiAction {
  id: string
  label: string
  studentCpf?: string
  studentPhone?: string
  classId?: string
}

interface DashboardAlertApi {
  id: string
  type: "danger" | "warning" | "info"
  group: AlertView
  icon: "alert-circle" | "clock" | "user-x" | "clipboard-check" | "user-plus"
  title: string
  message: string
  detail?: string
  primaryAction: DashboardAlertApiAction
  secondaryAction?: DashboardAlertApiAction
}

interface FinanceEntry {
  id: string
  type: FinanceEntryType
  description: string
  category: string
  amount: number
  date: string
}

interface FinanceForm {
  description: string
  value: string
  category: string
  date: string
}

interface AutomatedReceipt {
  id: string
  studentName: string
  studentCpf: string
  reference: string
  description: string
  provider: string
  externalId?: string | null
  status: ReceiptStatus
  amount: number
  amountLabel: string
  dueDate: string
  paidAt?: string | null
  paidAtLabel: string
  createdAt: string
}

interface ReceiptsSummary {
  previsto: number
  previstoLabel: string
  realizado: number
  realizadoLabel: string
  statusTotals: Record<ReceiptStatus, number>
}

interface PayrollEntry {
  id: number
  professorId: number
  professorName: string
  professorCpf: string
  reference: string
  baseAmount: number
  baseAmountLabel: string
  adjustedAmount: number
  adjustedAmountLabel: string
  dueDate: string
  dueDateIso: string
  status: "provisionado" | "ajustado" | "pago"
  notes: string
  createdAt: string
  updatedAt: string
}

interface PayrollSummary {
  totalBase: number
  totalBaseLabel: string
  totalAdjusted: number
  totalAdjustedLabel: string
  adjustedCount: number
}

interface PayrollAdjustmentForm {
  amount: string
  dueDate: string
  notes: string
}

interface AgendaStudent {
  name: string
  cpf?: string | null
  payment: "em-dia" | "atrasado"
  present: boolean
}

interface AgendaClass {
  id: string
  time: string
  event: string
  professor: string
  professorStatus: ClassProfessorStatus
  room: string
  capacity: number
  students: AgendaStudent[]
}

interface AddStudentForm {
  name: string
  cpf: string
  phone: string
  email: string
  age: string
  weight: string
  planId: string
}

interface AddProfessorForm {
  name: string
  cpf: string
  phone: string
  email: string
  horario: string
  salario: string
  speciality: string
}

interface EditProfessorForm extends AddProfessorForm {
  status: ProfessorStatus
}

type VacationAction = "aprovada" | "reprovada" | "realocada" | "concedida"

interface VacationHistoryEntry {
  id: string
  action: VacationAction
  startDate: string
  endDate: string
  createdAt: string
}

interface CreatedStudentCredentials {
  name: string
  cpf: string
  temporaryPassword: string
}

const EMPTY_ADD_STUDENT_FORM: AddStudentForm = {
  name: "",
  cpf: "",
  phone: "",
  email: "",
  age: "",
  weight: "",
  planId: "",
}

const EMPTY_ADD_PROFESSOR_FORM: AddProfessorForm = {
  name: "",
  cpf: "",
  phone: "",
  email: "",
  horario: "",
  salario: "",
  speciality: "",
}

const EMPTY_EDIT_PROFESSOR_FORM: EditProfessorForm = {
  name: "",
  cpf: "",
  phone: "",
  email: "",
  horario: "",
  salario: "",
  speciality: "",
  status: "ativo",
}

const EMPTY_FINANCE_FORM: FinanceForm = {
  description: "",
  value: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
}

const EMPTY_PAYROLL_ADJUSTMENT_FORM: PayrollAdjustmentForm = {
  amount: "",
  dueDate: "",
  notes: "",
}

const EMPTY_PLAN_FORM: PlanForm = {
  name: "",
  price: "R$ 0,00",
  duration: "",
  modalities: [],
  benefits: [],
}

const EMPTY_PLAN_REALLOCATION_FORM: PlanReallocationForm = {
  targetPlanId: "",
}

const EMPTY_STUDENT_CLASS_REALLOCATION_FORM: StudentClassReallocationForm = {
  sourceClassId: "",
  targetClassId: "",
}

const EMPTY_AGENDA_CLASS_FORM: AgendaClassForm = {
  event: "",
  professor: "",
  time: "",
  room: "",
  capacity: "",
}

const PROFESSOR_SPECIALITIES = ["Musculacao", "Funcional", "Crossfit", "Personal", "Pilates", "Natacao", "HIIT", "Yoga", "Hidroginastica"]
const PLAN_BENEFIT_OPTIONS = [
  "Acesso livre a musculacao",
  "Aulas coletivas inclusas",
  "Armario",
  "Vestiario VIP",
  "Avaliacao fisica",
  "Personal 2x/semana",
  "Suporte nutricional",
  "Sem taxa de matricula",
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

const NAME_REGEX = /^[\p{L}\s'-]+$/u
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const normalizeDigits = (value: string) => value.replace(/\D/g, "")
const normalizePlanLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^plano\s+/, "")
    .replace(/[^a-z0-9]+/g, "")

const normalizeNameLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")

const formatCpf = (value: string) => {
  const digits = normalizeDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

const formatPhone = (value: string) => {
  const digits = normalizeDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

const normalizeWeightValue = (value: string) =>
  value
    .replace(",", ".")
    .replace(/[^0-9.]/g, "")
    .replace(/^(\d+\.\d{0,2}).*$/, "$1")
    .replace(/(\..*)\./g, "$1")

const isValidCpf = (value: string) => {
  const cpf = normalizeDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  return check === Number(cpf[10])
}

const normalizeSalaryValue = (value: string) =>
  value
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".")
    .replace(/^(-?\d+(\.\d{0,2})?).*$/, "$1")

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, "")
  if (!digits) return "R$ 0,00"

  const amount = Number(digits) / 100
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

const getReceiptStatusLabel = (status: ReceiptStatus) => {
  switch (status) {
    case "pago":
      return "Pago"
    case "pendente":
      return "Pendente"
    case "atrasado":
      return "Atrasado"
  }
}

const getReceiptStatusClasses = (status: ReceiptStatus) => {
  switch (status) {
    case "pago":
      return "border-primary/30 bg-primary/10 text-primary"
    case "pendente":
      return "border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.75_0.15_85)]"
    case "atrasado":
      return "border-destructive/30 bg-destructive/10 text-destructive"
  }
}

const getVacationActionLabel = (action: VacationAction) => {
  switch (action) {
    case "aprovada":
      return "Ferias aprovadas"
    case "reprovada":
      return "Ferias reprovadas"
    case "realocada":
      return "Ferias realocadas"
    case "concedida":
      return "Ferias concedidas"
  }
}

const getVacationActionClasses = (action: VacationAction) => {
  switch (action) {
    case "aprovada":
      return "border-primary/30 bg-primary/10 text-primary"
    case "concedida":
      return "border-[oklch(0.65_0.18_250)]/30 bg-[oklch(0.55_0.15_250)]/10 text-[oklch(0.65_0.18_250)]"
    case "realocada":
      return "border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.75_0.15_85)]"
    case "reprovada":
      return "border-destructive/30 bg-destructive/10 text-destructive"
  }
}

const SCHEDULE_REGEX = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/

export function DashboardAdmin({ onLogout }: DashboardAdminProps) {
  // Estados de controle da interface (aberturas de sheets, dialogs e selecoes).
  const [activeSheet, setActiveSheet] = useState<SheetType>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("todos")
  const [professorFilter, setProfessorFilter] = useState<ProfessorFilter>("todos")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showProfessorModal, setShowProfessorModal] = useState(false)
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [showAddProfessorDialog, setShowAddProfessorDialog] = useState(false)
  const [showEditProfessorDialog, setShowEditProfessorDialog] = useState(false)
  const [showProfessorVacationDialog, setShowProfessorVacationDialog] = useState(false)
  const [financeDialog, setFinanceDialog] = useState<FinanceDialogType>(null)
  const [showPayrollAdjustDialog, setShowPayrollAdjustDialog] = useState(false)
  const [agendaDialog, setAgendaDialog] = useState<AgendaDialogType>(null)
  const [selectedAgendaClassId, setSelectedAgendaClassId] = useState<string | null>(null)
  const [showAddPlanDialog, setShowAddPlanDialog] = useState(false)
  const [showPlanReallocationDialog, setShowPlanReallocationDialog] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false)
  const [showStudentClassReallocationDialog, setShowStudentClassReallocationDialog] = useState(false)
  const [editStudentForm, setEditStudentForm] = useState<Student | null>(null)
  const [selectedAgendaClassForAction, setSelectedAgendaClassForAction] = useState<AgendaClass | null>(null)
  const [addStudentForm, setAddStudentForm] = useState<AddStudentForm>(EMPTY_ADD_STUDENT_FORM)
  const [addStudentFieldErrors, setAddStudentFieldErrors] = useState<Partial<Record<keyof AddStudentForm, string>>>({})
  const [addStudentError, setAddStudentError] = useState("")
  const [createdStudentCredentials, setCreatedStudentCredentials] = useState<CreatedStudentCredentials | null>(null)
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [addProfessorForm, setAddProfessorForm] = useState<AddProfessorForm>(EMPTY_ADD_PROFESSOR_FORM)
  const [addProfessorFieldErrors, setAddProfessorFieldErrors] = useState<Partial<Record<keyof AddProfessorForm, string>>>({})
  const [addProfessorError, setAddProfessorError] = useState("")
  const [isSavingProfessor, setIsSavingProfessor] = useState(false)
  const [editProfessorForm, setEditProfessorForm] = useState<EditProfessorForm>(EMPTY_EDIT_PROFESSOR_FORM)
  const [editProfessorFieldErrors, setEditProfessorFieldErrors] = useState<Partial<Record<keyof EditProfessorForm, string>>>({})
  const [editProfessorError, setEditProfessorError] = useState("")
  const [isUpdatingProfessor, setIsUpdatingProfessor] = useState(false)
  const [selectedProfessorForVacation, setSelectedProfessorForVacation] = useState<Professor | null>(null)
  const [vacationStartDate, setVacationStartDate] = useState("2026-07-01")
  const [vacationEndDate, setVacationEndDate] = useState("2026-07-15")
  const [vacationError, setVacationError] = useState("")
  const [vacationHistoryByProfessor, setVacationHistoryByProfessor] = useState<Record<string, VacationHistoryEntry[]>>({})
  const [financeForm, setFinanceForm] = useState<FinanceForm>(EMPTY_FINANCE_FORM)
  const [financeFormError, setFinanceFormError] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("R$ 0,00")
  const [planPrice, setPlanPrice] = useState("R$ 0,00")
  const [planForm, setPlanForm] = useState<PlanForm>(EMPTY_PLAN_FORM)
  const [planBenefitInput, setPlanBenefitInput] = useState("")
  const [planFormError, setPlanFormError] = useState("")
  const [plansError, setPlansError] = useState("")
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isUpdatingPlanStatusId, setIsUpdatingPlanStatusId] = useState<string | null>(null)
  const [selectedPlanForReallocation, setSelectedPlanForReallocation] = useState<Plan | null>(null)
  const [planReallocationForm, setPlanReallocationForm] = useState<PlanReallocationForm>(EMPTY_PLAN_REALLOCATION_FORM)
  const [planReallocationError, setPlanReallocationError] = useState("")
  const [isReallocatingPlanStudents, setIsReallocatingPlanStudents] = useState(false)
  const [studentClassReallocationForm, setStudentClassReallocationForm] = useState<StudentClassReallocationForm>(EMPTY_STUDENT_CLASS_REALLOCATION_FORM)
  const [studentClassReallocationError, setStudentClassReallocationError] = useState("")
  const [agendaClassForm, setAgendaClassForm] = useState<AgendaClassForm>(EMPTY_AGENDA_CLASS_FORM)
  const [agendaClassError, setAgendaClassError] = useState("")
  const [isSavingAgendaClass, setIsSavingAgendaClass] = useState(false)
  const [automatedReceipts, setAutomatedReceipts] = useState<AutomatedReceipt[]>([])
  const [receiptsSummary, setReceiptsSummary] = useState<ReceiptsSummary>({
    previsto: 0,
    previstoLabel: "R$ 0,00",
    realizado: 0,
    realizadoLabel: "R$ 0,00",
    statusTotals: {
      pago: 0,
      pendente: 0,
      atrasado: 0,
    },
  })
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([])
  const [payrollReference, setPayrollReference] = useState("")
  const [defaultPayrollDueDate, setDefaultPayrollDueDate] = useState("")
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalBase: 0,
    totalBaseLabel: "R$ 0,00",
    totalAdjusted: 0,
    totalAdjustedLabel: "R$ 0,00",
    adjustedCount: 0,
  })
  const [selectedPayrollEntry, setSelectedPayrollEntry] = useState<PayrollEntry | null>(null)
  const [payrollAdjustmentForm, setPayrollAdjustmentForm] = useState<PayrollAdjustmentForm>(EMPTY_PAYROLL_ADJUSTMENT_FORM)
  const [payrollAdjustmentError, setPayrollAdjustmentError] = useState("")
  const [isSavingPayrollAdjustment, setIsSavingPayrollAdjustment] = useState(false)
  const [alertView, setAlertView] = useState<AlertView>("prioridade")
  const [dashboardAlertsRaw, setDashboardAlertsRaw] = useState<DashboardAlertApi[]>([])
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  // Cards de resumo exibidos no topo do painel.
  const stats = [
    { label: "Alunos Ativos", value: "0", icon: Users, change: "-" },
    { label: "Professores", value: "0", icon: Dumbbell, change: "-" },
    { label: "Receita Mensal", value: "R$ 0,00", icon: DollarSign, change: "-" },
    { label: "Novos Alunos", value: "0", icon: TrendingUp, change: "-" },
  ]

  // Historico rapido de eventos recentes na academia.
  const recentActions: Array<{ action: string; name: string; time: string }> = []

  // Base local de alunos (mock) usada para listagem, filtros e edicao.
  const initialStudents: Student[] = []
  const [allStudents, setAllStudents] = useState<Student[]>(initialStudents)

  // Lista consolidada de professores.
  const initialProfessors: Professor[] = []
  const [allProfessors, setAllProfessors] = useState<Professor[]>(initialProfessors)

  // Dados financeiros (mock) para area de faturamento.
  const financialData: Array<{ month: string; receita: string; despesas: string; lucro: string; status: string }> = []

  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([])

  // Agenda de aulas e eventos do dia.
  const [agendaToday, setAgendaToday] = useState<AgendaClass[]>([])

  // Bloco de relatórios administrativos resumidos.
  const reports: Array<{ title: string; description: string; value: string; trend: string }> = []

  // Catalogo de planos disponiveis para contratacao.
  const [plans, setPlans] = useState<Plan[]>([])

  // Atalhos para abrir cada modulo dentro do painel.
  const quickActions = [
    { label: "Gerenciar Alunos", icon: Users, sheet: "alunos" as SheetType },
    { label: "Gerenciar Professores", icon: Dumbbell, sheet: "professores" as SheetType },
    { label: "Financeiro", icon: DollarSign, sheet: "financeiro" as SheetType },
    { label: "Agenda", icon: Calendar, sheet: "agenda" as SheetType },
    { label: "Relatorios", icon: BarChart3, sheet: "relatorios" as SheetType },
    { label: "Planos da Academia", icon: Tag, sheet: "planos" as SheetType },
  ]

  // Filtro combinado por busca textual + situacao financeira/atividade.
  useEffect(() => {
    let mounted = true

    const loadFromDatabase = async () => {
      try {
        const [studentsResponse, professorsResponse, receiptsResponse, payrollResponse, plansResponse, agendaResponse, alertsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/cadastros/alunos`),
          fetch(`${API_BASE_URL}/api/cadastros/professores`),
          fetch(`${API_BASE_URL}/api/finance/recebimentos`),
          fetch(`${API_BASE_URL}/api/finance/payroll`),
          fetch(`${API_BASE_URL}/api/planos`),
          fetch(`${API_BASE_URL}/api/agenda/classes`),
          fetch(`${API_BASE_URL}/api/dashboard/alerts`),
        ])

        if (studentsResponse.ok) {
          const studentsPayload = await studentsResponse.json()
          if (mounted && Array.isArray(studentsPayload) && studentsPayload.length > 0) {
            setAllStudents(studentsPayload)
          }
        }

        if (professorsResponse.ok) {
          const professorsPayload = await professorsResponse.json()
          if (mounted && Array.isArray(professorsPayload) && professorsPayload.length > 0) {
            setAllProfessors(professorsPayload)
          }
        }

        if (receiptsResponse.ok) {
          const receiptsPayload = await receiptsResponse.json()
          if (mounted && Array.isArray(receiptsPayload.recent_receipts)) {
            setAutomatedReceipts(receiptsPayload.recent_receipts)
          }
          if (mounted && receiptsPayload.summary) {
            setReceiptsSummary(receiptsPayload.summary)
          }
        }

        if (payrollResponse.ok) {
          const payrollPayload = await payrollResponse.json()
          if (mounted && Array.isArray(payrollPayload.items)) {
            setPayrollEntries(payrollPayload.items)
          }
          if (mounted && payrollPayload.summary) {
            setPayrollSummary(payrollPayload.summary)
          }
          if (mounted && payrollPayload.reference) {
            setPayrollReference(payrollPayload.reference)
          }
          if (mounted && payrollPayload.default_due_date) {
            setDefaultPayrollDueDate(payrollPayload.default_due_date)
          }
        }

        if (plansResponse.ok) {
          const plansPayload = await plansResponse.json()
          if (mounted && Array.isArray(plansPayload)) {
            setPlans(plansPayload)
          }
        }

        if (agendaResponse.ok) {
          const agendaPayload = await agendaResponse.json()
          if (mounted && Array.isArray(agendaPayload) && agendaPayload.length > 0) {
            setAgendaToday(agendaPayload)
          }
        }

        if (alertsResponse.ok) {
          const alertsPayload = await alertsResponse.json()
          if (mounted && Array.isArray(alertsPayload)) {
            setDashboardAlertsRaw(alertsPayload)
          }
        }
      } catch {
        // Mantem fallback local caso API ainda nao esteja disponivel.
      }
    }

    void loadFromDatabase()
    return () => {
      mounted = false
    }
  }, [])

  // Filtro combinado por busca textual + situacao financeira/atividade.
  const filteredStudents = allStudents.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.cpf.includes(searchQuery)
    if (studentFilter === "todos") return matchSearch
    if (studentFilter === "em-dia") return matchSearch && s.payment === "em-dia" && s.status === "ativo"
    if (studentFilter === "atrasado") return matchSearch && s.payment === "atrasado"
    if (studentFilter === "inativo") return matchSearch && s.status === "inativo"
    return matchSearch
  })

  const filteredProfessors = allProfessors.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.cpf.includes(searchQuery)
    if (professorFilter === "todos") return matchSearch
    return matchSearch && p.status === professorFilter
  })
  const selectedAgendaClass = agendaToday.find((item) => item.id === selectedAgendaClassId) || null
  const availablePlans = plans.filter((plan) => plan.active)
  const activePlans = plans.filter((plan) => plan.active)
  const inactivePlans = plans.filter((plan) => !plan.active)
  const studentMatchesAgendaEntry = (agendaStudent: AgendaStudent, student: Student) =>
    (agendaStudent.cpf && normalizeDigits(agendaStudent.cpf) === normalizeDigits(student.cpf))
    || normalizeNameLookupKey(agendaStudent.name) === normalizeNameLookupKey(student.name)
  const studentAssignedClasses = selectedStudent
    ? agendaToday.filter((agendaClass) =>
        agendaClass.students.some((student) => studentMatchesAgendaEntry(student, selectedStudent))
      )
    : []
  const availableTargetClassesForStudent = agendaToday.filter(
    (agendaClass) => agendaClass.id !== studentClassReallocationForm.sourceClassId
  )
  const countActiveStudentsForPlan = (planName: string) =>
    allStudents.filter(
      (student) =>
        student.status === "ativo" && normalizePlanLookupKey(student.plan) === normalizePlanLookupKey(planName)
    ).length
  const reallocationTargetPlans = activePlans.filter((plan) => plan.id !== selectedPlanForReallocation?.id)
  const getStudentAssignedClasses = (student: Student) =>
    agendaToday.filter((agendaClass) => agendaClass.students.some((agendaStudent) => studentMatchesAgendaEntry(agendaStudent, student)))
  const getStudentPrimaryClass = (student: Student) => getStudentAssignedClasses(student)[0] || null
  const activeProfessorsForAgenda = allProfessors.filter((professor) => professor.status === "ativo")
  const overdueStudents = allStudents.filter((student) => student.payment === "atrasado")
  const currentPayrollReference = payrollReference || new Date().toISOString().slice(0, 7)
  const getProfessorAssignedClasses = (professor: Professor) =>
    agendaToday.filter(
      (agendaClass) => normalizeNameLookupKey(agendaClass.professor) === normalizeNameLookupKey(professor.name)
    )
  const getProfessorPayrollEntry = (professor: Professor) =>
    payrollEntries.find(
      (entry) =>
        normalizeDigits(entry.professorCpf) === normalizeDigits(professor.cpf)
        && entry.reference === currentPayrollReference
    ) || null
  const getProfessorStatusLabel = (status: ProfessorStatus) => {
    switch (status) {
      case "ativo":
        return "Ativo"
      case "ferias":
        return "Ferias"
      case "inativo":
        return "Inativo"
    }
  }
  const getProfessorStatusClasses = (status: ProfessorStatus) => {
    switch (status) {
      case "ativo":
        return "border-primary/30 text-primary"
      case "ferias":
        return "border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]"
      case "inativo":
        return "border-border text-muted-foreground"
    }
  }
  const professorsOnVacationCount = allProfessors.filter((professor) => professor.status === "ferias").length
  const professorsWithoutClassesCount = allProfessors.filter((professor) => getProfessorAssignedClasses(professor).length === 0).length
  const professorsPendingPayrollCount = allProfessors.filter((professor) => {
    const payrollEntry = getProfessorPayrollEntry(professor)
    return payrollEntry && payrollEntry.status !== "pago"
  }).length
  const getProfessorVacationHistory = (professor: Professor | null) =>
    professor ? vacationHistoryByProfessor[professor.cpf] || [] : []
  const currentProfessorVacation = getProfessorVacationHistory(selectedProfessorForVacation)[0] || null

  const openWhatsappCharge = (studentCpf?: string, studentPhone?: string) => {
    const alertWhatsappTarget = studentCpf
      ? allStudents.find((student) => normalizeDigits(student.cpf) === normalizeDigits(studentCpf))
      : overdueStudents[0]
    const rawPhone = normalizeDigits(studentPhone || alertWhatsappTarget?.phone || "")

    if (!alertWhatsappTarget) {
      setSearchQuery("")
      setStudentFilter("atrasado")
      setActiveSheet("alunos")
      return
    }

    if (!rawPhone) {
      setSearchQuery(alertWhatsappTarget.name)
      setActiveSheet("alunos")
      setStudentFilter("atrasado")
      return
    }

    const message = encodeURIComponent(`Oi, ${alertWhatsappTarget.name}. Sua mensalidade esta em aberto. Podemos regularizar hoje?`)
    window.open(`https://wa.me/55${rawPhone}?text=${message}`, "_blank", "noopener,noreferrer")
  }

  const getAlertIcon = (icon: DashboardAlertApi["icon"]) => {
    switch (icon) {
      case "clock":
        return Clock
      case "user-x":
        return UserX
      case "clipboard-check":
        return ClipboardCheck
      case "user-plus":
        return UserPlus
      case "alert-circle":
      default:
        return AlertCircle
    }
  }

  const runAlertAction = (action?: DashboardAlertApiAction) => {
    if (!action) return

    switch (action.id) {
      case "charge_whatsapp":
        openWhatsappCharge(action.studentCpf, action.studentPhone)
        return
      case "open_overdue_students":
        setSearchQuery("")
        setStudentFilter("atrasado")
        setActiveSheet("alunos")
        return
      case "open_students":
        setSearchQuery("")
        setStudentFilter("todos")
        setActiveSheet("alunos")
        return
      case "open_finance":
        setActiveSheet("financeiro")
        return
      case "open_professors":
        setActiveSheet("professores")
        return
      case "open_agenda":
        setSelectedAgendaClassId(action.classId || "")
        setActiveSheet("agenda")
        return
      case "open_plans":
        setActiveSheet("planos")
        return
      case "focus_student": {
        const targetStudent = action.studentCpf
          ? allStudents.find((student) => normalizeDigits(student.cpf) === normalizeDigits(action.studentCpf || ""))
          : null
        setSearchQuery(targetStudent?.name || "")
        setStudentFilter("todos")
        setActiveSheet("alunos")
        return
      }
      case "open_add_student":
        setShowAddStudentDialog(true)
        return
      default:
        return
    }
  }

  const fallbackAlerts: DashboardAlertApi[] = overdueStudents.length > 0
    ? [
        {
          id: "late-payments-fallback",
          type: "danger",
          group: "prioridade",
          icon: "alert-circle",
          title: "Mensalidades atrasadas",
          message: `${overdueStudents.length} aluno(s) com mensalidade atrasada.`,
          detail: `Contato prioritario: ${overdueStudents[0].name}.`,
          primaryAction: {
            id: "charge_whatsapp",
            label: "Cobrar agora",
            studentCpf: overdueStudents[0].cpf,
            studentPhone: overdueStudents[0].phone,
          },
          secondaryAction: {
            id: "open_overdue_students",
            label: "Ver atrasados",
          },
        },
      ]
    : []

  const alertsSource = dashboardAlertsRaw.length > 0 ? dashboardAlertsRaw : fallbackAlerts
  const alerts: DashboardAlert[] = alertsSource.map((alert) => ({
    id: alert.id,
    type: alert.type,
    group: alert.group,
    title: alert.title,
    message: alert.message,
    detail: alert.detail,
    icon: getAlertIcon(alert.icon),
    primaryActionLabel: alert.primaryAction.label,
    secondaryActionLabel: alert.secondaryAction?.label,
    onPrimaryAction: () => runAlertAction(alert.primaryAction),
    onSecondaryAction: alert.secondaryAction ? () => runAlertAction(alert.secondaryAction) : undefined,
  }))
  const dangerAlertsCount = alerts.filter((alert) => alert.group === "prioridade").length
  const filteredAlerts = alerts.filter((alert) => alert.group === alertView)

  // Total de inadimplentes usado em indicadores de risco.
  const atrasados = allStudents.filter((s) => s.payment === "atrasado").length

  const resetPlanDialog = () => {
    setPlanForm(EMPTY_PLAN_FORM)
    setPlanPrice("R$ 0,00")
    setPlanBenefitInput("")
    setPlanFormError("")
    setPlansError("")
    setEditingPlanId(null)
  }

  const resetAgendaClassDialog = () => {
    setAgendaClassForm(EMPTY_AGENDA_CLASS_FORM)
    setAgendaClassError("")
    setSelectedAgendaClassForAction(null)
  }

  const openCreateAgendaClassDialog = () => {
    resetAgendaClassDialog()
    setAgendaDialog("criar-turma")
  }

  const openEditAgendaClassDialog = (agendaClass: AgendaClass) => {
    setSelectedAgendaClassForAction(agendaClass)
    setAgendaClassForm({
      event: agendaClass.event,
      professor: agendaClass.professor,
      time: agendaClass.time,
      room: agendaClass.room,
      capacity: String(agendaClass.capacity),
    })
    setAgendaClassError("")
    setAgendaDialog("editar-turma")
  }

  const openCancelAgendaClassDialog = (agendaClass: AgendaClass) => {
    setSelectedAgendaClassForAction(agendaClass)
    setAgendaClassError("")
    setAgendaDialog("cancelar-aula")
  }

  const openCreatePlanDialog = () => {
    resetPlanDialog()
    setShowAddPlanDialog(true)
  }

  const openEditPlanDialog = (plan: Plan) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      modalities: [...plan.modalities],
      benefits: [...plan.benefits],
    })
    setPlanPrice(plan.price)
    setPlanBenefitInput("")
    setPlanFormError("")
    setShowAddPlanDialog(true)
  }

  const openStudentClassReallocationDialog = () => {
    if (!selectedStudent) return

    const assignedClasses = getStudentAssignedClasses(selectedStudent)

    if (assignedClasses.length === 0) {
      setStudentClassReallocationError("Esse aluno ainda nao esta vinculado a nenhuma turma cadastrada.")
      return
    }

    setStudentClassReallocationForm({
      sourceClassId: assignedClasses[0].id,
      targetClassId: "",
    })
    setStudentClassReallocationError("")
    setShowStudentClassReallocationDialog(true)
  }

  const openPlanReallocationDialog = (plan: Plan) => {
    setSelectedPlanForReallocation(plan)
    setPlanReallocationForm(EMPTY_PLAN_REALLOCATION_FORM)
    setPlanReallocationError("")
    setShowPlanReallocationDialog(true)
  }

  const handleTogglePlanStatus = async (plan: Plan) => {
    setPlansError("")
    setIsUpdatingPlanStatusId(plan.id)

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${plan.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPlansError(responseBody.error || "Nao foi possivel atualizar o status do plano.")
        return
      }

      const updatedPlan = responseBody as Plan
      setPlans((prev) => prev.map((item) => (item.id === updatedPlan.id ? updatedPlan : item)))
    } catch {
      setPlansError("Nao foi possivel conectar com a API de planos.")
    } finally {
      setIsUpdatingPlanStatusId(null)
    }
  }

  const handleReallocatePlanStudents = async () => {
    if (!selectedPlanForReallocation) return
    if (!planReallocationForm.targetPlanId) {
      setPlanReallocationError("Selecione um plano de destino.")
      return
    }

    setIsReallocatingPlanStudents(true)
    setPlanReallocationError("")
    setPlansError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${selectedPlanForReallocation.id}/realocar-alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlanId: planReallocationForm.targetPlanId }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPlanReallocationError(responseBody.error || "Nao foi possivel realocar os alunos.")
        return
      }

      if (Array.isArray(responseBody.students)) {
        setAllStudents((prev) =>
          prev.map((student) => {
            const updatedStudent = responseBody.students.find((item: Student) => normalizeDigits(item.cpf) === normalizeDigits(student.cpf))
            return updatedStudent ? { ...student, ...updatedStudent } : student
          })
        )
      }

      if (responseBody.source_plan && responseBody.target_plan) {
        setPlans((prev) =>
          prev.map((plan) => {
            if (plan.id === responseBody.source_plan.id) return responseBody.source_plan
            if (plan.id === responseBody.target_plan.id) return responseBody.target_plan
            return plan
          })
        )
      }

      setPlansError(responseBody.message || "Alunos realocados com sucesso.")
      setShowPlanReallocationDialog(false)
      setSelectedPlanForReallocation(null)
      setPlanReallocationForm(EMPTY_PLAN_REALLOCATION_FORM)
    } catch {
      setPlanReallocationError("Nao foi possivel conectar com a API de realocacao.")
    } finally {
      setIsReallocatingPlanStudents(false)
    }
  }

  const handleReallocateStudentClass = async () => {
    if (!selectedStudent) return
    if (!studentClassReallocationForm.sourceClassId) {
      setStudentClassReallocationError("Selecione a turma atual do aluno.")
      return
    }
    if (!studentClassReallocationForm.targetClassId) {
      setStudentClassReallocationError("Selecione a turma de destino.")
      return
    }

    const sourceClass = agendaToday.find((item) => item.id === studentClassReallocationForm.sourceClassId)
    const targetClass = agendaToday.find((item) => item.id === studentClassReallocationForm.targetClassId)
    if (!sourceClass || !targetClass) {
      setStudentClassReallocationError("Nao foi possivel localizar as turmas selecionadas.")
      return
    }

    const sourceStudent = sourceClass.students.find(
      (student) => studentMatchesAgendaEntry(student, selectedStudent)
    )
    if (!sourceStudent) {
      setStudentClassReallocationError("O aluno nao foi encontrado na turma de origem.")
      return
    }
    if (
      targetClass.students.some(
        (student) => studentMatchesAgendaEntry(student, selectedStudent)
      )
    ) {
      setStudentClassReallocationError("O aluno ja esta vinculado a turma de destino.")
      return
    }
    if (targetClass.students.length >= targetClass.capacity) {
      setStudentClassReallocationError("A turma de destino ja atingiu a capacidade maxima.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/agenda/reallocate-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCpf: selectedStudent.cpf,
          sourceClassId: sourceClass.id,
          targetClassId: targetClass.id,
        }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStudentClassReallocationError(responseBody.error || "Nao foi possivel realocar o aluno.")
        return
      }

      if (Array.isArray(responseBody.classes)) {
        setAgendaToday(responseBody.classes)
      }

      setShowStudentClassReallocationDialog(false)
      setStudentClassReallocationForm(EMPTY_STUDENT_CLASS_REALLOCATION_FORM)
      setStudentClassReallocationError("")
    } catch {
      setStudentClassReallocationError("Nao foi possivel conectar com a API de agenda.")
    }
  }

  const handleSaveAgendaClass = async () => {
    const event = agendaClassForm.event.trim()
    const professor = agendaClassForm.professor.trim()
    const time = agendaClassForm.time.trim()
    const room = agendaClassForm.room.trim()
    const capacity = Number.parseInt(agendaClassForm.capacity, 10)

    if (!event) {
      setAgendaClassError("Informe o nome da turma.")
      return
    }
    if (!professor) {
      setAgendaClassError("Selecione o professor da turma.")
      return
    }
    if (!time) {
      setAgendaClassError("Informe o horario da turma.")
      return
    }
    if (!room) {
      setAgendaClassError("Informe a sala da turma.")
      return
    }
    if (Number.isNaN(capacity) || capacity <= 0) {
      setAgendaClassError("Informe uma capacidade valida.")
      return
    }

    setIsSavingAgendaClass(true)
    setAgendaClassError("")

    try {
      const response = await fetch(
        agendaDialog === "editar-turma" && selectedAgendaClassForAction
          ? `${API_BASE_URL}/api/agenda/classes/${selectedAgendaClassForAction.id}`
          : `${API_BASE_URL}/api/agenda/classes`,
        {
          method: agendaDialog === "editar-turma" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            professor,
            time,
            room,
            capacity,
            professorStatus: "confirmado",
          }),
        }
      )

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAgendaClassError(responseBody.error || "Nao foi possivel salvar a turma.")
        return
      }

      const savedClass = responseBody as AgendaClass
      setAgendaToday((prev) => {
        const nextList =
          agendaDialog === "editar-turma"
            ? prev.map((item) => (item.id === savedClass.id ? { ...item, ...savedClass } : item))
            : [...prev, savedClass]
        return [...nextList].sort((a, b) => a.time.localeCompare(b.time))
      })

      setAgendaDialog(null)
      resetAgendaClassDialog()
    } catch {
      setAgendaClassError("Nao foi possivel conectar com a API da agenda.")
    } finally {
      setIsSavingAgendaClass(false)
    }
  }

  const handleCancelAgendaClass = async () => {
    if (!selectedAgendaClassForAction) {
      setAgendaClassError("Selecione a turma que deseja cancelar.")
      return
    }

    setIsSavingAgendaClass(true)
    setAgendaClassError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/agenda/classes/${selectedAgendaClassForAction.id}`, {
        method: "DELETE",
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAgendaClassError(responseBody.error || "Nao foi possivel cancelar a turma.")
        return
      }

      setAgendaToday((prev) => prev.filter((item) => item.id !== selectedAgendaClassForAction.id))
      setSelectedAgendaClassId((prev) => (prev === selectedAgendaClassForAction.id ? null : prev))
      setAgendaDialog(null)
      resetAgendaClassDialog()
    } catch {
      setAgendaClassError("Nao foi possivel conectar com a API da agenda.")
    } finally {
      setIsSavingAgendaClass(false)
    }
  }

  const togglePlanModality = (modality: string) => {
    setPlanForm((prev) => ({
      ...prev,
      modalities: prev.modalities.includes(modality)
        ? prev.modalities.filter((item) => item !== modality)
        : [...prev.modalities, modality],
    }))
    setPlanFormError("")
  }

  const togglePlanBenefit = (benefit: string) => {
    setPlanForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((item) => item !== benefit)
        : [...prev.benefits, benefit],
    }))
    setPlanFormError("")
  }

  const addCustomPlanBenefit = () => {
    const benefit = planBenefitInput.trim()
    if (!benefit) return

    setPlanForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit) ? prev.benefits : [...prev.benefits, benefit],
    }))
    setPlanBenefitInput("")
    setPlanFormError("")
  }

  const removePlanBenefit = (benefit: string) => {
    setPlanForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((item) => item !== benefit),
    }))
  }

  const handleSavePlan = async () => {
    const normalizedName = planForm.name.trim()
    if (!normalizedName) {
      setPlanFormError("Informe o nome do plano.")
      return
    }
    if (!planForm.duration) {
      setPlanFormError("Selecione a duracao do plano.")
      return
    }
    if (planPrice === "R$ 0,00") {
      setPlanFormError("Informe um valor maior que zero.")
      return
    }
    if (planForm.modalities.length === 0) {
      setPlanFormError("Selecione ao menos uma modalidade coberta.")
      return
    }
    if (planForm.benefits.length === 0) {
      setPlanFormError("Adicione pelo menos um beneficio ao plano.")
      return
    }

    const payload = {
      name: normalizedName,
      price: planPrice,
      duration: planForm.duration,
      modalities: [...planForm.modalities],
      benefits: [...planForm.benefits],
      active: editingPlanId ? plans.find((plan) => plan.id === editingPlanId)?.active ?? true : true,
    }

    setIsSavingPlan(true)
    setPlansError("")

    try {
      const response = await fetch(
        editingPlanId ? `${API_BASE_URL}/api/planos/${editingPlanId}` : `${API_BASE_URL}/api/planos`,
        {
          method: editingPlanId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPlanFormError(responseBody.error || "Nao foi possivel salvar o plano.")
        return
      }

      const savedPlan = responseBody as Plan
      setPlans((prev) =>
        editingPlanId
          ? prev.map((plan) => (plan.id === savedPlan.id ? savedPlan : plan))
          : [...prev, savedPlan]
      )

      setShowAddPlanDialog(false)
      resetPlanDialog()
    } catch {
      setPlanFormError("Nao foi possivel conectar com a API de planos.")
    } finally {
      setIsSavingPlan(false)
    }
  }

  const handleRemovePlan = async (planId: string) => {
    setPlansError("")
    const plan = plans.find((item) => item.id === planId)
    const activeStudentsUsingPlan = plan ? plan.activeStudentsCount ?? countActiveStudentsForPlan(plan.name) : 0

    if (activeStudentsUsingPlan > 0) {
      setPlansError(`O plano ainda esta vinculado a ${activeStudentsUsingPlan} aluno(s) ativo(s). Realoque esses alunos antes de remover.`)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${planId}`, {
        method: "DELETE",
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPlansError(responseBody.error || "Nao foi possivel remover o plano.")
        return
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== planId))
      if (editingPlanId === planId) {
        setShowAddPlanDialog(false)
        resetPlanDialog()
      }
    } catch {
      setPlansError("Nao foi possivel conectar com a API de planos.")
    }
  }

  // Abre edicao com snapshot do aluno atual para evitar mutacao direta.
  const openEditStudentDialog = () => {
    if (!selectedStudent) return
    setEditStudentForm({ ...selectedStudent })
    setShowStudentModal(false)
    setShowEditStudentDialog(true)
  }

  const openEditProfessorDialog = () => {
    if (!selectedProfessor) return
    setEditProfessorForm({
      name: selectedProfessor.name,
      cpf: selectedProfessor.cpf,
      phone: selectedProfessor.phone,
      email: selectedProfessor.email,
      horario: selectedProfessor.horario,
      salario: selectedProfessor.salario,
      speciality: selectedProfessor.speciality,
      status: selectedProfessor.status,
    })
    setEditProfessorFieldErrors({})
    setEditProfessorError("")
    setShowProfessorModal(false)
    setShowEditProfessorDialog(true)
  }

  // Atualiza campo especifico do form de edicao de maneira tipada.
  const updateEditStudentField = <K extends keyof Student>(field: K, value: Student[K]) => {
    setEditStudentForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // Persiste alteracoes no array principal e atualiza modal de detalhes.
  const saveStudentEdition = async () => {
    if (!editStudentForm) return

    setIsSavingStudent(true)
    setAddStudentError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/cadastros/alunos/${normalizeDigits(editStudentForm.cpf)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editStudentForm.name,
          cpf: normalizeDigits(editStudentForm.cpf),
          telefone: normalizeDigits(editStudentForm.phone),
          email: editStudentForm.email,
          idade: editStudentForm.age,
          peso: editStudentForm.weight.replace(/[^0-9.]/g, ""),
          plano: editStudentForm.plan,
          status: editStudentForm.status,
          pagamento: editStudentForm.payment,
        }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAddStudentError(responseBody.error || "Falha ao atualizar aluno.")
        return
      }

      const updatedStudent: Student = {
        ...editStudentForm,
        phone: formatPhone(normalizeDigits(editStudentForm.phone)),
        cpf: formatCpf(normalizeDigits(editStudentForm.cpf)),
      }

      setAllStudents((prev) =>
        prev.map((student) => (normalizeDigits(student.cpf) === normalizeDigits(editStudentForm.cpf) ? updatedStudent : student))
      )
      setSelectedStudent(updatedStudent)
      setShowEditStudentDialog(false)
      setShowStudentModal(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar aluno."
      setAddStudentError(message)
    } finally {
      setIsSavingStudent(false)
    }
  }

  const onAddStudentDialogChange = (open: boolean) => {
    setShowAddStudentDialog(open)
    if (!open) {
      setAddStudentForm(EMPTY_ADD_STUDENT_FORM)
      setAddStudentFieldErrors({})
      setAddStudentError("")
    }
  }

  const onAddProfessorDialogChange = (open: boolean) => {
    setShowAddProfessorDialog(open)
    if (!open) {
      setAddProfessorForm(EMPTY_ADD_PROFESSOR_FORM)
      setAddProfessorFieldErrors({})
      setAddProfessorError("")
    }
  }

  const openFinanceDialog = (type: FinanceDialogType) => {
    setFinanceDialog(type)
    setFinanceForm({
      ...EMPTY_FINANCE_FORM,
      date: new Date().toISOString().slice(0, 10),
    })
    setFinanceFormError("")
  }

  const updateAddStudentField = <K extends keyof AddStudentForm>(field: K, value: AddStudentForm[K]) => {
    setAddStudentForm((prev) => ({ ...prev, [field]: value }))
    setAddStudentFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setAddStudentError("")
  }

  const updateAddProfessorField = <K extends keyof AddProfessorForm>(field: K, value: AddProfessorForm[K]) => {
    setAddProfessorForm((prev) => ({ ...prev, [field]: value }))
    setAddProfessorFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setAddProfessorError("")
  }

  const updateEditProfessorField = <K extends keyof EditProfessorForm>(field: K, value: EditProfessorForm[K]) => {
    setEditProfessorForm((prev) => ({ ...prev, [field]: value }))
    setEditProfessorFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setEditProfessorError("")
  }

  const updateFinanceFormField = <K extends keyof FinanceForm>(field: K, value: FinanceForm[K]) => {
    setFinanceForm((prev) => ({ ...prev, [field]: value }))
    setFinanceFormError("")
  }

  const openPayrollAdjustDialog = (entry: PayrollEntry) => {
    setSelectedPayrollEntry(entry)
    setPayrollAdjustmentForm({
      amount: formatCurrency(entry.adjustedAmount),
      dueDate: entry.dueDateIso,
      notes: entry.notes || "",
    })
    setPayrollAdjustmentError("")
    setShowPayrollAdjustDialog(true)
  }

  const openProfessorProfile = (professor: Professor) => {
    setSelectedProfessor(professor)
    setShowProfessorModal(true)
  }

  const openProfessorVacationDialog = (professor: Professor) => {
    setSelectedProfessorForVacation(professor)
    setVacationError("")
    setVacationStartDate("2026-07-01")
    setVacationEndDate("2026-07-15")
    setShowProfessorVacationDialog(true)
  }

  const openProfessorAgendaQuickAction = (professor: Professor) => {
    const professorClasses = getProfessorAssignedClasses(professor)
    setActiveSheet("agenda")
    setSelectedAgendaClassId(professorClasses[0]?.id || null)
  }

  const openProfessorPayrollQuickAction = (professor: Professor) => {
    const payrollEntry = getProfessorPayrollEntry(professor)
    setActiveSheet("financeiro")
    if (payrollEntry) {
      openPayrollAdjustDialog(payrollEntry)
    }
  }

  const openProfessorReallocateClassQuickAction = (professor: Professor) => {
    const professorClasses = getProfessorAssignedClasses(professor)
    setActiveSheet("agenda")

    if (professorClasses[0]) {
      setSelectedAgendaClassId(null)
      openEditAgendaClassDialog(professorClasses[0])
      return
    }

    setSelectedAgendaClassForAction(null)
    setAgendaClassForm((prev) => ({ ...EMPTY_AGENDA_CLASS_FORM, professor: professor.name }))
    setAgendaClassError("")
    setAgendaDialog("criar-turma")
  }

  const handleProfessorVacationAction = async (action: VacationAction) => {
    if (!selectedProfessorForVacation) return
    if (!vacationStartDate || !vacationEndDate) {
      setVacationError("Selecione a data de inicio e a data de fim das ferias.")
      return
    }
    if (vacationStartDate > vacationEndDate) {
      setVacationError("A data de inicio nao pode ser maior que a data final.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/cadastros/professores/${normalizeDigits(selectedProfessorForVacation.cpf)}/vacation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          startDate: vacationStartDate,
          endDate: vacationEndDate,
        }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setVacationError(responseBody.error || "Falha ao processar ferias.")
        return
      }

      const entry: VacationHistoryEntry = {
        id: responseBody.id || `vac-admin-${Date.now()}`,
        action,
        startDate: vacationStartDate,
        endDate: vacationEndDate,
        createdAt: responseBody.createdAt || new Date().toISOString(),
      }

      setVacationError("")
      setVacationHistoryByProfessor((prev) => ({
        ...prev,
        [selectedProfessorForVacation.cpf]: [entry, ...(prev[selectedProfessorForVacation.cpf] || [])],
      }))

      const nextStatus: ProfessorStatus = action === "reprovada" ? "ativo" : "ferias"
      setAllProfessors((prev) =>
        prev.map((professor) =>
          professor.cpf === selectedProfessorForVacation.cpf ? { ...professor, status: nextStatus } : professor
        )
      )
      setSelectedProfessor((prev) =>
        prev && prev.cpf === selectedProfessorForVacation.cpf ? { ...prev, status: nextStatus } : prev
      )
      setSelectedProfessorForVacation((prev) => (prev ? { ...prev, status: nextStatus } : prev))
      setShowProfessorVacationDialog(false)
    } catch {
      setVacationError("Nao foi possivel conectar com a API de professores.")
    }
  }

  const updatePayrollAdjustmentField = <K extends keyof PayrollAdjustmentForm>(field: K, value: PayrollAdjustmentForm[K]) => {
    setPayrollAdjustmentForm((prev) => ({ ...prev, [field]: value }))
    setPayrollAdjustmentError("")
  }

  const validateAddStudentForm = (form: AddStudentForm) => {
    const errors: Partial<Record<keyof AddStudentForm, string>> = {}

    const normalizedName = form.name.replace(/\s+/g, " ").trim()
    const normalizedCpf = normalizeDigits(form.cpf)
    const normalizedPhone = normalizeDigits(form.phone)
    const normalizedEmail = form.email.trim().toLowerCase()
    const normalizedPlanId = form.planId.trim()
    const age = Number(form.age)
    const weight = Number(form.weight.replace(",", "."))

    if (!normalizedName) errors.name = "Nome obrigatorio."
    else if (normalizedName.length < 3 || normalizedName.length > 100) errors.name = "Nome deve ter entre 3 e 100 letras."
    else if (!NAME_REGEX.test(normalizedName)) errors.name = "Nome deve conter apenas letras e espacos."

    if (!normalizedCpf) errors.cpf = "CPF obrigatorio."
    else if (!isValidCpf(normalizedCpf)) errors.cpf = "CPF invalido. Informe 11 digitos validos."

    if (!normalizedPhone) errors.phone = "Telefone obrigatorio."
    else if (![10, 11].includes(normalizedPhone.length)) errors.phone = "Telefone deve ter 10 ou 11 digitos (com DDD)."

    if (!normalizedEmail) errors.email = "Email obrigatorio."
    else if (normalizedEmail.length > 120) errors.email = "Email deve ter no maximo 120 caracteres."
    else if (!EMAIL_REGEX.test(normalizedEmail)) errors.email = "Email invalido."

    if (!form.age.trim()) errors.age = "Idade obrigatoria."
    else if (!Number.isInteger(age) || age < 12 || age > 120) errors.age = "Idade deve ser um numero inteiro entre 12 e 120."

    if (!form.weight.trim()) errors.weight = "Peso obrigatorio."
    else if (!Number.isFinite(weight) || weight < 20 || weight > 400) errors.weight = "Peso deve estar entre 20 e 400 kg."

    if (!normalizedPlanId) errors.planId = "Plano obrigatorio."

    return {
      errors,
      normalized: {
        name: normalizedName,
        cpf: normalizedCpf,
        phone: normalizedPhone,
        email: normalizedEmail,
        age,
        weight,
        planId: normalizedPlanId,
      },
    }
  }

  const isAddStudentFormComplete =
    addStudentForm.name.trim() !== "" &&
    addStudentForm.cpf.trim() !== "" &&
    addStudentForm.phone.trim() !== "" &&
    addStudentForm.email.trim() !== "" &&
    addStudentForm.age.trim() !== "" &&
    addStudentForm.weight.trim() !== "" &&
    addStudentForm.planId.trim() !== ""

  const validateAddProfessorForm = (form: AddProfessorForm) => {
    const errors: Partial<Record<keyof AddProfessorForm, string>> = {}

    const normalizedName = form.name.replace(/\s+/g, " ").trim()
    const normalizedCpf = normalizeDigits(form.cpf)
    const normalizedPhone = normalizeDigits(form.phone)
    const normalizedEmail = form.email.trim().toLowerCase()
    const normalizedSchedule = form.horario.replace(/\s+/g, " ").trim()
    const normalizedSalary = normalizeSalaryValue(form.salario)
    const normalizedSpeciality = form.speciality.replace(/\s+/g, " ").trim()
    const salaryValue = Number(normalizedSalary)

    if (!normalizedName) errors.name = "Nome obrigatorio."
    else if (normalizedName.length < 3 || normalizedName.length > 100) errors.name = "Nome deve ter entre 3 e 100 letras."
    else if (!NAME_REGEX.test(normalizedName)) errors.name = "Nome deve conter apenas letras e espacos."

    if (!normalizedCpf) errors.cpf = "CPF obrigatorio."
    else if (!isValidCpf(normalizedCpf)) errors.cpf = "CPF invalido. Informe 11 digitos validos."

    if (!normalizedPhone) errors.phone = "Telefone obrigatorio."
    else if (![10, 11].includes(normalizedPhone.length)) errors.phone = "Telefone deve ter 10 ou 11 digitos (com DDD)."

    if (!normalizedEmail) errors.email = "Email obrigatorio."
    else if (normalizedEmail.length > 120) errors.email = "Email deve ter no maximo 120 caracteres."
    else if (!EMAIL_REGEX.test(normalizedEmail)) errors.email = "Email invalido."

    if (!normalizedSchedule) errors.horario = "Horario obrigatorio."
    else if (!SCHEDULE_REGEX.test(normalizedSchedule)) errors.horario = "Use o formato HH:MM - HH:MM."

    if (!normalizedSalary) errors.salario = "Salario obrigatorio."
    else if (!Number.isFinite(salaryValue) || salaryValue <= 0) errors.salario = "Salario deve ser um valor maior que zero."

    if (!normalizedSpeciality) errors.speciality = "Especialidade obrigatoria."

    return {
      errors,
      normalized: {
        name: normalizedName,
        cpf: normalizedCpf,
        phone: normalizedPhone,
        email: normalizedEmail,
        horario: normalizedSchedule,
        salario: normalizedSalary,
        speciality: normalizedSpeciality,
      },
    }
  }

  const validateEditProfessorForm = (form: EditProfessorForm) => {
    const { errors, normalized } = validateAddProfessorForm(form)
    const nextErrors: Partial<Record<keyof EditProfessorForm, string>> = { ...errors }
    if (!["ativo", "ferias", "inativo"].includes(form.status)) {
      nextErrors.status = "Selecione um status valido."
    }

    return {
      errors: nextErrors,
      normalized: {
        ...normalized,
        status: form.status,
      },
    }
  }

  const isAddProfessorFormComplete =
    addProfessorForm.name.trim() !== "" &&
    addProfessorForm.cpf.trim() !== "" &&
    addProfessorForm.phone.trim() !== "" &&
    addProfessorForm.email.trim() !== "" &&
    addProfessorForm.horario.trim() !== "" &&
    addProfessorForm.salario.trim() !== "" &&
    addProfessorForm.speciality.trim() !== ""

  const handleAddStudent = async () => {
    const { errors, normalized } = validateAddStudentForm(addStudentForm)
    setAddStudentFieldErrors(errors)
    setAddStudentError("")

    if (Object.keys(errors).length > 0) {
      setAddStudentError("Preencha corretamente todos os campos obrigatorios para cadastrar o aluno.")
      return
    }

    if (allStudents.some((student) => normalizeDigits(student.cpf) === normalized.cpf)) {
      setAddStudentError("Ja existe um aluno cadastrado com este CPF.")
      return
    }

    const selectedPlan = plans.find((plan) => plan.id === normalized.planId)
    if (!selectedPlan) {
      setAddStudentError("Selecione um plano valido.")
      return
    }

    try {
      setIsSavingStudent(true)
      const response = await fetch(`${API_BASE_URL}/api/cadastros/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: normalized.name,
          cpf: normalized.cpf,
          telefone: normalized.phone,
          email: normalized.email,
          idade: normalized.age,
          peso: normalized.weight,
          plano: selectedPlan.name.replace(/^Plano\s+/i, ""),
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao salvar aluno no banco de dados.")
      }

      const createdStudent: Student = {
        name: payload.name || normalized.name,
        cpf: payload.cpf || formatCpf(normalized.cpf),
        phone: payload.phone || formatPhone(normalized.phone),
        email: payload.email || normalized.email,
        age: payload.age || normalized.age,
        weight: payload.weight || `${normalized.weight.toFixed(1)}kg`,
        plan: payload.plan || selectedPlan.name.replace(/^Plano\s+/i, ""),
        status: payload.status || "ativo",
        payment: payload.payment || "em-dia",
        vencimento: payload.vencimento || "-",
        lastPayment: payload.lastPayment || "-",
      }

      setAllStudents((prev) => [createdStudent, ...prev])
      if (payload.temporary_password) {
        setCreatedStudentCredentials({
          name: createdStudent.name,
          cpf: createdStudent.cpf,
          temporaryPassword: payload.temporary_password,
        })
      }
      onAddStudentDialogChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar aluno."
      setAddStudentError(message)
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleAddProfessor = async () => {
    const { errors, normalized } = validateAddProfessorForm(addProfessorForm)
    setAddProfessorFieldErrors(errors)
    setAddProfessorError("")

    if (Object.keys(errors).length > 0) {
      setAddProfessorError("Preencha corretamente todos os campos obrigatorios para cadastrar o professor.")
      return
    }

    if (allProfessors.some((professor) => normalizeDigits(professor.cpf) === normalized.cpf)) {
      setAddProfessorError("Ja existe um professor cadastrado com este CPF.")
      return
    }

    try {
      setIsSavingProfessor(true)
      const response = await fetch(`${API_BASE_URL}/api/cadastros/professores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: normalized.name,
          cpf: normalized.cpf,
          telefone: normalized.phone,
          email: normalized.email,
          horario: normalized.horario,
          salario: normalized.salario,
          especialidade: normalized.speciality,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao salvar professor no banco de dados.")
      }

      const createdProfessor: Professor = {
        name: payload.name || normalized.name,
        cpf: payload.cpf || formatCpf(normalized.cpf),
        speciality: payload.speciality || normalized.speciality,
        students: payload.students || 0,
        status: payload.status || "ativo",
        phone: payload.phone || formatPhone(normalized.phone),
        email: payload.email || normalized.email,
        horario: payload.horario || normalized.horario,
        salario: payload.salario || normalized.salario,
        modalidades: payload.modalidades || [normalized.speciality],
      }

      setAllProfessors((prev) => [createdProfessor, ...prev])
      onAddProfessorDialogChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar professor."
      setAddProfessorError(message)
    } finally {
      setIsSavingProfessor(false)
    }
  }

  const handleEditProfessor = async () => {
    if (!selectedProfessor) return

    const { errors, normalized } = validateEditProfessorForm(editProfessorForm)
    setEditProfessorFieldErrors(errors)
    setEditProfessorError("")

    if (Object.keys(errors).length > 0) {
      setEditProfessorError("Revise os campos do professor antes de salvar.")
      return
    }

    try {
      setIsUpdatingProfessor(true)
      const response = await fetch(`${API_BASE_URL}/api/cadastros/professores/${normalizeDigits(selectedProfessor.cpf)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: normalized.name,
          cpf: normalized.cpf,
          telefone: normalized.phone,
          email: normalized.email,
          horario: normalized.horario,
          salario: normalized.salario,
          especialidade: normalized.speciality,
          status: normalized.status,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao atualizar professor.")
      }

      const updatedProfessor: Professor = {
        name: payload.name || normalized.name,
        cpf: payload.cpf || formatCpf(normalized.cpf),
        speciality: payload.speciality || normalized.speciality,
        students: payload.students || selectedProfessor.students,
        status: payload.status || normalized.status,
        phone: payload.phone || formatPhone(normalized.phone),
        email: payload.email || normalized.email,
        horario: payload.horario || normalized.horario,
        salario: payload.salario || normalized.salario,
        modalidades: payload.modalidades || [normalized.speciality],
      }

      setAllProfessors((prev) =>
        prev.map((professor) => (normalizeDigits(professor.cpf) === normalizeDigits(selectedProfessor.cpf) ? updatedProfessor : professor))
      )
      setSelectedProfessor(updatedProfessor)
      setShowEditProfessorDialog(false)
      setShowProfessorModal(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar professor."
      setEditProfessorError(message)
    } finally {
      setIsUpdatingProfessor(false)
    }
  }

  const sortedFinanceEntries = [...financeEntries].sort((a, b) => b.date.localeCompare(a.date))
  const totalReceitas = financeEntries.filter((entry) => entry.type === "receita").reduce((sum, entry) => sum + entry.amount, 0)
  const totalDespesas = financeEntries.filter((entry) => entry.type === "despesa").reduce((sum, entry) => sum + entry.amount, 0)
  const saldoFinanceiro = totalReceitas - totalDespesas
  const groupedFinanceEntries = sortedFinanceEntries.reduce<Record<string, FinanceEntry[]>>((acc, entry) => {
    const monthLabel = new Date(`${entry.date}T00:00:00`).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
    acc[monthLabel] = [...(acc[monthLabel] || []), entry]
    return acc
  }, {})
  const receiptChartMax = Math.max(receiptsSummary.previsto, receiptsSummary.realizado, 1)
  const previstoBarWidth = `${Math.max((receiptsSummary.previsto / receiptChartMax) * 100, 12)}%`
  const realizadoBarWidth = `${Math.max((receiptsSummary.realizado / receiptChartMax) * 100, 12)}%`
  const payrollAdjustedEntriesCount = payrollEntries.filter((entry) => Math.abs(entry.adjustedAmount - entry.baseAmount) > 0.009 || entry.status === "ajustado").length

  const handleSaveFinanceEntry = async () => {
    if (!financeDialog) return

    const description = financeForm.description.trim()
    const category = financeForm.category.trim()
    const amount = Number(normalizeSalaryValue(financeForm.value))
    const date = financeForm.date

    if (!description || !category || !date || !Number.isFinite(amount) || amount <= 0) {
      setFinanceFormError("Preencha descricao, valor, categoria e data corretamente.")
      return
    }

    const entryType: FinanceEntryType = financeDialog === "despesa" ? "despesa" : "receita"
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          amount,
          date,
          type: entryType,
        }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setFinanceFormError(responseBody.error || "Nao foi possivel salvar a entrada financeira.")
        return
      }

      const savedEntry: FinanceEntry = {
        id: responseBody.id || `fin-${Date.now()}`,
        type: entryType,
        description,
        category,
        amount,
        date,
      }

      setFinanceEntries((prev) => [savedEntry, ...prev])
      setFinanceDialog(null)
      setFinanceForm({
        ...EMPTY_FINANCE_FORM,
        date: new Date().toISOString().slice(0, 10),
      })
      setFinanceFormError("")
    } catch {
      setFinanceFormError("Nao foi possivel conectar com a API de financeiro.")
    }
  }

  const handleSavePayrollAdjustment = async () => {
    if (!selectedPayrollEntry) return

    const adjustedAmount = Number(normalizeSalaryValue(payrollAdjustmentForm.amount))
    if (!Number.isFinite(adjustedAmount) || adjustedAmount <= 0 || !payrollAdjustmentForm.dueDate) {
      setPayrollAdjustmentError("Informe um valor valido e a data ajustada do pagamento.")
      return
    }

    try {
      setIsSavingPayrollAdjustment(true)
      const response = await fetch(`${API_BASE_URL}/api/finance/payroll/${selectedPayrollEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjusted_amount: adjustedAmount,
          due_date: payrollAdjustmentForm.dueDate,
          notes: payrollAdjustmentForm.notes,
          status: "ajustado",
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao ajustar a folha de pagamento.")
      }

      setPayrollEntries((prev) => {
        const nextEntries = prev.map((entry) => (entry.id === payload.id ? payload : entry))
        const totalBase = nextEntries.reduce((sum, entry) => sum + entry.baseAmount, 0)
        const totalAdjusted = nextEntries.reduce((sum, entry) => sum + entry.adjustedAmount, 0)
        const adjustedCount = nextEntries.filter((entry) => Math.abs(entry.adjustedAmount - entry.baseAmount) > 0.009 || entry.status === "ajustado").length

        setPayrollSummary({
          totalBase,
          totalBaseLabel: formatCurrency(totalBase),
          totalAdjusted,
          totalAdjustedLabel: formatCurrency(totalAdjusted),
          adjustedCount,
        })
        return nextEntries
      })
      setShowPayrollAdjustDialog(false)
      setSelectedPayrollEntry(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao ajustar a folha."
      setPayrollAdjustmentError(message)
    } finally {
      setIsSavingPayrollAdjustment(false)
    }
  }

  const handleRegisterPayment = async (student: Student) => {
    setPaymentError("")
    setIsRegisteringPayment(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCpf: normalizeDigits(student.cpf),
          studentName: student.name,
          amount: student.lastPayment ? parseFloat(student.lastPayment.replace(/\D/g, "")) / 100 : 0,
          paymentDate: new Date().toISOString().split("T")[0],
          reference: new Date().toISOString().slice(0, 7),
        }),
      })

      const responseBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        setPaymentError(responseBody.error || "Falha ao registrar pagamento.")
        return
      }

      // Atualiza o aluno com novo status
      const updatedStudent: Student = {
        ...student,
        payment: "em-dia",
        lastPayment: new Date().toLocaleDateString("pt-BR"),
      }

      setAllStudents((prev) =>
        prev.map((s) => (normalizeDigits(s.cpf) === normalizeDigits(student.cpf) ? updatedStudent : s))
      )

      if (selectedStudent && normalizeDigits(selectedStudent.cpf) === normalizeDigits(student.cpf)) {
        setSelectedStudent(updatedStudent)
      }

      setShowPaymentDialog(false)
    } catch {
      setPaymentError("Nao foi possivel conectar com a API de pagamentos.")
    } finally {
      setIsRegisteringPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-semibold font-mono text-foreground">FitPro</h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Header + Novo Aluno button */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold font-mono text-foreground">
              Bom dia, Administrador
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui esta o resumo da sua academia hoje.
            </p>
          </div>
          <Button
            onClick={() => setShowAddStudentDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold font-mono text-foreground">{stat.value}</p>
                    <span className="text-xs font-medium text-primary">{stat.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Card de alerta */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-foreground font-mono text-base">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Alertas e Pendencias
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAlertView("prioridade")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    alertView === "prioridade" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Prioridade Maxima ({dangerAlertsCount})
                </button>
                <button
                  onClick={() => setAlertView("informativos")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    alertView === "informativos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Informativos ({alerts.length - dangerAlertsCount})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-4 ${
                    alert.type === "danger"
                      ? "bg-destructive/10 border border-destructive/20"
                      : alert.type === "warning"
                      ? "bg-[oklch(0.75_0.15_85)]/10 border border-[oklch(0.75_0.15_85)]/20"
                      : "bg-primary/10 border border-primary/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      alert.type === "danger"
                        ? "bg-destructive/15"
                        : alert.type === "warning"
                        ? "bg-[oklch(0.75_0.15_85)]/15"
                        : "bg-primary/15"
                    }`}>
                      <alert.icon
                        className={`h-5 w-5 ${
                          alert.type === "danger"
                            ? "text-destructive"
                            : alert.type === "warning"
                            ? "text-[oklch(0.75_0.15_85)]"
                            : "text-primary"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <Badge
                          variant="outline"
                          className={
                            alert.type === "danger"
                              ? "border-destructive/30 text-destructive"
                              : alert.type === "warning"
                              ? "border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]"
                              : "border-primary/30 text-primary"
                          }
                        >
                          {alert.type === "danger" ? "Urgente" : alert.type === "warning" ? "Atencao" : "Informativo"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{alert.message}</p>
                      {alert.detail && <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button
                        size="sm"
                        onClick={alert.onPrimaryAction}
                        className={alert.primaryActionLabel === "Cobrar agora" ? "bg-primary text-primary-foreground hover:bg-primary/90 gap-2" : "bg-foreground text-background hover:bg-foreground/90"}
                      >
                        {alert.primaryActionLabel === "Cobrar agora" && <MessageCircle className="h-4 w-4" />}
                        {alert.primaryActionLabel}
                      </Button>
                      {alert.onSecondaryAction && alert.secondaryActionLabel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alert.onSecondaryAction}
                          className="border-border text-foreground hover:bg-secondary"
                        >
                          {alert.secondaryActionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity + Quick Actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-mono">
                <BarChart3 className="h-5 w-5 text-primary" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {recentActions.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-mono">
                <Settings className="h-5 w-5 text-primary" />
                Acesso Rapido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSearchQuery("")
                      setStudentFilter("todos")
                      setActiveSheet(item.sheet)
                    }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-secondary/80"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ==================== SHEET: Gerenciar Alunos ==================== */}
      <Sheet open={activeSheet === "alunos"} onOpenChange={(open) => { if (!open) { setActiveSheet(null); setStudentFilter("todos") } }}>
        <SheetContent className="w-full sm:max-w-4xl bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Gerenciar Alunos</SheetTitle>
            <SheetDescription>{allStudents.length} alunos cadastrados ({atrasados} atrasados)</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Central de Alunos</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Busque rapidamente, acompanhe o status e entre no perfil para editar, cobrar ou realocar.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddStudentDialog(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Cadastrar Novo Aluno
                  </Button>
                </div>

                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    { key: "todos" as StudentFilter, label: "Todos", count: allStudents.length },
                    { key: "em-dia" as StudentFilter, label: "Em dia", count: allStudents.filter(s => s.payment === "em-dia" && s.status === "ativo").length },
                    { key: "atrasado" as StudentFilter, label: "Atrasados", count: allStudents.filter(s => s.payment === "atrasado").length },
                    { key: "inativo" as StudentFilter, label: "Inativos", count: allStudents.filter(s => s.status === "inativo").length },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStudentFilter(f.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        studentFilter === f.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Ativos</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-foreground">
                    {allStudents.filter((student) => student.status === "ativo").length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Alunos com matricula ativa.</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Em Atraso</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-destructive">
                    {allStudents.filter((student) => student.payment === "atrasado").length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Precisam de acompanhamento financeiro.</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sem Turma</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-[oklch(0.75_0.15_85)]">
                    {allStudents.filter((student) => getStudentAssignedClasses(student).length === 0).length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Prontos para encaixe na agenda.</p>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Lista de alunos</p>
              <p className="text-xs text-muted-foreground">{filteredStudents.length} resultado(s)</p>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-secondary/60 py-10 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado.
                </div>
              ) : (
                filteredStudents.map((student, i) => {
                  const primaryClass = getStudentPrimaryClass(student)
                  const assignedClasses = getStudentAssignedClasses(student)
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedStudent(student); setShowStudentModal(true) }}
                      className="rounded-2xl border border-border bg-secondary p-4 text-left transition-colors hover:border-primary/30 hover:bg-secondary/90"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{student.name}</p>
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{student.plan}</Badge>
                            <Badge variant="outline" className={student.status === "ativo" ? "text-xs border-primary/30 text-primary" : "text-xs border-border text-muted-foreground"}>
                              {student.status === "ativo" ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">CPF: {student.cpf}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-border bg-background/70 p-2.5">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Turma principal</p>
                              {primaryClass ? (
                                <>
                                  <p className="mt-1 text-sm font-medium text-foreground">{primaryClass.event}</p>
                                  <p className="text-xs text-muted-foreground">{primaryClass.time} • {primaryClass.room}</p>
                                </>
                              ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Sem turma cadastrada</p>
                              )}
                            </div>
                            <div className="rounded-lg border border-border bg-background/70 p-2.5">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Pagamento e vinculos</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{assignedClasses.length} turma(s)</p>
                              <div className="mt-1 flex items-center gap-1">
                                {student.payment === "em-dia" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <span className={`text-xs ${student.payment === "em-dia" ? "text-primary" : "text-destructive"}`}>
                                  {student.payment === "em-dia" ? "Pagamento em dia" : "Pagamento atrasado"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===================== Gerenciar Professores ==================== */}
      <Sheet
        open={activeSheet === "professores"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet(null)
            setProfessorFilter("todos")
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-4xl bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Gerenciar Professores</SheetTitle>
            <SheetDescription>{allProfessors.length} professores na equipe</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Central de Professores</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Busque rapido, acompanhe agenda, folha e abra o perfil para editar as informacoes da equipe.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddProfessorDialog(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Cadastrar Professor
                  </Button>
                </div>

                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    { key: "todos" as ProfessorFilter, label: "Todos", count: allProfessors.length },
                    { key: "ativo" as ProfessorFilter, label: "Ativos", count: allProfessors.filter((professor) => professor.status === "ativo").length },
                    { key: "ferias" as ProfessorFilter, label: "Ferias", count: allProfessors.filter((professor) => professor.status === "ferias").length },
                    { key: "inativo" as ProfessorFilter, label: "Inativos", count: allProfessors.filter((professor) => professor.status === "inativo").length },
                  ]).map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setProfessorFilter(filter.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        professorFilter === filter.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Ativos</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-foreground">
                    {allProfessors.filter((professor) => professor.status === "ativo").length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Professores em operacao normal.</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Ferias</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-[oklch(0.75_0.15_85)]">
                    {professorsOnVacationCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Equipe temporariamente fora da escala.</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Folha Pendente</p>
                  <p className="mt-1 text-2xl font-semibold font-mono text-[oklch(0.65_0.18_250)]">
                    {professorsPendingPayrollCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Lancamentos do mes aguardando fechamento.</p>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Lista de professores</p>
              <p className="text-xs text-muted-foreground">{filteredProfessors.length} resultado(s)</p>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {filteredProfessors.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-secondary/60 py-10 text-center text-sm text-muted-foreground">
                  Nenhum professor encontrado.
                </div>
              ) : (
                filteredProfessors.map((prof, i) => {
                  const professorClasses = getProfessorAssignedClasses(prof)
                  const currentPayrollEntry = getProfessorPayrollEntry(prof)

                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-secondary p-4 text-left transition-colors hover:border-primary/30 hover:bg-secondary/90"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[oklch(0.55_0.15_250)]/20 text-xs font-semibold text-[oklch(0.65_0.18_250)]">
                          {prof.name.replace("Prof. ", "").split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{prof.name}</p>
                            <Badge variant="outline" className="text-xs border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)]">
                              {prof.speciality}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getProfessorStatusClasses(prof.status)}`}>
                              {getProfessorStatusLabel(prof.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">CPF: {prof.cpf}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-border bg-background/70 p-2.5">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Agenda e alunos</p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {professorClasses.length} turma(s) • {prof.students} alunos
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {professorClasses[0] ? `${professorClasses[0].time} • ${professorClasses[0].room}` : "Sem turma vinculada na agenda"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-background/70 p-2.5">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Folha e jornada</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{prof.salario}</p>
                              <div className="mt-1 flex items-center gap-1">
                                {currentPayrollEntry?.status === "pago" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-[oklch(0.75_0.15_85)]" />
                                )}
                                <span className={`text-xs ${currentPayrollEntry?.status === "pago" ? "text-primary" : "text-[oklch(0.75_0.15_85)]"}`}>
                                  {currentPayrollEntry ? `Folha ${currentPayrollEntry.status}` : "Sem provisao do mes"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1">
                              <Clock className="h-3 w-3" />
                              {prof.horario}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1">
                              <Phone className="h-3 w-3" />
                              {prof.phone}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1">
                              <Mail className="h-3 w-3" />
                              {prof.email}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProfessorAgendaQuickAction(prof)}
                              className="gap-1 border-border text-foreground hover:bg-background"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Abrir agenda
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProfessorPayrollQuickAction(prof)}
                              className="gap-1 border-border text-foreground hover:bg-background"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Ajustar folha
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProfessorReallocateClassQuickAction(prof)}
                              className="gap-1 border-border text-foreground hover:bg-background"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                              Realocar turma
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProfessorVacationDialog(prof)}
                              className="gap-1 border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Gerir ferias
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openProfessorProfile(prof)}
                          className="mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Cobertura da equipe</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Professores sem turma hoje ou fora da escala aparecem aqui para ajuste rapido de agenda.
                  </p>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {professorsWithoutClassesCount} sem turma
                </Badge>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET: Financeiro ==================== */}
      <Sheet open={activeSheet === "financeiro"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Financeiro</SheetTitle>
            <SheetDescription>Extrato completo de receitas e despesas da academia</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => openFinanceDialog("recebimento")}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                Novo Recebimento
              </Button>
              <Button
                onClick={() => openFinanceDialog("despesa")}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-secondary gap-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                Nova Despesa
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Total de Receitas</p>
                <p className="text-lg font-semibold font-mono text-primary">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-xs text-muted-foreground">Total de Despesas</p>
                <p className="text-lg font-semibold font-mono text-destructive">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Saldo Atual</p>
                <p className={`text-lg font-semibold font-mono ${saldoFinanceiro >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatCurrency(saldoFinanceiro)}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-border bg-secondary p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Folha de Pagamento dos Professores</p>
                  <p className="text-xs text-muted-foreground">
                    Referencia {payrollReference || new Date().toISOString().slice(0, 7)} com vencimento padrao no 5o dia util ({defaultPayrollDueDate || "-"})
                  </p>
                </div>
                <Badge variant="outline" className="border-[oklch(0.65_0.18_250)]/30 text-[oklch(0.65_0.18_250)]">
                  Ajustes: {payrollAdjustedEntriesCount}
                </Badge>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Total Base</p>
                  <p className="text-lg font-semibold font-mono text-foreground">{payrollSummary.totalBaseLabel}</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Total Ajustado</p>
                  <p className="text-lg font-semibold font-mono text-primary">{payrollSummary.totalAdjustedLabel}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {payrollEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border bg-background/60 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.professorName}</p>
                        <p className="text-xs text-muted-foreground">CPF: {entry.professorCpf}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          entry.status === "pago"
                            ? "border-primary/30 text-primary"
                            : entry.status === "ajustado"
                            ? "border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]"
                            : "border-border text-muted-foreground"
                        }
                      >
                        {entry.status === "pago" ? "Pago" : entry.status === "ajustado" ? "Ajustado" : "Provisionado"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground">Valor Base</p>
                        <p className="font-mono text-foreground">{entry.baseAmountLabel}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-mono text-primary">{entry.adjustedAmountLabel}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vencimento</p>
                        <p className="text-foreground">{entry.dueDate}</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPayrollAdjustDialog(entry)}
                          className="border-border text-foreground hover:bg-secondary gap-2"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Ajustar
                        </Button>
                      </div>
                    </div>
                    {entry.notes && <p className="mt-2 text-xs text-muted-foreground">Obs.: {entry.notes}</p>}
                  </div>
                ))}
                {payrollEntries.length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">Nenhuma provisao de folha encontrada para este mes.</p>
                )}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-border bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Recebimentos Recentes</p>
                  <p className="text-xs text-muted-foreground">Confirmacoes automáticas recebidas por webhook do provedor</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline" className={getReceiptStatusClasses("pago")}>Pago: {receiptsSummary.statusTotals.pago}</Badge>
                  <Badge variant="outline" className={getReceiptStatusClasses("pendente")}>Pendente: {receiptsSummary.statusTotals.pendente}</Badge>
                  <Badge variant="outline" className={getReceiptStatusClasses("atrasado")}>Atrasado: {receiptsSummary.statusTotals.atrasado}</Badge>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Previsto x Realizado</p>
                  <p className="text-xs text-muted-foreground">Mensalidades ativas comparadas ao caixa confirmado</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Previsto</span>
                      <span className="font-mono text-foreground">{receiptsSummary.previstoLabel}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-border/60">
                      <div className="h-full rounded-full bg-[oklch(0.65_0.18_250)]" style={{ width: previstoBarWidth }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Realizado</span>
                      <span className="font-mono text-primary">{receiptsSummary.realizadoLabel}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-border/60">
                      <div className="h-full rounded-full bg-primary" style={{ width: realizadoBarWidth }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {automatedReceipts.map((receipt) => (
                  <div key={receipt.id} className="rounded-lg border border-border bg-background/60 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{receipt.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {receipt.description} • Ref. {receipt.reference}
                        </p>
                      </div>
                      <Badge variant="outline" className={getReceiptStatusClasses(receipt.status)}>
                        {getReceiptStatusLabel(receipt.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className={`font-mono ${receipt.status === "pago" ? "text-primary" : receipt.status === "atrasado" ? "text-destructive" : "text-foreground"}`}>
                          {receipt.amountLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vencimento</p>
                        <p className="text-foreground">{receipt.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pagamento</p>
                        <p className="text-foreground">{receipt.paidAtLabel}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Provider</p>
                        <p className="truncate text-foreground">{receipt.provider}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-border bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Extrato Financeiro</p>
                  <p className="text-xs text-muted-foreground">{sortedFinanceEntries.length} lancamentos registrados</p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Atualizado em {new Date().toLocaleDateString("pt-BR")}
                </Badge>
              </div>

              <div className="flex flex-col gap-4">
                {Object.entries(groupedFinanceEntries).map(([month, entries]) => (
                  <div key={month} className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="mb-3 text-sm font-medium capitalize text-foreground">{month}</p>
                    <div className="flex flex-col gap-2">
                      {entries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            entry.type === "receita" ? "bg-primary/10" : "bg-destructive/10"
                          }`}>
                            <DollarSign className={`h-4 w-4 ${entry.type === "receita" ? "text-primary" : "text-destructive"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">{entry.description}</p>
                              <Badge
                                variant="outline"
                                className={entry.type === "receita" ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}
                              >
                                {entry.type === "receita" ? "Receita" : "Despesa"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {entry.category} • {new Date(`${entry.date}T00:00:00`).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold font-mono ${entry.type === "receita" ? "text-primary" : "text-destructive"}`}>
                            {entry.type === "receita" ? "+" : "-"}{formatCurrency(entry.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-secondary p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Resumo mensal</p>
              <div className="flex flex-col gap-3">
                {financialData.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-sm font-medium text-foreground mb-2">{item.month}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Receita</p>
                        <p className="text-sm font-mono text-primary">{item.receita}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Despesas</p>
                        <p className="text-sm font-mono text-foreground">{item.despesas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="text-sm font-mono text-primary">{item.lucro}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET: Agenda ==================== */}
      <Sheet open={activeSheet === "agenda"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Agenda de Hoje</SheetTitle>
            <SheetDescription>{agendaToday.length} atividades programadas</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="mb-4 flex gap-2">
              <Button
                onClick={openCreateAgendaClassDialog}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                Criar Nova Turma
              </Button>
              <Button
                onClick={() => {
                  setSelectedAgendaClassForAction(null)
                  setAgendaClassError("")
                  setAgendaDialog("cancelar-aula")
                }}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-secondary gap-2 text-xs"
              >
                <XCircle className="h-4 w-4" />
                Cancelar Aula
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {agendaToday.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedAgendaClassId(item.id)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-colors hover:border-primary/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-primary">{item.time}</span>
                      <span className="text-sm font-medium text-foreground">{item.event}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.professor} - {item.room}</p>
                    <p className="text-xs text-muted-foreground">{item.students.length}/{item.capacity} alunos</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET: Relatorios ==================== */}
      <Sheet open={activeSheet === "relatorios"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Relatorios</SheetTitle>
            <SheetDescription>Indicadores de desempenho da academia</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="flex flex-col gap-3">
              {reports.map((report, i) => (
                <div key={i} className="rounded-lg border border-border bg-secondary p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{report.title}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold font-mono text-foreground">{report.value}</span>
                      {report.trend && (
                        <span className={`text-xs font-medium ${
                          report.trend.startsWith("+") ? "text-primary" : report.trend.startsWith("-") ? "text-destructive" : "text-muted-foreground"
                        }`}>
                          {report.trend}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET: Planos ==================== */}
      <Sheet open={activeSheet === "planos"} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-mono">Planos da Academia</SheetTitle>
            <SheetDescription>Gerencie os planos e precos oferecidos</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Button
              onClick={openCreatePlanDialog}
              className="mb-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Novo Plano
            </Button>

            {plansError && <p className="mb-3 text-sm text-destructive">{plansError}</p>}

            <div className="flex flex-col gap-5">
              {[{ title: "Planos Ativos", items: activePlans }, { title: "Planos Inativos", items: inactivePlans }].map((section) => (
                <div key={section.title} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{section.title}</p>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {section.items.length}
                    </Badge>
                  </div>

                  {section.items.length > 0 ? section.items.map((plan) => {
                    const activeStudentsUsingPlan = plan.activeStudentsCount ?? countActiveStudentsForPlan(plan.name)

                    return (
                      <div key={plan.id} className="rounded-lg border border-border bg-secondary p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.duration}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold font-mono text-primary">{plan.price}</span>
                            <Badge variant="outline" className={plan.active ? "border-primary/30 text-primary text-xs" : "border-border text-muted-foreground text-xs"}>
                              {plan.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={activeStudentsUsingPlan > 0 ? "border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]" : "border-border text-muted-foreground"}
                          >
                            {activeStudentsUsingPlan} aluno{activeStudentsUsingPlan !== 1 ? "s" : ""} ativo{activeStudentsUsingPlan !== 1 ? "s" : ""}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {plan.active
                              ? "Disponivel para novos cadastros."
                              : "Plano fora da venda, mantido apenas para historico e realocacao."}
                          </span>
                        </div>
                        <div className="mt-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modalidades cobertas</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {plan.modalities.map((modality) => (
                              <span key={modality} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                                {modality}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Beneficios</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {plan.benefits.map((benefit) => (
                              <span key={benefit} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPlanDialog(plan)}
                            className="text-xs text-muted-foreground hover:text-foreground gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>

                          {!plan.active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPlanReallocationDialog(plan)}
                              disabled={activeStudentsUsingPlan === 0}
                              className="text-xs gap-1 border-[oklch(0.65_0.18_250)]/30 text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10 disabled:cursor-not-allowed disabled:text-muted-foreground"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Realocar alunos
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleTogglePlanStatus(plan)}
                            disabled={isUpdatingPlanStatusId === plan.id}
                            className={
                              plan.active
                                ? "text-xs gap-1 border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.75_0.15_85)]/10 disabled:cursor-not-allowed disabled:text-muted-foreground"
                                : "text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground"
                            }
                          >
                            {plan.active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {isUpdatingPlanStatusId === plan.id ? "Salvando..." : plan.active ? "Desativar" : "Reativar"}
                          </Button>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      Nenhum plano nesta secao.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ==================== MODAL: Perfil do Aluno ==================== */}
      <Dialog open={selectedAgendaClass !== null} onOpenChange={(open) => !open && setSelectedAgendaClassId(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-2xl">
          {selectedAgendaClass && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-foreground">Detalhes da Turma</DialogTitle>
                <DialogDescription>Visao rapida da turma, professor, lotacao e lista de chamada.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
                <div className="rounded-xl border border-border bg-secondary p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{selectedAgendaClass.event}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{selectedAgendaClass.time}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedAgendaClass.room}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {selectedAgendaClass.students.length}/{selectedAgendaClass.capacity} alunos
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                  <div className="rounded-xl border border-border bg-secondary p-4">
                    <p className="mb-3 text-sm font-medium text-foreground">Professor Responsavel</p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                        {selectedAgendaClass.professor.replace("Prof. ", "").split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{selectedAgendaClass.professor}</p>
                        <Badge
                          variant="outline"
                          className={
                            selectedAgendaClass.professorStatus === "presente"
                              ? "mt-2 border-primary/30 text-primary"
                              : "mt-2 border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]"
                          }
                        >
                          {selectedAgendaClass.professorStatus === "presente" ? "Presente" : "Confirmado"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Capacidade da Turma</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {selectedAgendaClass.students.length}/{selectedAgendaClass.capacity}
                      </p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((selectedAgendaClass.students.length / selectedAgendaClass.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Lotacao {(selectedAgendaClass.students.length / selectedAgendaClass.capacity * 100).toFixed(0)}% cheia.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Lista de Chamada Inteligente</p>
                    <p className="text-xs text-muted-foreground">Acompanhe a mensalidade. A presenca e registrada no painel do professor.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedAgendaClass.students.map((student) => (
                      <div key={`${selectedAgendaClass.id}-${student.name}`} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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
                        <Badge
                          variant="outline"
                          className={student.present ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}
                        >
                          {student.present ? "Presenca registrada" : "Aguardando chamada"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAgendaClassId(null)} className="border-border text-foreground hover:bg-secondary">
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedAgendaClass) return
                    openEditAgendaClassDialog(selectedAgendaClass)
                  }}
                  className="border-border text-foreground hover:bg-secondary gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar Turma
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedAgendaClass) return
                    setSelectedAgendaClassId(null)
                    openCancelAgendaClassDialog(selectedAgendaClass)
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar Turma
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Perfil do Aluno ==================== */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Perfil do Aluno</DialogTitle>
            <DialogDescription>Painel rapido com contato, plano, pagamento e turmas vinculadas.</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="flex max-h-[calc(90vh-8rem)] flex-col gap-4 overflow-y-auto pr-2">
              <div className="rounded-2xl border border-border bg-secondary p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold text-primary">
                      {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{selectedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">CPF: {selectedStudent.cpf}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-primary/30 text-primary">{selectedStudent.plan}</Badge>
                        <Badge
                          variant="outline"
                          className={selectedStudent.status === "ativo" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}
                        >
                          {selectedStudent.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
                      <p className="mt-1 text-base font-semibold font-mono text-foreground">{selectedStudent.age}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Peso</p>
                      <p className="mt-1 text-base font-semibold font-mono text-foreground">{selectedStudent.weight}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <p className="text-sm font-medium text-foreground">Contato</p>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Telefone</p>
                      </div>
                      <p className="text-sm text-foreground">{selectedStudent.phone}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Email</p>
                      </div>
                      <p className="text-sm text-foreground break-all">{selectedStudent.email}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Situacao Financeira</p>
                      <p className="mt-1 text-xs text-muted-foreground">Status atual, vencimento e ultimo pagamento.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedStudent.payment === "em-dia" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-sm font-medium ${selectedStudent.payment === "em-dia" ? "text-primary" : "text-destructive"}`}>
                        {selectedStudent.payment === "em-dia" ? "Em dia" : "Atrasado"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Vencimento</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{selectedStudent.vencimento}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Ultimo pagamento</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{selectedStudent.lastPayment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Turmas e Horarios</p>
                    <p className="mt-1 text-xs text-muted-foreground">Acompanhe em quais turmas o aluno esta atualmente vinculado.</p>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {studentAssignedClasses.length} turma(s)
                  </Badge>
                </div>
                {studentAssignedClasses.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {studentAssignedClasses.map((agendaClass) => (
                      <div key={agendaClass.id} className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{agendaClass.event}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{agendaClass.professor}</p>
                          </div>
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {agendaClass.students.length}/{agendaClass.capacity}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                            <Clock className="h-3 w-3" />
                            {agendaClass.time}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1">
                            <MapPin className="h-3 w-3" />
                            {agendaClass.room}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                    Aluno ainda nao vinculado a nenhuma turma cadastrada.
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-border pt-4 flex gap-2 sm:gap-2">
                <Button
                  onClick={() => {
                    setShowPaymentDialog(true)
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Registrar Pagamento
                </Button>
                <Button
                  variant="outline"
                  onClick={openStudentClassReallocationDialog}
                  disabled={studentAssignedClasses.length === 0}
                  className="border-border text-foreground hover:bg-secondary gap-2 disabled:cursor-not-allowed disabled:text-muted-foreground"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Realocar Turma
                </Button>
                <Button
                  variant="outline"
                  onClick={openEditStudentDialog}
                  className="border-border text-foreground hover:bg-secondary gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Perfil do Professor ==================== */}
      <Dialog open={showProfessorModal} onOpenChange={setShowProfessorModal}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Perfil do Professor</DialogTitle>
            <DialogDescription>Painel rapido com contato, jornada, modalidades e situacao atual.</DialogDescription>
          </DialogHeader>
          {selectedProfessor && (
            <div className="flex max-h-[calc(90vh-8rem)] flex-col gap-4 overflow-y-auto pr-2">
              {(() => {
                const professorClasses = getProfessorAssignedClasses(selectedProfessor)
                const currentPayrollEntry = getProfessorPayrollEntry(selectedProfessor)

                return (
                  <>
                    <div className="rounded-2xl border border-border bg-secondary p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.55_0.15_250)]/20 text-base font-semibold text-[oklch(0.65_0.18_250)]">
                            {selectedProfessor.name.replace("Prof. ", "").split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-foreground">{selectedProfessor.name}</p>
                            <p className="text-sm text-muted-foreground">CPF: {selectedProfessor.cpf}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)]">
                                {selectedProfessor.speciality}
                              </Badge>
                              <Badge variant="outline" className={getProfessorStatusClasses(selectedProfessor.status)}>
                                {getProfessorStatusLabel(selectedProfessor.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Alunos ativos</p>
                            <p className="mt-1 text-base font-semibold font-mono text-foreground">{selectedProfessor.students}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Salario</p>
                            <p className="mt-1 text-base font-semibold font-mono text-foreground">{selectedProfessor.salario}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                      <div className="rounded-2xl border border-border bg-secondary p-4">
                        <p className="text-sm font-medium text-foreground">Contato</p>
                        <div className="mt-3 grid gap-3">
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Telefone</p>
                            </div>
                            <p className="text-sm text-foreground">{selectedProfessor.phone}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Email</p>
                            </div>
                            <p className="text-sm break-all text-foreground">{selectedProfessor.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary p-4">
                        <p className="text-sm font-medium text-foreground">Jornada</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Horario</p>
                            </div>
                            <p className="text-sm text-foreground">{selectedProfessor.horario}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-background/70 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Faixa salarial</p>
                            </div>
                            <p className="text-sm text-foreground">{selectedProfessor.salario}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                      <div className="rounded-2xl border border-border bg-secondary p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Turmas e Agenda</p>
                            <p className="mt-1 text-xs text-muted-foreground">Acompanhe as turmas que esse professor conduz hoje.</p>
                          </div>
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {professorClasses.length} turma(s)
                          </Badge>
                        </div>
                        {professorClasses.length > 0 ? (
                          <div className="grid gap-3">
                            {professorClasses.map((agendaClass) => (
                              <div key={agendaClass.id} className="rounded-xl border border-border bg-background/70 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{agendaClass.event}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{agendaClass.time} • {agendaClass.room}</p>
                                  </div>
                                  <Badge variant="outline" className="border-primary/30 text-primary">
                                    {agendaClass.students.length}/{agendaClass.capacity}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {agendaClass.professorStatus === "presente" ? "Presenca confirmada na turma." : "Aguardando registro de presenca."}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
                            Nenhuma turma vinculada a este professor na agenda atual.
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Folha do Mes</p>
                            <p className="mt-1 text-xs text-muted-foreground">Resumo da provisao atual do financeiro.</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              currentPayrollEntry?.status === "pago"
                                ? "border-primary/30 text-primary"
                                : currentPayrollEntry
                                ? "border-[oklch(0.75_0.15_85)]/30 text-[oklch(0.75_0.15_85)]"
                                : "border-border text-muted-foreground"
                            }
                          >
                            {currentPayrollEntry ? currentPayrollEntry.status : "Sem folha"}
                          </Badge>
                        </div>
                        {currentPayrollEntry ? (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border bg-background/70 p-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Valor ajustado</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{currentPayrollEntry.adjustedAmountLabel}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background/70 p-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Vencimento</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{currentPayrollEntry.dueDate}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background/70 p-3 sm:col-span-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Observacoes</p>
                              <p className="mt-1 text-sm text-foreground">{currentPayrollEntry.notes || "Sem observacoes registradas."}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
                            Ainda nao existe provisao de folha para {currentPayrollReference} neste professor.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-secondary p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Modalidades</p>
                          <p className="mt-1 text-xs text-muted-foreground">Especialidades e frentes de atendimento do professor.</p>
                        </div>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {selectedProfessor.modalidades.length}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfessor.modalidades.map((m, i) => (
                          <span key={i} className="rounded-full bg-[oklch(0.55_0.15_250)]/15 px-3 py-1 text-xs text-[oklch(0.65_0.18_250)]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="border-t border-border pt-4 sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openProfessorVacationDialog(selectedProfessor)}
                        className="border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10 gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Gerir Ferias
                      </Button>
                      <Button
                        variant="outline"
                        onClick={openEditProfessorDialog}
                        className="border-border text-foreground hover:bg-secondary gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar Informacoes
                      </Button>
                    </DialogFooter>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Cadastrar Aluno ==================== */}
      <Dialog open={showAddStudentDialog} onOpenChange={onAddStudentDialogChange}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Cadastrar Novo Aluno</DialogTitle>
            <DialogDescription>Preencha os dados do novo aluno</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Nome Completo</Label>
                <Input
                  required
                  maxLength={100}
                  placeholder="Nome do aluno"
                  value={addStudentForm.name}
                  onChange={(e) => updateAddStudentField("name", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.name && <p className="text-xs text-destructive">{addStudentFieldErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">CPF</Label>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="123.456.789-00"
                  value={addStudentForm.cpf}
                  onChange={(e) => updateAddStudentField("cpf", formatCpf(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.cpf && <p className="text-xs text-destructive">{addStudentFieldErrors.cpf}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Telefone</Label>
                <Input
                  required
                  inputMode="tel"
                  maxLength={15}
                  placeholder="(11) 9XXXX-XXXX"
                  value={addStudentForm.phone}
                  onChange={(e) => updateAddStudentField("phone", formatPhone(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.phone && <p className="text-xs text-destructive">{addStudentFieldErrors.phone}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Email</Label>
                <Input
                  required
                  type="email"
                  maxLength={120}
                  placeholder="email@email.com"
                  value={addStudentForm.email}
                  onChange={(e) => updateAddStudentField("email", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.email && <p className="text-xs text-destructive">{addStudentFieldErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Idade</Label>
                <Input
                  required
                  type="number"
                  inputMode="numeric"
                  min={12}
                  max={120}
                  placeholder="25"
                  value={addStudentForm.age}
                  onChange={(e) => updateAddStudentField("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.age && <p className="text-xs text-destructive">{addStudentFieldErrors.age}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Peso (kg)</Label>
                <Input
                  required
                  type="number"
                  inputMode="decimal"
                  min={20}
                  max={400}
                  step="0.1"
                  placeholder="70"
                  value={addStudentForm.weight}
                  onChange={(e) => updateAddStudentField("weight", normalizeWeightValue(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addStudentFieldErrors.weight && <p className="text-xs text-destructive">{addStudentFieldErrors.weight}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Plano</Label>
                <Select
                  value={addStudentForm.planId}
                  onValueChange={(value) => updateAddStudentField("planId", value)}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availablePlans.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-foreground">{p.name} - {p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availablePlans.length === 0 && <p className="text-xs text-muted-foreground">Nenhum plano ativo disponivel para novos alunos.</p>}
                {addStudentFieldErrors.planId && <p className="text-xs text-destructive">{addStudentFieldErrors.planId}</p>}
              </div>
            </div>
            {addStudentError && <p className="text-sm text-destructive">{addStudentError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onAddStudentDialogChange(false)} className="border-border text-foreground hover:bg-secondary">
              Cancelar
            </Button>
            <Button
              disabled={!isAddStudentFormComplete || isSavingStudent}
              onClick={handleAddStudent}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingStudent ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(createdStudentCredentials)} onOpenChange={(open) => !open && setCreatedStudentCredentials(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Senha inicial do aluno</DialogTitle>
            <DialogDescription>
              A senha provisoria de 6 numeros foi gerada automaticamente para o primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          {createdStudentCredentials && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Aluno</p>
                <p className="text-sm font-medium text-foreground">{createdStudentCredentials.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">CPF de login</p>
                <p className="text-sm font-medium text-foreground">{createdStudentCredentials.cpf}</p>
                <p className="mt-2 text-sm text-muted-foreground">Senha temporaria</p>
                <p className="font-mono text-2xl font-semibold tracking-[0.3em] text-primary">
                  {createdStudentCredentials.temporaryPassword}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Se o aluno esquecer a senha, ele pode informar o CPF no login e usar "Esqueceu a senha?" para receber o codigo por WhatsApp e e-mail cadastrados.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedStudentCredentials(null)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Cadastrar Professor ==================== */}
      <Dialog open={showAddProfessorDialog} onOpenChange={onAddProfessorDialogChange}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Cadastrar Professor</DialogTitle>
            <DialogDescription>Preencha os dados do novo professor</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Nome Completo</Label>
                <Input
                  required
                  maxLength={100}
                  placeholder="Nome do professor"
                  value={addProfessorForm.name}
                  onChange={(e) => updateAddProfessorField("name", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.name && <p className="text-xs text-destructive">{addProfessorFieldErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">CPF</Label>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="123.456.789-00"
                  value={addProfessorForm.cpf}
                  onChange={(e) => updateAddProfessorField("cpf", formatCpf(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.cpf && <p className="text-xs text-destructive">{addProfessorFieldErrors.cpf}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Telefone</Label>
                <Input
                  required
                  inputMode="tel"
                  maxLength={15}
                  placeholder="(11) 9XXXX-XXXX"
                  value={addProfessorForm.phone}
                  onChange={(e) => updateAddProfessorField("phone", formatPhone(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.phone && <p className="text-xs text-destructive">{addProfessorFieldErrors.phone}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Email</Label>
                <Input
                  required
                  type="email"
                  maxLength={120}
                  placeholder="email@fitpro.com"
                  value={addProfessorForm.email}
                  onChange={(e) => updateAddProfessorField("email", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.email && <p className="text-xs text-destructive">{addProfessorFieldErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Horario</Label>
                <Input
                  required
                  placeholder="06:00 - 14:00"
                  value={addProfessorForm.horario}
                  onChange={(e) => updateAddProfessorField("horario", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.horario && <p className="text-xs text-destructive">{addProfessorFieldErrors.horario}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Salario</Label>
                <Input
                  required
                  inputMode="decimal"
                  placeholder="4500,00"
                  value={addProfessorForm.salario}
                  onChange={(e) => updateAddProfessorField("salario", formatCurrencyInput(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {addProfessorFieldErrors.salario && <p className="text-xs text-destructive">{addProfessorFieldErrors.salario}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Especialidade Principal</Label>
                <Select value={addProfessorForm.speciality} onValueChange={(value) => updateAddProfessorField("speciality", value)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PROFESSOR_SPECIALITIES.map((m) => (
                      <SelectItem key={m} value={m} className="text-foreground">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addProfessorFieldErrors.speciality && <p className="text-xs text-destructive">{addProfessorFieldErrors.speciality}</p>}
              </div>
            </div>
            {addProfessorError && <p className="text-sm text-destructive">{addProfessorError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onAddProfessorDialogChange(false)} className="border-border text-foreground hover:bg-secondary">
              Cancelar
            </Button>
            <Button
              disabled={!isAddProfessorFormComplete || isSavingProfessor}
              onClick={handleAddProfessor}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingProfessor ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditProfessorDialog}
        onOpenChange={(open) => {
          setShowEditProfessorDialog(open)
          if (!open) {
            setEditProfessorForm(EMPTY_EDIT_PROFESSOR_FORM)
            setEditProfessorFieldErrors({})
            setEditProfessorError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Editar Professor</DialogTitle>
            <DialogDescription>
              {editProfessorForm.name ? `Atualize os dados de ${editProfessorForm.name}` : "Atualize os dados do professor"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Nome Completo</Label>
                <Input
                  maxLength={100}
                  value={editProfessorForm.name}
                  onChange={(e) => updateEditProfessorField("name", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {editProfessorFieldErrors.name && <p className="text-xs text-destructive">{editProfessorFieldErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">CPF</Label>
                <Input value={editProfessorForm.cpf} disabled className="bg-secondary border-border text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Telefone</Label>
                <Input
                  inputMode="tel"
                  maxLength={15}
                  value={editProfessorForm.phone}
                  onChange={(e) => updateEditProfessorField("phone", formatPhone(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {editProfessorFieldErrors.phone && <p className="text-xs text-destructive">{editProfessorFieldErrors.phone}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Email</Label>
                <Input
                  type="email"
                  maxLength={120}
                  value={editProfessorForm.email}
                  onChange={(e) => updateEditProfessorField("email", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {editProfessorFieldErrors.email && <p className="text-xs text-destructive">{editProfessorFieldErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Horario</Label>
                <Input
                  value={editProfessorForm.horario}
                  onChange={(e) => updateEditProfessorField("horario", e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {editProfessorFieldErrors.horario && <p className="text-xs text-destructive">{editProfessorFieldErrors.horario}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Salario</Label>
                <Input
                  inputMode="decimal"
                  value={editProfessorForm.salario}
                  onChange={(e) => updateEditProfessorField("salario", formatCurrencyInput(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {editProfessorFieldErrors.salario && <p className="text-xs text-destructive">{editProfessorFieldErrors.salario}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Especialidade Principal</Label>
                <Select value={editProfessorForm.speciality} onValueChange={(value) => updateEditProfessorField("speciality", value)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PROFESSOR_SPECIALITIES.map((m) => (
                      <SelectItem key={m} value={m} className="text-foreground">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editProfessorFieldErrors.speciality && <p className="text-xs text-destructive">{editProfessorFieldErrors.speciality}</p>}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Status</Label>
                <Select value={editProfessorForm.status} onValueChange={(value: ProfessorStatus) => updateEditProfessorField("status", value)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ativo" className="text-foreground">Ativo</SelectItem>
                    <SelectItem value="ferias" className="text-foreground">Ferias</SelectItem>
                    <SelectItem value="inativo" className="text-foreground">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {editProfessorFieldErrors.status && <p className="text-xs text-destructive">{editProfessorFieldErrors.status}</p>}
              </div>
            </div>
            {editProfessorError && <p className="text-sm text-destructive">{editProfessorError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfessorDialog(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditProfessor}
              disabled={isUpdatingProfessor}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUpdatingProfessor ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Registrar Pagamento ==================== */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          setShowPaymentDialog(open)
          if (!open) {
            setPaymentAmount("R$ 0,00")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedStudent ? `Pagamento para ${selectedStudent.name}` : "Registrar pagamento"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Valor</Label>
              <Input
                inputMode="numeric"
                placeholder="R$ 120,00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(formatCurrencyInput(e.target.value))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Forma de Pagamento</Label>
              <Select>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="dinheiro" className="text-foreground">Dinheiro</SelectItem>
                  <SelectItem value="pix" className="text-foreground">PIX</SelectItem>
                  <SelectItem value="cartao-debito" className="text-foreground">Cartao de Debito</SelectItem>
                  <SelectItem value="cartao-credito" className="text-foreground">Cartao de Credito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Referencia</Label>
              <Input placeholder="Mensalidade Mar/2026" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="border-border text-foreground hover:bg-secondary">
              Cancelar
            </Button>
            <Button onClick={() => setShowPaymentDialog(false)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <CreditCard className="h-4 w-4" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showStudentClassReallocationDialog}
        onOpenChange={(open) => {
          setShowStudentClassReallocationDialog(open)
          if (!open) {
            setStudentClassReallocationForm(EMPTY_STUDENT_CLASS_REALLOCATION_FORM)
            setStudentClassReallocationError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Realocar Aluno</DialogTitle>
            <DialogDescription>
              {selectedStudent
                ? `Altere a sala ou o horario de ${selectedStudent.name} para uma turma ja cadastrada.`
                : "Escolha a turma atual e a turma de destino."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Turma atual</Label>
              <Select
                value={studentClassReallocationForm.sourceClassId}
                onValueChange={(value) => {
                  setStudentClassReallocationForm({ sourceClassId: value, targetClassId: "" })
                  setStudentClassReallocationError("")
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione a turma atual" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {studentAssignedClasses.map((agendaClass) => (
                    <SelectItem key={agendaClass.id} value={agendaClass.id} className="text-foreground">
                      {agendaClass.event} • {agendaClass.time} • {agendaClass.room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Nova sala / horario</Label>
              <Select
                value={studentClassReallocationForm.targetClassId}
                onValueChange={(value) => {
                  setStudentClassReallocationForm((prev) => ({ ...prev, targetClassId: value }))
                  setStudentClassReallocationError("")
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione a turma de destino" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableTargetClassesForStudent.map((agendaClass) => (
                    <SelectItem key={agendaClass.id} value={agendaClass.id} className="text-foreground">
                      {agendaClass.event} • {agendaClass.time} • {agendaClass.room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {studentClassReallocationError && <p className="text-sm text-destructive">{studentClassReallocationError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStudentClassReallocationDialog(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleReallocateStudentClass} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Confirmar Realocacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Editar Aluno ==================== */}
      <Dialog
        open={showEditStudentDialog}
        onOpenChange={(open) => {
          setShowEditStudentDialog(open)
          if (!open) {
            setEditStudentForm(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Editar Aluno</DialogTitle>
            <DialogDescription>
              {editStudentForm ? `Atualize os dados de ${editStudentForm.name}` : "Atualize os dados do aluno"}
            </DialogDescription>
          </DialogHeader>
          {editStudentForm && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Nome Completo</Label>
                  <Input
                    value={editStudentForm.name}
                    onChange={(e) => updateEditStudentField("name", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">CPF</Label>
                  <Input value={editStudentForm.cpf} disabled className="bg-secondary border-border text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Telefone</Label>
                  <Input
                    value={editStudentForm.phone}
                    onChange={(e) => updateEditStudentField("phone", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Email</Label>
                  <Input
                    type="email"
                    value={editStudentForm.email}
                    onChange={(e) => updateEditStudentField("email", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Idade</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editStudentForm.age}
                    onChange={(e) => {
                      const nextAge = Number.parseInt(e.target.value, 10)
                      updateEditStudentField("age", Number.isNaN(nextAge) ? 0 : nextAge)
                    }}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Peso</Label>
                  <Input
                    value={editStudentForm.weight}
                    onChange={(e) => updateEditStudentField("weight", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Plano</Label>
                  <Select value={editStudentForm.plan} onValueChange={(value) => updateEditStudentField("plan", value)}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Basico" className="text-foreground">Basico</SelectItem>
                      <SelectItem value="Premium" className="text-foreground">Premium</SelectItem>
                      <SelectItem value="VIP" className="text-foreground">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Status</Label>
                  <Select value={editStudentForm.status} onValueChange={(value) => updateEditStudentField("status", value)}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ativo" className="text-foreground">Ativo</SelectItem>
                      <SelectItem value="inativo" className="text-foreground">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Pagamento</Label>
                  <Select value={editStudentForm.payment} onValueChange={(value) => updateEditStudentField("payment", value)}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="em-dia" className="text-foreground">Em dia</SelectItem>
                      <SelectItem value="atrasado" className="text-foreground">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Vencimento</Label>
                  <Input
                    value={editStudentForm.vencimento}
                    onChange={(e) => updateEditStudentField("vencimento", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Ultimo Pagamento</Label>
                  <Input
                    value={editStudentForm.lastPayment}
                    onChange={(e) => updateEditStudentField("lastPayment", e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditStudentDialog(false)
                setEditStudentForm(null)
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={saveStudentEdition} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Edit className="h-4 w-4" />
              Salvar Alteracoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Nova Despesa / Novo Recebimento ==================== */}
      <Dialog
        open={financeDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFinanceDialog(null)
            setFinanceFormError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">
              {financeDialog === "despesa" ? "Nova Despesa" : "Novo Recebimento"}
            </DialogTitle>
            <DialogDescription>
              {financeDialog === "despesa" ? "Registre uma despesa da academia" : "Registre um recebimento"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Categoria</Label>
              <Select value={financeForm.category} onValueChange={(value) => updateFinanceFormField("category", value)}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {financeDialog === "despesa" ? (
                    <>
                      <SelectItem value="luz" className="text-foreground">Energia Eletrica</SelectItem>
                      <SelectItem value="agua" className="text-foreground">Agua</SelectItem>
                      <SelectItem value="aluguel" className="text-foreground">Aluguel</SelectItem>
                      <SelectItem value="salarios" className="text-foreground">Salarios</SelectItem>
                      <SelectItem value="equipamentos" className="text-foreground">Equipamentos</SelectItem>
                      <SelectItem value="manutencao" className="text-foreground">Manutencao</SelectItem>
                      <SelectItem value="outros-despesa" className="text-foreground">Outros</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="mensalidade" className="text-foreground">Mensalidade</SelectItem>
                      <SelectItem value="matricula" className="text-foreground">Matricula</SelectItem>
                      <SelectItem value="personal" className="text-foreground">Personal Training</SelectItem>
                      <SelectItem value="loja" className="text-foreground">Loja / Suplementos</SelectItem>
                      <SelectItem value="outros-receita" className="text-foreground">Outros</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Descricao</Label>
              <Input
                placeholder={financeDialog === "despesa" ? "Ex: Conta de luz" : "Ex: Mensalidade aluno"}
                value={financeForm.description}
                onChange={(e) => updateFinanceFormField("description", e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Valor</Label>
              <Input
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={financeForm.value}
                onChange={(e) => updateFinanceFormField("value", formatCurrencyInput(e.target.value))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Data</Label>
              <Input
                type="date"
                value={financeForm.date}
                onChange={(e) => updateFinanceFormField("date", e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            {financeFormError && <p className="text-sm text-destructive">{financeFormError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFinanceDialog(null)
                setFinanceFormError("")
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveFinanceEntry} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showProfessorVacationDialog}
        onOpenChange={(open) => {
          setShowProfessorVacationDialog(open)
          if (!open) {
            setSelectedProfessorForVacation(null)
            setVacationError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Gestao de Ferias</DialogTitle>
            <DialogDescription>
              {selectedProfessorForVacation
                ? `Defina o periodo de ferias de ${selectedProfessorForVacation.name} pela administracao.`
                : "Selecione um professor para gerir ferias."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Inicio das ferias</Label>
                <Input
                  type="date"
                  value={vacationStartDate}
                  onChange={(e) => {
                    setVacationStartDate(e.target.value)
                    setVacationError("")
                  }}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Fim das ferias</Label>
                <Input
                  type="date"
                  value={vacationEndDate}
                  onChange={(e) => {
                    setVacationEndDate(e.target.value)
                    setVacationError("")
                  }}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            {currentProfessorVacation && (
              <div className="rounded-lg border border-border bg-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Periodo atual</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${currentProfessorVacation.startDate}T00:00:00`).toLocaleDateString("pt-BR")} ate {new Date(`${currentProfessorVacation.endDate}T00:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="outline" className={getVacationActionClasses(currentProfessorVacation.action)}>
                    {getVacationActionLabel(currentProfessorVacation.action)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => handleProfessorVacationAction("aprovada")} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <CheckCircle2 className="h-4 w-4" />
                Aprovar Ferias
              </Button>
              <Button onClick={() => handleProfessorVacationAction("reprovada")} variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" />
                Reprovar
              </Button>
              <Button
                onClick={() => handleProfessorVacationAction("realocada")}
                variant="outline"
                className="gap-2 border-border text-foreground hover:bg-secondary"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Realocar Ferias
              </Button>
              <Button
                onClick={() => handleProfessorVacationAction("concedida")}
                variant="outline"
                className="gap-2 border-[oklch(0.55_0.15_250)]/30 text-[oklch(0.65_0.18_250)] hover:bg-[oklch(0.55_0.15_250)]/10"
              >
                <Calendar className="h-4 w-4" />
                Dar Ferias
              </Button>
            </div>

            {vacationError && <p className="text-sm text-destructive">{vacationError}</p>}

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Historico recente</p>
              {getProfessorVacationHistory(selectedProfessorForVacation).length > 0 ? (
                getProfessorVacationHistory(selectedProfessorForVacation).slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary p-3">
                    <div>
                      <p className="text-sm text-foreground">{getVacationActionLabel(entry.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`${entry.startDate}T00:00:00`).toLocaleDateString("pt-BR")} ate {new Date(`${entry.endDate}T00:00:00`).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="outline" className={getVacationActionClasses(entry.action)}>
                      {entry.action}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                  Nenhum historico de ferias registrado para este professor.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProfessorVacationDialog(false)
                setSelectedProfessorForVacation(null)
                setVacationError("")
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPayrollAdjustDialog}
        onOpenChange={(open) => {
          setShowPayrollAdjustDialog(open)
          if (!open) {
            setSelectedPayrollEntry(null)
            setPayrollAdjustmentForm(EMPTY_PAYROLL_ADJUSTMENT_FORM)
            setPayrollAdjustmentError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Ajustar Folha</DialogTitle>
            <DialogDescription>
              {selectedPayrollEntry ? `Altere valor ou data de ${selectedPayrollEntry.professorName}` : "Ajuste a provisao da folha"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Valor base provisionado</p>
              <p className="text-sm font-mono text-foreground">{selectedPayrollEntry?.baseAmountLabel || "R$ 0,00"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Valor ajustado</Label>
              <Input
                placeholder="4500,00"
                value={payrollAdjustmentForm.amount}
                onChange={(e) => updatePayrollAdjustmentField("amount", formatCurrencyInput(e.target.value))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Data de pagamento</Label>
              <Input
                type="date"
                value={payrollAdjustmentForm.dueDate}
                onChange={(e) => updatePayrollAdjustmentField("dueDate", e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Observacao</Label>
              <Input
                placeholder="Ex: bonus por aula extra ou antecipacao"
                value={payrollAdjustmentForm.notes}
                onChange={(e) => updatePayrollAdjustmentField("notes", e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {payrollAdjustmentError && <p className="text-sm text-destructive">{payrollAdjustmentError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayrollAdjustDialog(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePayrollAdjustment}
              disabled={isSavingPayrollAdjustment}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingPayrollAdjustment ? "Salvando..." : "Salvar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Criar Turma / Cancelar Aula ==================== */}
      <Dialog
        open={agendaDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAgendaDialog(null)
            resetAgendaClassDialog()
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">
              {agendaDialog === "criar-turma" ? "Criar Nova Turma" : agendaDialog === "editar-turma" ? "Editar Turma" : "Cancelar Aula"}
            </DialogTitle>
            <DialogDescription>
              {agendaDialog === "cancelar-aula"
                ? "Confirme o cancelamento da turma selecionada."
                : "Defina os detalhes da turma para salvar na agenda."}
            </DialogDescription>
          </DialogHeader>
          {agendaDialog === "cancelar-aula" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Turma a cancelar</Label>
                <Select
                  value={selectedAgendaClassForAction?.id || ""}
                  onValueChange={(value) => {
                    setSelectedAgendaClassForAction(agendaToday.find((item) => item.id === value) || null)
                    setAgendaClassError("")
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {agendaToday.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-foreground">
                        {item.event} • {item.time} • {item.room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="text-sm font-medium text-foreground">{selectedAgendaClassForAction?.event || "Turma"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedAgendaClassForAction
                    ? `${selectedAgendaClassForAction.time} • ${selectedAgendaClassForAction.room} • ${selectedAgendaClassForAction.professor}`
                    : "Selecione uma turma na agenda para cancelar."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  O cancelamento remove a turma da agenda salva no banco, junto com os vinculos atuais.
                </p>
              </div>
              {agendaClassError && <p className="text-sm text-destructive">{agendaClassError}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Nome da Turma</Label>
                <Input
                  placeholder="Ex: Musculacao - Turma D"
                  value={agendaClassForm.event}
                  onChange={(e) => {
                    setAgendaClassForm((prev) => ({ ...prev, event: e.target.value }))
                    setAgendaClassError("")
                  }}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Professor</Label>
                <Select
                  value={agendaClassForm.professor}
                  onValueChange={(value) => {
                    setAgendaClassForm((prev) => ({ ...prev, professor: value }))
                    setAgendaClassError("")
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {activeProfessorsForAgenda.map((p) => (
                      <SelectItem key={p.cpf} value={p.name} className="text-foreground">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Horario</Label>
                  <Input
                    type="time"
                    value={agendaClassForm.time}
                    onChange={(e) => {
                      setAgendaClassForm((prev) => ({ ...prev, time: e.target.value }))
                      setAgendaClassError("")
                    }}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-xs">Sala</Label>
                  <Input
                    placeholder="Sala 1"
                    value={agendaClassForm.room}
                    onChange={(e) => {
                      setAgendaClassForm((prev) => ({ ...prev, room: e.target.value }))
                      setAgendaClassError("")
                    }}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Capacidade</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={agendaClassForm.capacity}
                  onChange={(e) => {
                    setAgendaClassForm((prev) => ({ ...prev, capacity: e.target.value.replace(/\D/g, "").slice(0, 3) }))
                    setAgendaClassError("")
                  }}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              {agendaClassError && <p className="text-sm text-destructive">{agendaClassError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAgendaDialog(null)
                resetAgendaClassDialog()
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void (agendaDialog === "cancelar-aula" ? handleCancelAgendaClass() : handleSaveAgendaClass())}
              disabled={isSavingAgendaClass}
              className={agendaDialog === "cancelar-aula"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
            >
              {isSavingAgendaClass
                ? "Salvando..."
                : agendaDialog === "criar-turma"
                ? "Criar Turma"
                : agendaDialog === "editar-turma"
                ? "Salvar Alteracoes"
                : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: Criar Plano ==================== */}
      <Dialog
        open={showAddPlanDialog}
        onOpenChange={(open) => {
          setShowAddPlanDialog(open)
          if (!open) {
            resetPlanDialog()
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">{editingPlanId ? "Editar Plano" : "Criar Novo Plano"}</DialogTitle>
            <DialogDescription>Monte o plano com modalidades cobertas e beneficios de forma mais organizada.</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[calc(90vh-9rem)] flex-col gap-4 overflow-y-auto pr-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Nome do Plano</Label>
              <Input
                placeholder="Ex: Plano Gold"
                value={planForm.name}
                onChange={(e) => {
                  setPlanForm((prev) => ({ ...prev, name: e.target.value }))
                  setPlanFormError("")
                }}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Preco</Label>
                <Input
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(formatCurrencyInput(e.target.value))}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Duracao</Label>
                <Select
                  value={planForm.duration}
                  onValueChange={(value) => {
                    setPlanForm((prev) => ({ ...prev, duration: value }))
                    setPlanFormError("")
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="mensal" className="text-foreground">Mensal</SelectItem>
                    <SelectItem value="trimestral" className="text-foreground">Trimestral</SelectItem>
                    <SelectItem value="semestral" className="text-foreground">Semestral</SelectItem>
                    <SelectItem value="anual" className="text-foreground">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Modalidades cobertas</Label>
              <div className="rounded-xl border border-border bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Selecione quais modalidades esse plano libera para o aluno.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROFESSOR_SPECIALITIES.map((modality) => {
                    const isSelected = planForm.modalities.includes(modality)
                    return (
                      <Button
                        key={modality}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlanModality(modality)}
                        className={
                          isSelected
                            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                            : "border-border text-foreground hover:bg-background"
                        }
                      >
                        {modality}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Beneficios do plano</Label>
                <div className="rounded-xl border border-border bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">Clique para adicionar os beneficios mais comuns do plano.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PLAN_BENEFIT_OPTIONS.map((benefit) => {
                      const isSelected = planForm.benefits.includes(benefit)
                      return (
                        <Button
                          key={benefit}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => togglePlanBenefit(benefit)}
                          className={
                            isSelected
                              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                              : "border-border text-foreground hover:bg-background"
                          }
                        >
                          {benefit}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-xs">Adicionar beneficio personalizado</Label>
                <div className="rounded-xl border border-border bg-secondary p-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={planBenefitInput}
                      onChange={(e) => setPlanBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomPlanBenefit()
                        }
                      }}
                      placeholder="Ex: Congelamento de plano"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Button type="button" onClick={addCustomPlanBenefit} className="bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                      Adicionar
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Use isso para extras que nao estao na lista rapida.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Resumo do plano</p>
                  <p className="text-xs text-muted-foreground">Revise o que o aluno vai receber antes de salvar.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modalidades selecionadas</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {planForm.modalities.length > 0 ? planForm.modalities.map((modality) => (
                        <span key={modality} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                          {modality}
                        </span>
                      )) : <span className="text-xs text-muted-foreground">Nenhuma modalidade selecionada.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Beneficios selecionados</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {planForm.benefits.length > 0 ? planForm.benefits.map((benefit) => (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() => removePlanBenefit(benefit)}
                          className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                        >
                          {benefit} x
                        </button>
                      )) : <span className="text-xs text-muted-foreground">Nenhum beneficio selecionado.</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {planFormError && <p className="text-sm text-destructive">{planFormError}</p>}
          </div>
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setShowAddPlanDialog(false)} className="border-border text-foreground hover:bg-secondary">
              Cancelar
            </Button>
            <Button onClick={() => void handleSavePlan()} disabled={isSavingPlan} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSavingPlan ? "Salvando..." : editingPlanId ? "Salvar Alteracoes" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPlanReallocationDialog}
        onOpenChange={(open) => {
          setShowPlanReallocationDialog(open)
          if (!open) {
            setSelectedPlanForReallocation(null)
            setPlanReallocationForm(EMPTY_PLAN_REALLOCATION_FORM)
            setPlanReallocationError("")
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-foreground">Realocar Alunos</DialogTitle>
            <DialogDescription>
              {selectedPlanForReallocation
                ? `Mova os alunos ativos de ${selectedPlanForReallocation.name} para outro plano ativo.`
                : "Escolha um plano de destino para os alunos."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Plano de origem</p>
              <p className="mt-1 text-sm font-medium text-foreground">{selectedPlanForReallocation?.name || "-"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedPlanForReallocation
                  ? `${selectedPlanForReallocation.activeStudentsCount ?? countActiveStudentsForPlan(selectedPlanForReallocation.name)} aluno(s) ativo(s) vinculados.`
                  : "Nenhum plano selecionado."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-xs">Plano de destino</Label>
              <Select
                value={planReallocationForm.targetPlanId}
                onValueChange={(value) => {
                  setPlanReallocationForm({ targetPlanId: value })
                  setPlanReallocationError("")
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecione o novo plano" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {reallocationTargetPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="text-foreground">
                      {plan.name} • {plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reallocationTargetPlans.length === 0 && (
                <p className="text-xs text-muted-foreground">Nao ha outro plano ativo disponivel para receber esses alunos.</p>
              )}
            </div>

            {planReallocationError && <p className="text-sm text-destructive">{planReallocationError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanReallocationDialog(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleReallocatePlanStudents()}
              disabled={isReallocatingPlanStudents || reallocationTargetPlans.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isReallocatingPlanStudents ? "Realocando..." : "Confirmar Realocacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
