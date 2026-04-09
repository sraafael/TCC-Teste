/**
 * Arquivo: front-end/components/ui/aspect-ratio.tsx
 * Area: Front-end React (componentes)
 * Funcao: Arquivo de suporte do projeto.
 * Onde fica: /front-end/components/ui/aspect-ratio.tsx
 */
'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
