/**
 * Arquivo: front-end/app/layout.tsx
 * Area: Front-end Next.js (App Router)
 * Funcao: Layout raiz do Next.js com metadados, fontes globais e analytics.
 * Onde fica: /front-end/app/layout.tsx
 */
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Fontes globais expostas via CSS variables para uso em toda a aplicacao.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

// Metadados base do projeto (titulo, descricao e icones).
export const metadata: Metadata = {
  title: 'FitPro - Sistema de Academia',
  description: 'Sistema completo de gerenciamento de academia para administradores, professores e alunos.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root layout: aplica idioma, classes globais e injeta analytics no final.
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
