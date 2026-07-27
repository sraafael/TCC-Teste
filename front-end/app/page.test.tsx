import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/role-card', () => ({
  RoleCard: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button onClick={onClick}>{title}</button>
  ),
}))

vi.mock('@/components/login-form', () => ({
  LoginForm: ({ roleLabel, onBack, onLogin }: { roleLabel: string; onBack: () => void; onLogin: () => void }) => (
    <div>
      <button onClick={onBack}>Voltar</button>
      <div>{roleLabel}</div>
      <button onClick={onLogin}>Entrar</button>
    </div>
  ),
}))

vi.mock('@/components/dashboard-admin', () => ({
  DashboardAdmin: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>dashboard-admin</button>,
}))

vi.mock('@/components/dashboard-professor', () => ({
  DashboardProfessor: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>dashboard-professor</button>,
}))

vi.mock('@/components/dashboard-student', () => ({
  DashboardStudent: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>dashboard-student</button>,
}))

import Home from './page'

describe('Home', () => {
  it('renderiza a tela inicial com os perfis disponíveis', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: 'FitPro' })).toBeInTheDocument()
    expect(screen.getByText('Sistema de gerenciamento de academia. Selecione seu perfil para continuar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Administração' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Professor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aluno' })).toBeInTheDocument()
  })

  it('avança do select para o login ao selecionar um perfil', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Administração' }))

    expect(screen.getByText('Administração')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('retorna à tela de seleção ao clicar em voltar', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Professor' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('heading', { name: 'FitPro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Administração' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aluno' })).toBeInTheDocument()
  })

  it('abre o dashboard correspondente ao efetuar login', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Aluno' }))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'dashboard-student' })).toBeInTheDocument()
  })

  it('volta à tela inicial ao fazer logout no dashboard', async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getByRole('button', { name: 'Professor' }))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await user.click(screen.getByRole('button', { name: 'dashboard-professor' }))

    expect(screen.getByRole('heading', { name: 'FitPro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Administração' })).toBeInTheDocument()
  })
})
