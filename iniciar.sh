#!/bin/bash

# Arquivo: iniciar.sh
# Area: Geral
# Funcao: Script de inicializacao local para subir back-end e front-end em sequencia.
# Onde fica: /iniciar.sh
# Fluxo: carrega ambiente Node/NVM, sobe Flask em background, abre navegador e inicia Next.js.

# Caminho raiz do projeto local (backend e frontend sao iniciados a partir daqui).
BASE_PATH="/home/rafael-bavaresco/Área de trabalho/TCC"

# --- CONFIGURAÇÃO DO NODE (NVM) ---
# Carrega o NVM para que o script reconheça a versão v24
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --lts > /dev/null

# 1) Inicia a API Flask no ambiente virtual Python.
echo "A iniciar o Back-end (API)..."
cd "$BASE_PATH/back-end"
source venv/bin/activate
python app.py &

# 2) Abre o navegador apos alguns segundos para dar tempo do front-end iniciar.
(sleep 8 && xdg-open http://localhost:3000) &

# 3) Inicia a interface Next.js em modo de desenvolvimento.
echo "A iniciar o Front-end (Interface)..."
cd "$BASE_PATH/front-end"
npm run dev

# Pausa caso ocorra algum erro para você conseguir ler
read -p "Pressione Enter para fechar..."
