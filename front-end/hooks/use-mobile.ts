/**
 * Arquivo: front-end/hooks/use-mobile.ts
 * Area: Front-end hooks compartilhados
 * Funcao: Hook para detectar viewport mobile e adaptar a interface.
 * Onde fica: /front-end/hooks/use-mobile.ts
 */
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Comeca como undefined ate primeira leitura do viewport no client.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Listener reage a mudancas de largura da janela.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Garantia de retorno booleano (nunca undefined para quem consome o hook).
  return !!isMobile
}
