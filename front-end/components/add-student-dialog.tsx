"use client"

import { useCallback } from "react"
import { useMutation } from "@/hooks/use-mutation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorAlert, LoadingOverlay } from "@/components/api-state"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { normalizeCpf } from "@/lib/utils"

interface AddStudentDialogProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const addStudentSchema = z.object({
  name: z.string().min(1, "Informe o nome do aluno."),
  cpf: z.preprocess((v) => (typeof v === "string" ? normalizeCpf(v) : v), z.string().length(11, "Informe um CPF válido com 11 dígitos.")),
  email: z.string().email("Informe um email válido."),
  phone: z.string().optional(),
  age: z.string().optional().refine((v) => v === undefined || v === "" || /^\d+$/.test(v), "Idade inválida"),
  weight: z.string().optional().refine((v) => v === undefined || v === "" || /^\d+(\.\d+)?$/.test(v), "Peso inválido"),
  plan: z.string().min(1, "Selecione um plano"),
})

type AddStudentForm = z.infer<typeof addStudentSchema>

export function AddStudentDialog({ onSuccess, onCancel }: AddStudentDialogProps) {
  const { mutate, loading, error, success } = useMutation()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddStudentForm>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      age: "",
      weight: "",
      plan: "",
    },
  })

  const onSubmit = useCallback(async (values: AddStudentForm) => {
    const payload = {
      nome: values.name,
      cpf: typeof values.cpf === "string" ? normalizeCpf(values.cpf) : values.cpf,
      email: values.email,
      telefone: values.phone,
      idade: values.age,
      peso: values.weight,
      plano: values.plan,
    }

    const result = await mutate("/api/cadastros/alunos", payload)
    if (result) {
      reset()
      onSuccess?.()
    }
  }, [mutate, onSuccess, reset])

  if (loading) {
    return <LoadingOverlay message="Adicionando aluno..." />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && <ErrorAlert error={error} />}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-3">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Aluno adicionado com sucesso!
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Nome do aluno"
          required
        />
        {errors.name && <p className="text-sm text-red-500">{String(errors.name.message)}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          {...register("cpf")}
          placeholder="123.456.789-00"
          required
        />
        {errors.cpf && <p className="text-sm text-red-500">{String(errors.cpf.message)}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="email@example.com"
          required
        />
        {errors.email && <p className="text-sm text-red-500">{String(errors.email.message)}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="(11) 99999-9999"
        />
        {errors.phone && <p className="text-sm text-red-500">{String(errors.phone.message)}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            type="number"
            {...register("age")}
            placeholder="25"
          />
          {errors.age && <p className="text-sm text-red-500">{String(errors.age.message)}</p>}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            {...register("weight")}
            placeholder="80.5"
          />
          {errors.weight && <p className="text-sm text-red-500">{String(errors.weight.message)}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="plan">Plano</Label>
        <select
          id="plan"
          {...register("plan")}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">Selecione um plano</option>
          <option value="Plano Basico">Plano Básico</option>
          <option value="Plano Premium">Plano Premium</option>
          <option value="Plano VIP">Plano VIP</option>
          <option value="Plano Trimestral">Plano Trimestral</option>
        </select>
        {errors.plan && <p className="text-sm text-red-500">{String(errors.plan.message)}</p>}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          Adicionar Aluno
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
