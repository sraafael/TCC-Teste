/**
 * Arquivo: front-end/next.config.mjs
 * Area: Front-end configuracao
 * Funcao: Configuracoes de build/exibicao do Next.js para o projeto.
 * Onde fica: /front-end/next.config.mjs
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
