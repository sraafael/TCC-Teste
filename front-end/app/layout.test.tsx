import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}))

vi.mock('@/components/query-provider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>,
}))

import RootLayout from './layout'

describe('RootLayout', () => {
  it('renderiza o children dentro do provider e do analytics', () => {
    render(
      <RootLayout>
        <div>Conteúdo</div>
      </RootLayout>
    )

    expect(screen.getByTestId('query-provider')).toBeInTheDocument()
    expect(screen.getByTestId('analytics')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})
