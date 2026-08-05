# 1. Entre na pasta do back-end
cd back-end

# 2. Delete a pasta do ambiente virtual antigo (ele está corrompido)
# rm -rf venv

# 3. Crie um novo ambiente virtual limpo
python3 -m venv venv

# 4. Ative o novo ambiente
source venv/bin/activate

# 5. Instale as dependências novamente (isso vai baixar o flask-cors e outros)
# pip install -r requirements.txt

# 6. Teste se rodou
python app.py




# 1. Instale a versão mais recente do Node (22+)
# nvm install 22
nvm use 22

# 2. Vá para a pasta do front-end
cd front-end

# 3. Aproxime a permissão para os scripts (conforme o erro sugeriu)
# pnpm approve-builds

# 4. Limpe o que deu errado (opcional, mas recomendado)
# f node_modules pnpm-lock.yaml

# 5. Tente instalar novamente
# pnpm install

# 6. Inicie o projeto
npm run dev
