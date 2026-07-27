/**
 * Arquivo: front-end/lib/utils.ts
 * Area: Front-end utilitarios e dados
 * Funcao: Funcoes utilitarias compartilhadas (ex.: composicao de classes CSS).
 * Onde fica: /front-end/lib/utils.ts
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  // Junta classes condicionais (clsx) e resolve conflitos do Tailwind (twMerge).
  return twMerge(clsx(inputs))
}

export const normalizeCpf = (value: string) => value.replace(/\D/g, "")

// TODO: REFACTOR - A validação de CPF está embutida em utilidades de apresentação, misturando regra de negócio com formatação.
export const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2")
}

export const isValidCpf = (value: string) => {
  // TODO: REFACTOR - A regra de validação de CPF ficou espalhada entre normalização e cálculo de dígitos, o que aumenta o risco de inconsistência.
  const cpf = normalizeCpf(value)
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i)
  let checkDigit = (sum * 10) % 11
  if (checkDigit === 10) checkDigit = 0
  if (checkDigit !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i)
  checkDigit = (sum * 10) % 11
  if (checkDigit === 10) checkDigit = 0
  return checkDigit === Number(cpf[10])
}
