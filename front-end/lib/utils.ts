/**
 * Arquivo: front-end/lib/utils.ts
 * Area: Front-end utilitarios e dados
 * Funcao: Funcoes utilitarias compartilhadas (ex.: composicao de classes CSS).
 * Onde fica: /front-end/lib/utils.ts
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizeCpf = (value: string) => value.replace(/\D/g, '')

const hasRepeatedDigits = (value: string) => /^(\d)\1{10}$/.test(value)

const calculateCpfCheckDigit = (digits: string, factor: number) => {
  const sum = digits.split('').reduce((total, char, index) => {
    return total + Number(char) * (factor - index)
  }, 0)

  const checkDigit = (sum * 10) % 11
  return checkDigit === 10 ? 0 : checkDigit
}

export const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return digits.replace(/^(\d{3})(\d)/, '$1.$2')
  if (digits.length <= 9) return digits.replace(/^(\d{3})(\d{3})(\d)/, '$1.$2.$3')

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4')
}

export const isValidCpf = (value: string) => {
  const cpf = normalizeCpf(value)
  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) return false

  const firstCheckDigit = calculateCpfCheckDigit(cpf.slice(0, 9), 10)
  if (firstCheckDigit !== Number(cpf[9])) return false

  const secondCheckDigit = calculateCpfCheckDigit(cpf.slice(0, 10), 11)
  return secondCheckDigit === Number(cpf[10])
}
