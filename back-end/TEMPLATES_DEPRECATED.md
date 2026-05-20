# Templates (DEPRECATED)

Este diretório de templates foi mantido apenas para histórico. A partir desta refatoração o backend atua exclusivamente como uma API REST e não usa mais `render_template`.

A pasta `templates/` permanece para referência (HTML legado). Recomenda-se arquivar ou remover estes arquivos antes do deploy em produção.

Para restaurar o comportamento anterior, reimplemente `render_template` nas rotas necessárias e mova os arquivos HTML de volta para `templates/`.

Motivação:
- Separar responsabilidades (backend = API; frontend = Next.js)
- Evitar renderização server-side duplicada
- Facilitar deploys e escalabilidade

Ação sugerida:
- Migrar ou copiar qualquer HTML necessário para o projeto Next.js
- Remover o diretório `templates/` quando confirmado que nenhuma rota depende dele
