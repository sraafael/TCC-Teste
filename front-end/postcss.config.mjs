/**
 * Arquivo: front-end/postcss.config.mjs
 * Area: Front-end configuracao
 * Funcao: Configuracao do PostCSS com plugin do Tailwind CSS.
 * Onde fica: /front-end/postcss.config.mjs
 */
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
