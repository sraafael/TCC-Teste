from datetime import datetime, date
from extensions import db


class SafeModelMixin:
    """Mixin que expõe um `to_dict()` seguro, usando a lista `__public_fields__`.

    - Evita expor atributos sensiveis (ex.: hashes) por omissao.
    - Converte objetos `date`/`datetime` para ISO strings.
    """
    __public_fields__ = []

    def to_dict(self, include=None, exclude=None):
        include = include if include is not None else getattr(self, '__public_fields__', [])
        exclude = set(exclude or [])
        result = {}
        for key in include:
            if key in exclude:
                continue
            value = getattr(self, key, None)
            if isinstance(value, (datetime, date)):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result


class Aluno(SafeModelMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    __public_fields__ = ['id', 'nome']


class Plano(SafeModelMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(100), nullable=False)
    __public_fields__ = ['id', 'descricao']


class PlanoAcademia(SafeModelMixin, db.Model):
    __tablename__ = 'planos_academia'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False, index=True)
    preco = db.Column(db.Float, nullable=False)
    duracao = db.Column(db.String(30), nullable=False)
    modalidades = db.Column(db.Text, nullable=False, default='')
    beneficios = db.Column(db.Text, nullable=False, default='')
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    __public_fields__ = [
        'id', 'nome', 'preco', 'duracao', 'modalidades', 'beneficios', 'ativo', 'criado_em', 'atualizado_em'
    ]


class AlunoCadastro(SafeModelMixin, db.Model):
    __tablename__ = 'alunos_cadastro'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False, index=True)
    telefone = db.Column(db.String(11), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    idade = db.Column(db.Integer, nullable=False)
    peso = db.Column(db.Float, nullable=False)
    plano = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ativo')
    pagamento = db.Column(db.String(20), nullable=False, default='em-dia')
    vencimento = db.Column(db.String(20), nullable=False, default='-')
    ultimo_pagamento = db.Column(db.String(20), nullable=False, default='-')
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    __public_fields__ = [
        'id', 'nome', 'cpf', 'telefone', 'email', 'idade', 'peso', 'plano', 'status',
        'pagamento', 'vencimento', 'ultimo_pagamento', 'criado_em'
    ]


class ProfessorCadastro(SafeModelMixin, db.Model):
    __tablename__ = 'professores_cadastro'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False, index=True)
    telefone = db.Column(db.String(11), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    horario = db.Column(db.String(30), nullable=False)
    salario = db.Column(db.Float, nullable=False)
    especialidade = db.Column(db.String(60), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ativo')
    alunos_ativos = db.Column(db.Integer, nullable=False, default=0)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    __public_fields__ = [
        'id', 'nome', 'cpf', 'telefone', 'email', 'horario', 'salario', 'especialidade',
        'status', 'alunos_ativos', 'criado_em'
    ]


class TurmaAgenda(SafeModelMixin, db.Model):
    __tablename__ = 'turmas_agenda'
    id = db.Column(db.String(20), primary_key=True)
    horario = db.Column(db.String(5), nullable=False)
    evento = db.Column(db.String(100), nullable=False)
    professor = db.Column(db.String(100), nullable=False)
    professor_status = db.Column(db.String(20), nullable=False, default='confirmado')
    sala = db.Column(db.String(50), nullable=False)
    capacidade = db.Column(db.Integer, nullable=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    __public_fields__ = ['id', 'horario', 'evento', 'professor', 'professor_status', 'sala', 'capacidade', 'criado_em']


class TurmaAluno(SafeModelMixin, db.Model):
    __tablename__ = 'turmas_alunos'
    id = db.Column(db.Integer, primary_key=True)
    turma_id = db.Column(db.String(20), db.ForeignKey('turmas_agenda.id'), nullable=False, index=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos_cadastro.id'), nullable=True, index=True)
    aluno_nome = db.Column(db.String(100), nullable=False)
    pagamento = db.Column(db.String(20), nullable=False, default='em-dia')
    presente = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)

    turma = db.relationship('TurmaAgenda', backref=db.backref('alunos', lazy=True, cascade='all, delete-orphan'))
    aluno = db.relationship('AlunoCadastro', backref=db.backref('turmas_vinculadas', lazy=True))
    __public_fields__ = ['id', 'turma_id', 'aluno_id', 'aluno_nome', 'pagamento', 'presente', 'criado_em']


class RecebimentoAluno(SafeModelMixin, db.Model):
    __tablename__ = 'recebimentos_alunos'
    id = db.Column(db.Integer, primary_key=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('alunos_cadastro.id'), nullable=True, index=True)
    aluno_nome = db.Column(db.String(100), nullable=False)
    aluno_cpf = db.Column(db.String(11), nullable=False, index=True)
    referencia = db.Column(db.String(80), nullable=False)
    descricao = db.Column(db.String(120), nullable=False)
    provider = db.Column(db.String(40), nullable=False, default='manual')
    external_id = db.Column(db.String(80), nullable=True, unique=True, index=True)
    status = db.Column(db.String(20), nullable=False, default='pendente')
    valor = db.Column(db.Float, nullable=False)
    vencimento = db.Column(db.Date, nullable=False)
    pago_em = db.Column(db.DateTime, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)

    aluno = db.relationship('AlunoCadastro', backref=db.backref('recebimentos', lazy=True))
    __public_fields__ = [
        'id', 'aluno_id', 'aluno_nome', 'aluno_cpf', 'referencia', 'descricao', 'provider',
        'external_id', 'status', 'valor', 'vencimento', 'pago_em', 'criado_em'
    ]


class FolhaPagamentoProfessor(SafeModelMixin, db.Model):
    __tablename__ = 'folha_pagamento_professores'
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professores_cadastro.id'), nullable=False, index=True)
    professor_nome = db.Column(db.String(100), nullable=False)
    professor_cpf = db.Column(db.String(11), nullable=False, index=True)
    referencia = db.Column(db.String(7), nullable=False, index=True)
    valor_base = db.Column(db.Float, nullable=False)
    valor_ajustado = db.Column(db.Float, nullable=False)
    vencimento = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='provisionado')
    observacao = db.Column(db.String(255), nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.now)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    professor = db.relationship('ProfessorCadastro', backref=db.backref('folhas_pagamento', lazy=True))
    __public_fields__ = [
        'id', 'professor_id', 'professor_nome', 'professor_cpf', 'referencia', 'valor_base',
        'valor_ajustado', 'vencimento', 'status', 'observacao', 'criado_em', 'atualizado_em'
    ]


class Usuario(SafeModelMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), nullable=False)
    whatsapp = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    senha_hash = db.Column(db.String(255), nullable=False)
    reset_code_hash = db.Column(db.String(255), nullable=True)
    reset_code_expires_at = db.Column(db.DateTime, nullable=True)
    reset_code_used = db.Column(db.Boolean, default=True, nullable=False)
    __public_fields__ = ['id', 'nome', 'cpf', 'email', 'whatsapp', 'role']
