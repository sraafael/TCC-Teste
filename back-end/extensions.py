from flask_sqlalchemy import SQLAlchemy

# TODO: REFACTOR - A extensão de banco é exposta como singleton global, o que pode dificultar testes e múltiplos contextos de app.
# Instância de extensão para ser inicializada pelo app principal.
db = SQLAlchemy()
