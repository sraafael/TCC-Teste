/**
 * Arquivo: front-end/components/theme-provider.tsx
 * Area: Front-end React (componentes)
 * Funcao: Arquivo de suporte do projeto.
 * Onde fica: /front-end/components/theme-provider.tsx
 */
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Encapsula o provedor de tema para permitir troca de dark/light/system no app.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
