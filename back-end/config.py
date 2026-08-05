# Arquivo: back-end/config.py
# Area: Back-end Flask
# Funcao: Centraliza configuracoes de ambiente e seguranca basicas do Flask.
# Onde fica: /back-end/config.py

import os


class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///site.db'
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default_secret_key'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False
    SESSION_TYPE = 'filesystem'
