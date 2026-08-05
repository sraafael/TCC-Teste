/**
 * Arquivo: front-end/hooks/use-mobile.ts
 * Area: Front-end hooks compartilhados
 * Funcao: Hook para detectar viewport mobile e adaptar a interface.
 * Onde fica: /front-end/hooks/use-mobile.ts
 */
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const updateMobileState = () => setIsMobile(mql.matches)

    updateMobileState()
    mql.addEventListener("change", updateMobileState)
    return () => mql.removeEventListener("change", updateMobileState)
  }, [])

  return !!isMobile
}
