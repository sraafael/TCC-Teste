# Arquivo: back-end/config.py
# Area: Back-end Flask
# Funcao: Centraliza configuracoes de ambiente e seguranca basicas do Flask.
# Onde fica: /back-end/config.py

import os

class Config:
    # Endereco do banco principal da aplicacao Flask.
    SQLALCHEMY_DATABASE_URI = 'sqlite:///site.db'
    # Chave de sessao: usa variavel de ambiente quando disponivel e fallback local em dev.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default_secret_key'
    # Cookies HttpOnly bloqueiam leitura por JavaScript no navegador.
    SESSION_COOKIE_HTTPONLY = True
    # Em desenvolvimento local pode permanecer False; em producao deve ser True com HTTPS.
    SESSION_COOKIE_SECURE = False
    # Sessao armazenada no filesystem local do servidor Flask.
    SESSION_TYPE = 'filesystem'
