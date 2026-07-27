/**
 * Arquivo: front-end/app/layout.tsx
 * Area: Front-end Next.js (App Router)
 * Funcao: Layout raiz do Next.js com metadados, fontes globais e analytics.
 * Onde fica: /front-end/app/layout.tsx
 */
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import QueryProvider from "@/components/query-provider"

const appMetadata: Metadata = {
  title: "FitPro - Sistema de Academia",
  description: "Sistema completo de gerenciamento de academia para administradores, professores e alunos.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const metadata = appMetadata

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
