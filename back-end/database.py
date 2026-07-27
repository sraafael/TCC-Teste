# Arquivo: back-end/database.py
# Area: Back-end Flask
# Funcao: Define modelos SQLAlchemy com context manager para gerenciamento seguro de conexoes.
# Onde fica: /back-end/database.py

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from contextlib import contextmanager

# TODO: REFACTOR - O módulo mistura definição de modelos, engine e helpers de acesso, concentrando responsabilidades e dificultando evolução independente.
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

# TODO: REFACTOR - A configuração do banco está hardcoded em um arquivo de domínio, o que aumenta o acoplamento com o ambiente local.
# Inicializacao do engine com pool_pre_ping para validar conexoes antes de usar.
# Se necessario, substitua por outro provider (PostgreSQL/MySQL) mudando a URI.
engine = create_engine('sqlite:///database.db', connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Garante criacao das tabelas declaradas acima quando o modulo e carregado.
Base.metadata.create_all(engine)

@contextmanager
def get_db_session():
    """Context manager para gerenciar sessoes com fechamento automatico."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Helper functions com context manager
def create_aluno(nome: str, idade: int) -> Aluno:
    """Cria um novo aluno com seguranca de conexao."""
    with get_db_session() as session:
        aluno = Aluno(nome=nome, idade=idade)
        session.add(aluno)
        session.flush()
        return aluno

def get_aluno(aluno_id: int) -> Aluno:
    """Retorna um aluno por ID."""
    with get_db_session() as session:
        return session.query(Aluno).filter(Aluno.id == aluno_id).first()

def get_all_alunos() -> list:
    """Retorna todos os alunos."""
    with get_db_session() as session:
        return session.query(Aluno).all()

def update_aluno(aluno_id: int, nome: str = None, idade: int = None) -> Aluno:
    """Atualiza dados do aluno."""
    with get_db_session() as session:
        aluno = session.query(Aluno).filter(Aluno.id == aluno_id).first()
        if aluno:
            if nome:
                aluno.nome = nome
            if idade:
                aluno.idade = idade
        return aluno

def delete_aluno(aluno_id: int) -> bool:
    """Deleta um aluno."""
    with get_db_session() as session:
        aluno = session.query(Aluno).filter(Aluno.id == aluno_id).first()
        if aluno:
            session.delete(aluno)
            return True
        return False

def create_plano(aluno_id: int, tipo: str, preco: int) -> Plano:
    """Cria um novo plano para um aluno."""
    with get_db_session() as session:
        plano = Plano(tipo=tipo, preco=preco, aluno_id=aluno_id)
        session.add(plano)
        session.flush()
        return plano

def get_planos_by_aluno(aluno_id: int) -> list:
    """Retorna todos os planos de um aluno."""
    with get_db_session() as session:
        return session.query(Plano).filter(Plano.aluno_id == aluno_id).all()

def delete_plano(plano_id: int) -> bool:
    """Deleta um plano."""
    with get_db_session() as session:
        plano = session.query(Plano).filter(Plano.id == plano_id).first()
        if plano:
            session.delete(plano)
            return True
        return False
