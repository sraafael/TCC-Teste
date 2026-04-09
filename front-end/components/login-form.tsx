/**
 * Arquivo: front-end/components/login-form.tsx
 * Area: Front-end React (componentes)
 * Funcao: Formulario de autenticacao por perfil com controle de estado do envio.
 * Onde fica: /front-end/components/login-form.tsx
 */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Eye, EyeOff, type LucideIcon } from "lucide-react"
import { cn, formatCpf, isValidCpf, normalizeCpf } from "@/lib/utils"

interface LoginFormProps {
  role: string
  roleLabel: string
  icon: LucideIcon
  accentColor: string
  onBack: () => void
  onLogin: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000"

export function LoginForm({ role, roleLabel, icon: Icon, accentColor, onBack, onLogin }: LoginFormProps) {
  // Estados locais do formulario.
  const [cpf, setCpf] = useState("545.142.148-09")
  const [password, setPassword] = useState("123456789")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [showResetPanel, setShowResetPanel] = useState(false)
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isSendingResetCode, setIsSendingResetCode] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetMessage, setResetMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setResetError("")

    if (!isValidCpf(cpf)) {
      setLoginError("Informe um CPF valido com 11 digitos.")
      return
    }
    if (!password) {
      setLoginError("Informe sua senha para entrar.")
      return
    }

    const normalizedCpf = normalizeCpf(cpf)
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: normalizedCpf,
          password,
          role,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel realizar o login.")
      }

      onLogin()
    } catch (error) {
      let message = error instanceof Error ? error.message : "Falha ao realizar login."
      if (message.toLowerCase().includes("failed to fetch")) {
        message = `Nao foi possivel conectar na API (${API_BASE_URL}). Verifique se o back-end esta rodando.`
      }
      setLoginError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setLoginError("")
    setResetError("")
    setResetMessage("")

    if (!isValidCpf(cpf)) {
      setResetError("Informe um CPF valido com 11 digitos para redefinir a senha.")
      return
    }

    const normalizedCpf = normalizeCpf(cpf)
    try {
      setIsSendingResetCode(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: normalizedCpf, role }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel enviar o codigo de redefinicao.")
      }

      setShowResetPanel(true)
      const destinations = [payload.email, payload.whatsapp].filter(Boolean).join(" e ")
      setResetMessage(destinations ? `${payload.message} Destinos: ${destinations}.` : payload.message)
    } catch (error) {
      let message = error instanceof Error ? error.message : "Falha ao solicitar redefinicao."
      if (message.toLowerCase().includes("failed to fetch")) {
        message = `Nao foi possivel conectar na API (${API_BASE_URL}). Verifique se o back-end esta rodando.`
      }
      setResetError(message)
    } finally {
      setIsSendingResetCode(false)
    }
  }

  const handleResetPassword = async () => {
    setLoginError("")
    setResetError("")
    setResetMessage("")

    const normalizedCpf = normalizeCpf(cpf)
    if (normalizedCpf.length !== 11) {
      setResetError("CPF invalido.")
      return
    }
    if (!/^\d{6}$/.test(resetCode)) {
      setResetError("Informe o codigo de 6 digitos recebido.")
      return
    }
    if (newPassword.length < 6) {
      setResetError("A nova senha precisa ter pelo menos 6 caracteres.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setResetError("A confirmacao da senha nao confere.")
      return
    }

    try {
      setIsResettingPassword(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: normalizedCpf,
          role,
          code: resetCode,
          new_password: newPassword,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel redefinir a senha.")
      }

      setResetMessage(payload.message || "Senha redefinida com sucesso.")
      setPassword(newPassword)
      setResetCode("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error) {
      let message = error instanceof Error ? error.message : "Falha ao redefinir senha."
      if (message.toLowerCase().includes("failed to fetch")) {
        message = `Nao foi possivel conectar na API (${API_BASE_URL}). Verifique se o back-end esta rodando.`
      }
      setResetError(message)
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    // Cartao de login com retorno para selecao de perfil e autenticacao por CPF/senha.
    <div className="flex w-full max-w-md flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar
      </button>

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-xl",
            accentColor
          )}
        >
          <Icon className="h-8 w-8 text-card-foreground" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold font-mono tracking-tight text-foreground">
            {roleLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com suas credenciais para acessar
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${role}-cpf`} className="text-foreground">CPF</Label>
          <Input
            id={`${role}-cpf`}
            type="text"
            placeholder="Ex: 123.456.789-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            required
            className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${role}-password`} className="text-foreground">
            Senha
          </Label>
          <div className="relative">
            <Input
              id={`${role}-password`}
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10 focus-visible:border-primary focus-visible:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isSendingResetCode}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {isSendingResetCode ? "Enviando codigo..." : "Esqueceu a senha?"}
          </button>
        </div>

        {role === "student" && (
          <p className="text-xs text-muted-foreground">
            No primeiro acesso, use a senha numerica de 6 digitos gerada pela administracao.
          </p>
        )}

        {loginError && (
          <p className="text-sm text-red-500">{loginError}</p>
        )}

        {resetError && (
          <p className="text-sm text-red-500">{resetError}</p>
        )}
        {resetMessage && (
          <p className="text-sm text-green-600">{resetMessage}</p>
        )}

        {showResetPanel && (
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${role}-reset-code`} className="text-foreground">
                  Codigo de redefinicao
                </Label>
                <Input
                  id={`${role}-reset-code`}
                  type="text"
                  maxLength={6}
                  placeholder="Ex: 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`${role}-new-password`} className="text-foreground">
                  Nova senha
                </Label>
                <Input
                  id={`${role}-new-password`}
                  type="password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`${role}-confirm-password`} className="text-foreground">
                  Confirmar nova senha
                </Label>
                <Input
                  id={`${role}-confirm-password`}
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
                />
              </div>

              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm"
              >
                {isResettingPassword ? "Atualizando senha..." : "Atualizar senha com codigo"}
              </Button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Entrando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </div>
  )
}
