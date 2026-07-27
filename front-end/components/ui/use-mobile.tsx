/**
 * Arquivo: front-end/components/ui/use-mobile.tsx
 * Area: Front-end React (componentes)
 * Funcao: Arquivo de suporte do projeto.
 * Onde fica: /front-end/components/ui/use-mobile.tsx
 */
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      // TODO: REFACTOR - The breakpoint rule is hard-coded in the hook and mixed with viewport event wiring, making responsive behavior harder to evolve.
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
