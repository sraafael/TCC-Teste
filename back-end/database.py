# Arquivo: back-end/database.py
# Area: Back-end Flask
# Funcao: Define modelos SQLAlchemy puros e inicializa o banco SQLite auxiliar.
# Onde fica: /back-end/database.py

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import relationship, declarative_base

# Base declarativa compartilhada por todos os modelos ORM deste arquivo.
Base = declarative_base()

class Aluno(Base):
    # Tabela com dados centrais do aluno.
    __tablename__ = 'alunos'
    id = Column(Integer, primary_key=True)
    nome = Column(String, nullable=False)
    idade = Column(Integer, nullable=False)
    # Relacao 1:N -> um aluno pode possuir varios planos.
    planos = relationship('Plano', back_populates='aluno')

    def to_dict(self):
        # Serializacao simples para retorno em JSON.
        return { 'id': self.id, 'nome': self.nome, 'idade': self.idade }

class Plano(Base):
    # Tabela de planos vinculada a alunos.
    __tablename__ = 'planos'
    id = Column(Integer, primary_key=True)
    tipo = Column(String, nullable=False)
    preco = Column(Integer, nullable=False)
    # Chave estrangeira para identificar a quem o plano pertence.
    aluno_id = Column(Integer, ForeignKey('alunos.id'))
    aluno = relationship('Aluno', back_populates='planos')

    def to_dict(self):
        return { 'id': self.id, 'tipo': self.tipo, 'preco': self.preco }

# Inicializacao do banco local usado por este modulo.
# Se necessario, substitua por outro provider (PostgreSQL/MySQL) mudando a URI.
engine = create_engine('sqlite:///database.db')
# Garante criacao das tabelas declaradas acima quando o modulo e carregado.
Base.metadata.create_all(engine)
