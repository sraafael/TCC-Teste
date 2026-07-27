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
  // TODO: REFACTOR - The wrapper only abstracts the library but still hides the app-level theme policy from the rest of the codebase.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
