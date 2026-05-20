# Arquivo: back-end/app.py
# Area: Back-end Flask
# Funcao: Ponto de entrada da API Flask, com modelos e rotas de pagina/API.
# Onde fica: /back-end/app.py

import base64
import os
import re
import secrets
import smtplib
import urllib.parse
import urllib.request
from datetime import datetime, date, timedelta
from email.message import EmailMessage

from dotenv import load_dotenv 
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.exceptions import HTTPException
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
try:
    # Register pydantic-related handler only if pydantic is installed.
    from pydantic import ValidationError as PydanticValidationError
except Exception:
    PydanticValidationError = None

from validators import validate_request
from schemas import (
    AlunoCreate,
    AlunoUpdate,
    ProfessorCreate,
    ProfessorUpdate,
    PlanoCreate,
    PlanoUpdate,
    TurmaCreate,
    TurmaUpdate,
    PaymentCreate,
    EntryCreate,
)

load_dotenv()

# Inicializa aplicacao Flask e configura persistencia.
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///gym.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fitpro-dev-key')
db = SQLAlchemy(app)

# Configuracao otimizada de CORS para o front-end
# Origem(s) permitida(s) devem ser definidas via variavel de ambiente `NEXTJS_ORIGINS`
# Exemplo: NEXTJS_ORIGINS=http://localhost:3000,https://meu-site.com
frontend_origins = os.getenv('NEXTJS_ORIGINS') or os.getenv('FRONTEND_URL') or 'http://localhost:3000'
allowed_origins = [o.strip() for o in frontend_origins.split(',') if o.strip()]

CORS(
    app,
    resources={
        r'/api/*': {
            'origins': allowed_origins,
            'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
            'expose_headers': ['Content-Type', 'X-Total-Count'],
            'supports_credentials': os.getenv('CORS_SUPPORTS_CREDENTIALS', 'false').lower() == 'true',
            'max_age': int(os.getenv('CORS_MAX_AGE', '3600')),
        }
    },
    send_wildcard=False,
)

RESET_CODE_EXPIRATION_MINUTES = int(os.getenv('RESET_CODE_EXPIRATION_MINUTES', '10'))
SPECIAL_TEST_CPF = '54514214809'
SPECIAL_TEST_PASSWORD = '123456789'
DEV_FAKE_NOTIFICATIONS = os.getenv('DEV_FAKE_NOTIFICATIONS', 'true').lower() == 'true'


# -------------------------
# MODELOS (camada de dados)
# -------------------------
class SafeModelMixin:
    """Mixin que expõe um `to_dict()` seguro usando `__public_fields__`.

    Evita expor atributos sensiveis (ex.: hashes) por omissao e converte
    `date`/`datetime` para strings ISO.
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
    # Identificador unico do aluno.
    id = db.Column(db.Integer, primary_key=True)
    # Nome exibido no dashboard e nas listagens.
    nome = db.Column(db.String(100), nullable=False)
    __public_fields__ = ['id', 'nome']


class Plano(SafeModelMixin, db.Model):
    # Identificador unico do plano.
    id = db.Column(db.Integer, primary_key=True)
    # Campo textual para descrever o tipo do plano.
    descricao = db.Column(db.String(100), nullable=False)
    __public_fields__ = ['id', 'descricao']


class PlanoAcademia(SafeModelMixin, db.Model):
    # Catalogo persistido de planos disponiveis na academia.
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
    # Registro completo de aluno cadastrado pelo painel administrativo.
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
    # Registro completo de professor cadastrado pelo painel administrativo.
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
    # Cadastro persistido de turmas/horarios da agenda.
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
    # Vinculo entre aluno e turma para listagem/realocacao da agenda.
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
    # Registro financeiro automatizado de mensalidades/recebimentos do aluno.
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
    # Provisao mensal de salario de professores com possibilidade de ajuste.
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
    # Conta usada no login e no fluxo de redefinicao de senha.
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


# -------------------------
# FUNCOES AUXILIARES
# -------------------------
def normalize_cpf(raw_value):
    digits = re.sub(r'\D', '', raw_value or '')
    return digits


def get_user_for_login(cpf, role=None):
    query = Usuario.query.filter_by(cpf=cpf)
    if role:
        query = query.filter_by(role=role)

    user = query.first()
    if user:
        return user

    if cpf == SPECIAL_TEST_CPF:
        return Usuario.query.filter_by(cpf=cpf).first()

    return None


def normalize_whatsapp(raw_value):
    digits = re.sub(r'\D', '', raw_value or '')
    if not digits:
        return ''

    if digits.startswith('55'):
        return f'+{digits}'
    return f'+55{digits}'


def normalize_phone(raw_value):
    return re.sub(r'\D', '', raw_value or '')


def is_valid_email(email):
    return bool(re.fullmatch(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$', email or ''))


def is_valid_cpf(value):
    cpf = normalize_cpf(value)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    total = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (total * 10) % 11
    if digit1 == 10:
        digit1 = 0
    if digit1 != int(cpf[9]):
        return False

    total = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (total * 10) % 11
    if digit2 == 10:
        digit2 = 0
    return digit2 == int(cpf[10])


def is_valid_name(name):
    return bool(re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+", name or ''))


def is_valid_schedule(value):
    return bool(re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d', value or ''))


def parse_currency_to_float(raw_value):
    raw = str(raw_value or '').strip()
    raw = raw.replace('R$', '').replace(' ', '')
    if not raw:
        raise ValueError('empty salary')

    if ',' in raw and '.' in raw:
        if raw.rfind(',') > raw.rfind('.'):
            raw = raw.replace('.', '').replace(',', '.')
        else:
            raw = raw.replace(',', '')
    elif ',' in raw:
        raw = raw.replace('.', '').replace(',', '.')

    return float(raw)


def parse_bool(raw_value, default=True):
    if raw_value is None:
        return default
    if isinstance(raw_value, bool):
        return raw_value

    normalized = str(raw_value).strip().lower()
    if normalized in {'true', '1', 'sim', 'yes', 'ativo'}:
        return True
    if normalized in {'false', '0', 'nao', 'não', 'no', 'inativo'}:
        return False
    return default


def format_cpf(cpf_digits):
    cpf = normalize_cpf(cpf_digits)
    if len(cpf) != 11:
        return cpf
    return f'{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}'


def format_phone(phone_digits):
    phone = normalize_phone(phone_digits)
    if len(phone) == 11:
        return f'({phone[:2]}) {phone[2:7]}-{phone[7:]}'
    if len(phone) == 10:
        return f'({phone[:2]}) {phone[2:6]}-{phone[6:]}'
    return phone


def format_currency_brl(value):
    return f'R$ {value:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


def get_easter_sunday(year):
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime(year, month, day).date()


def get_brazil_national_holidays(year):
    easter = get_easter_sunday(year)
    fixed_holidays = {
        datetime(year, 1, 1).date(),
        datetime(year, 4, 21).date(),
        datetime(year, 5, 1).date(),
        datetime(year, 9, 7).date(),
        datetime(year, 10, 12).date(),
        datetime(year, 11, 2).date(),
        datetime(year, 11, 15).date(),
        datetime(year, 11, 20).date(),
        datetime(year, 12, 25).date(),
    }
    movable_holidays = {
        easter - timedelta(days=48),  # Carnaval segunda
        easter - timedelta(days=47),  # Carnaval terca
        easter - timedelta(days=2),   # Sexta-feira santa
        easter + timedelta(days=60),  # Corpus Christi
    }
    return fixed_holidays | movable_holidays


def is_business_day(value):
    return value.weekday() < 5 and value not in get_brazil_national_holidays(value.year)


def get_fifth_business_day(year, month):
    current = datetime(year, month, 1).date()
    business_days = 0
    while True:
        if is_business_day(current):
            business_days += 1
            if business_days == 5:
                return current
        current += timedelta(days=1)


def parse_date(value):
    raw = str(value or '').strip()
    if not raw:
        raise ValueError('empty date')

    for fmt in ('%Y-%m-%d', '%d/%m/%Y'):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError('invalid date')


def format_date_br(value):
    if not value:
        return '-'
    if isinstance(value, datetime):
        date_value = value.date()
    else:
        date_value = value
    return date_value.strftime('%d/%m/%Y')


def mask_email(email):
    if not email or '@' not in email:
        return '***'

    name, domain = email.split('@', 1)
    masked_name = f'{name[:2]}***' if len(name) >= 2 else '***'
    return f'{masked_name}@{domain}'


def mask_phone(phone):
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) < 4:
        return '***'
    return f'***{digits[-4:]}'


def generate_reset_code():
    return f'{secrets.randbelow(1_000_000):06d}'


def generate_temporary_student_password():
    return f'{secrets.randbelow(1_000_000):06d}'


def normalize_receipt_status(raw_value):
    status = re.sub(r'[^a-z-]', '', str(raw_value or '').strip().lower())
    aliases = {
        'paid': 'pago',
        'approved': 'pago',
        'confirmed': 'pago',
        'authorized': 'pago',
        'pending': 'pendente',
        'waitingpayment': 'pendente',
        'waiting': 'pendente',
        'open': 'pendente',
        'overdue': 'atrasado',
        'late': 'atrasado',
        'expired': 'atrasado',
    }
    return aliases.get(status, status or 'pendente')


def normalize_plan_lookup_key(plan_name):
    normalized = re.sub(r'\s+', ' ', str(plan_name or '').strip().lower())
    normalized = re.sub(r'^plano\s+', '', normalized)
    return re.sub(r'[^a-z0-9]+', '', normalized)


def count_active_students_for_plan(plan_name):
    target_key = normalize_plan_lookup_key(plan_name)
    if not target_key:
        return 0

    active_students = AlunoCadastro.query.filter_by(status='ativo').all()
    return sum(1 for aluno in active_students if normalize_plan_lookup_key(aluno.plano) == target_key)


def reallocate_active_students_between_plans(source_plan, target_plan):
    source_key = normalize_plan_lookup_key(source_plan.nome)
    target_label = re.sub(r'^Plano\s+', '', target_plan.nome, flags=re.IGNORECASE).strip()
    active_students = AlunoCadastro.query.filter_by(status='ativo').all()

    updated_students = []
    for aluno in active_students:
        if normalize_plan_lookup_key(aluno.plano) != source_key:
            continue
        aluno.plano = target_label
        updated_students.append(aluno)

    if updated_students:
        db.session.commit()

    return updated_students


def get_plan_price(plan_name):
    normalized = normalize_plan_lookup_key(plan_name)
    planos = PlanoAcademia.query.all()
    for plano in planos:
        if normalize_plan_lookup_key(plano.nome) == normalized:
            return plano.preco

    prices = {
        'basico': 80.0,
        'premium': 120.0,
        'vip': 200.0,
        'trimestral': 300.0,
    }
    return prices.get(normalized, 120.0)


def split_multivalue_field(raw_value):
    if isinstance(raw_value, list):
        values = raw_value
    else:
        values = str(raw_value or '').split('\n')

    normalized = []
    seen = set()
    for item in values:
        value = re.sub(r'\s+', ' ', str(item or '').strip())
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(value)
    return normalized


def serialize_plano_academia(plano):
    modalidades = split_multivalue_field(plano.modalidades)
    beneficios = split_multivalue_field(plano.beneficios)
    active_students_count = count_active_students_for_plan(plano.nome)
    return {
        'id': str(plano.id),
        'name': plano.nome,
        'nome': plano.nome,
        'price': format_currency_brl(plano.preco),
        'preco': plano.preco,
        'duration': plano.duracao,
        'duracao': plano.duracao,
        'modalities': modalidades,
        'modalidades': modalidades,
        'benefits': beneficios,
        'beneficios': beneficios,
        'features': modalidades + beneficios,
        'active': plano.ativo,
        'ativo': plano.ativo,
        'activeStudentsCount': active_students_count,
        'alunosAtivos': active_students_count,
    }


def persist_plano_academia(payload, existing_plan=None):
    nome = re.sub(r'\s+', ' ', str(payload.get('name') or payload.get('nome') or '').strip())
    duracao = re.sub(r'\s+', ' ', str(payload.get('duration') or payload.get('duracao') or '').strip())
    modalidades = split_multivalue_field(payload.get('modalities') or payload.get('modalidades') or [])
    beneficios = split_multivalue_field(payload.get('benefits') or payload.get('beneficios') or [])

    try:
        preco = parse_currency_to_float(payload.get('price') or payload.get('preco'))
    except (ValueError, TypeError):
        return {'error': 'Preco invalido.'}, 400

    if len(nome) < 3 or len(nome) > 100:
        return {'error': 'Nome do plano invalido.'}, 400
    if len(duracao) < 3 or len(duracao) > 30:
        return {'error': 'Duracao do plano invalida.'}, 400
    if preco <= 0:
        return {'error': 'Preco deve ser maior que zero.'}, 400
    if not modalidades:
        return {'error': 'Selecione ao menos uma modalidade.'}, 400
    if not beneficios:
        return {'error': 'Adicione ao menos um beneficio.'}, 400

    existing_same_name = PlanoAcademia.query.filter_by(nome=nome).first()
    if existing_same_name and (existing_plan is None or existing_same_name.id != existing_plan.id):
        return {'error': 'Ja existe um plano com esse nome.'}, 400

    plan = existing_plan or PlanoAcademia()
    plan.nome = nome
    plan.preco = preco
    plan.duracao = duracao
    plan.modalidades = '\n'.join(modalidades)
    plan.beneficios = '\n'.join(beneficios)
    plan.ativo = parse_bool(payload.get('active', payload.get('ativo')), default=True if existing_plan is None else plan.ativo)

    db.session.add(plan)
    db.session.commit()
    return serialize_plano_academia(plan), 200 if existing_plan else 201


def ensure_default_academy_plans():
    if PlanoAcademia.query.count() > 0:
        return

    default_plans = [
        {
            'name': 'Plano Basico',
            'price': 'R$ 80,00',
            'duration': 'Mensal',
            'modalities': ['Musculacao'],
            'benefits': ['Acesso livre a musculacao', 'Vestiario'],
        },
        {
            'name': 'Plano Premium',
            'price': 'R$ 120,00',
            'duration': 'Mensal',
            'modalities': ['Musculacao', 'Funcional'],
            'benefits': ['Aulas coletivas inclusas', 'Armario', 'Avaliacao fisica'],
        },
        {
            'name': 'Plano VIP',
            'price': 'R$ 200,00',
            'duration': 'Mensal',
            'modalities': ['Musculacao', 'Funcional', 'Crossfit', 'Personal', 'Pilates'],
            'benefits': ['Aulas coletivas inclusas', 'Personal 2x/semana', 'Vestiario VIP', 'Armario', 'Suporte nutricional'],
        },
        {
            'name': 'Plano Trimestral',
            'price': 'R$ 300,00',
            'duration': 'Trimestral',
            'modalities': ['Musculacao', 'Funcional'],
            'benefits': ['Aulas coletivas inclusas', 'Armario', 'Sem taxa de matricula'],
        },
    ]

    for payload in default_plans:
        persist_plano_academia(payload)



def serialize_aluno_cadastro(aluno):
    return {
        'id': aluno.id,
        'name': aluno.nome,
        'nome': aluno.nome,
        'cpf': format_cpf(aluno.cpf),
        'phone': format_phone(aluno.telefone),
        'telefone': format_phone(aluno.telefone),
        'email': aluno.email,
        'age': aluno.idade,
        'idade': aluno.idade,
        'weight': f'{aluno.peso:.1f}kg',
        'peso': aluno.peso,
        'plan': aluno.plano,
        'plano': aluno.plano,
        'status': aluno.status,
        'payment': aluno.pagamento,
        'vencimento': aluno.vencimento,
        'lastPayment': aluno.ultimo_pagamento,
    }


def persist_aluno_cadastro(payload):
    required_fields = ['nome', 'cpf', 'telefone', 'email', 'idade', 'peso', 'plano']
    missing_fields = [field for field in required_fields if str(payload.get(field, '')).strip() == '']
    if missing_fields:
        return {'error': 'Todos os campos de aluno sao obrigatorios.', 'missing_fields': missing_fields}, 400

    nome = re.sub(r'\s+', ' ', str(payload.get('nome', '')).strip())
    cpf = normalize_cpf(payload.get('cpf'))
    telefone = normalize_phone(payload.get('telefone'))
    email = str(payload.get('email', '')).strip().lower()
    plano = re.sub(r'\s+', ' ', str(payload.get('plano', '')).strip())

    try:
        idade = int(float(str(payload.get('idade', '')).strip()))
    except ValueError:
        return {'error': 'Idade invalida.'}, 400

    try:
        peso = float(str(payload.get('peso', '')).strip().replace(',', '.'))
    except ValueError:
        return {'error': 'Peso invalido.'}, 400

    if len(nome) < 3 or len(nome) > 100 or not is_valid_name(nome):
        return {'error': 'Nome invalido.'}, 400
    if not is_valid_cpf(cpf):
        return {'error': 'CPF invalido.'}, 400
    if len(telefone) not in (10, 11):
        return {'error': 'Telefone invalido. Use DDD + numero (10 ou 11 digitos).'}, 400
    if len(email) > 120 or not is_valid_email(email):
        return {'error': 'Email invalido.'}, 400
    if idade < 12 or idade > 120:
        return {'error': 'Idade deve estar entre 12 e 120.'}, 400
    if peso < 20 or peso > 400:
        return {'error': 'Peso deve estar entre 20 e 400 kg.'}, 400
    if len(plano) < 2 or len(plano) > 50:
        return {'error': 'Plano invalido.'}, 400
    if AlunoCadastro.query.filter_by(cpf=cpf).first():
        return {'error': 'Ja existe aluno cadastrado com este CPF.'}, 409

    new_aluno = AlunoCadastro(
        nome=nome,
        cpf=cpf,
        telefone=telefone,
        email=email,
        idade=idade,
        peso=peso,
        plano=plano,
    )
    db.session.add(new_aluno)

    generated_password = None
    if not Usuario.query.filter_by(cpf=cpf).first():
        generated_password = generate_temporary_student_password()
        db.session.add(
            Usuario(
                nome=nome,
                cpf=cpf,
                email=email,
                whatsapp=normalize_whatsapp(telefone),
                role='student',
                senha_hash=generate_password_hash(generated_password),
            )
        )

    db.session.commit()
    response_body = serialize_aluno_cadastro(new_aluno)
    if generated_password:
        response_body['temporary_password'] = generated_password
        response_body['password_message'] = 'Senha inicial gerada automaticamente com 6 numeros.'
    return response_body, 201


def serialize_professor_cadastro(professor):
    return {
        'id': professor.id,
        'name': professor.nome,
        'cpf': format_cpf(professor.cpf),
        'speciality': professor.especialidade,
        'students': professor.alunos_ativos,
        'status': professor.status,
        'phone': format_phone(professor.telefone),
        'email': professor.email,
        'horario': professor.horario,
        'salario': format_currency_brl(professor.salario),
        'modalidades': [professor.especialidade],
    }


def persist_professor_cadastro(payload, existing_professor=None):
    required_fields = ['nome', 'cpf', 'telefone', 'email', 'horario', 'salario', 'especialidade']
    missing_fields = [field for field in required_fields if str(payload.get(field, '')).strip() == '']
    if missing_fields:
        return {'error': 'Todos os campos de professor sao obrigatorios.', 'missing_fields': missing_fields}, 400

    nome = re.sub(r'\s+', ' ', str(payload.get('nome', '')).strip())
    cpf = normalize_cpf(payload.get('cpf'))
    telefone = normalize_phone(payload.get('telefone'))
    email = str(payload.get('email', '')).strip().lower()
    horario = re.sub(r'\s+', ' ', str(payload.get('horario', '')).strip())
    especialidade = re.sub(r'\s+', ' ', str(payload.get('especialidade', '')).strip())
    status = re.sub(r'\s+', '-', str(payload.get('status', existing_professor.status if existing_professor else 'ativo')).strip().lower())

    try:
        salario = parse_currency_to_float(payload.get('salario'))
    except ValueError:
        return {'error': 'Salario invalido.'}, 400

    if len(nome) < 3 or len(nome) > 100 or not is_valid_name(nome):
        return {'error': 'Nome invalido.'}, 400
    if not is_valid_cpf(cpf):
        return {'error': 'CPF invalido.'}, 400
    if len(telefone) not in (10, 11):
        return {'error': 'Telefone invalido. Use DDD + numero (10 ou 11 digitos).'}, 400
    if len(email) > 120 or not is_valid_email(email):
        return {'error': 'Email invalido.'}, 400
    if not is_valid_schedule(horario):
        return {'error': 'Horario invalido. Use o formato HH:MM - HH:MM.'}, 400
    if salario <= 0:
        return {'error': 'Salario deve ser maior que zero.'}, 400
    if len(especialidade) < 3 or len(especialidade) > 60:
        return {'error': 'Especialidade invalida.'}, 400
    if status not in ('ativo', 'ferias', 'inativo'):
        return {'error': 'Status invalido.'}, 400

    duplicated_professor = ProfessorCadastro.query.filter_by(cpf=cpf).first()
    if duplicated_professor and (existing_professor is None or duplicated_professor.id != existing_professor.id):
        return {'error': 'Ja existe professor cadastrado com este CPF.'}, 409

    professor = existing_professor or ProfessorCadastro()
    professor.nome = nome
    professor.cpf = cpf
    professor.telefone = telefone
    professor.email = email
    professor.horario = horario
    professor.salario = salario
    professor.especialidade = especialidade
    professor.status = status

    if existing_professor is None:
        db.session.add(professor)

    user = Usuario.query.filter_by(cpf=cpf).first()
    if user:
        user.nome = nome
        user.email = email
        user.whatsapp = normalize_whatsapp(telefone)
        user.role = 'professor'
    else:
        db.session.add(
            Usuario(
                nome=nome,
                cpf=cpf,
                email=email,
                whatsapp=normalize_whatsapp(telefone),
                role='professor',
                senha_hash=generate_password_hash('123456'),
            )
        )

    db.session.commit()
    return serialize_professor_cadastro(professor), 200 if existing_professor else 201


def serialize_recebimento_aluno(recebimento):
    return {
        'id': recebimento.id,
        'studentName': recebimento.aluno_nome,
        'studentCpf': format_cpf(recebimento.aluno_cpf),
        'reference': recebimento.referencia,
        'description': recebimento.descricao,
        'provider': recebimento.provider,
        'externalId': recebimento.external_id,
        'status': recebimento.status,
        'amount': recebimento.valor,
        'amountLabel': format_currency_brl(recebimento.valor),
        'dueDate': format_date_br(recebimento.vencimento),
        'paidAt': recebimento.pago_em.isoformat() if recebimento.pago_em else None,
        'paidAtLabel': format_date_br(recebimento.pago_em) if recebimento.pago_em else '-',
        'createdAt': recebimento.criado_em.isoformat(),
    }


def update_aluno_payment_snapshot(aluno, status, due_date, paid_at=None):
    if not aluno:
        return

    if status == 'pago':
        aluno.pagamento = 'em-dia'
        aluno.ultimo_pagamento = format_date_br(paid_at or datetime.now())
        aluno.vencimento = format_date_br(due_date)
    elif status == 'atrasado':
        aluno.pagamento = 'atrasado'
        aluno.vencimento = format_date_br(due_date)


def upsert_recebimento_aluno(payload):
    cpf = normalize_cpf(payload.get('cpf') or payload.get('aluno_cpf'))
    if len(cpf) != 11:
        return {'error': 'CPF do aluno invalido.'}, 400

    aluno = AlunoCadastro.query.filter_by(cpf=cpf).first()
    if not aluno:
        return {'error': 'Aluno nao encontrado para este CPF.'}, 404

    status = normalize_receipt_status(payload.get('status'))
    if status not in ('pago', 'pendente', 'atrasado'):
        return {'error': 'Status de recebimento invalido.'}, 400

    try:
        valor = parse_currency_to_float(payload.get('valor', payload.get('amount', '')))
    except ValueError:
        return {'error': 'Valor do recebimento invalido.'}, 400

    try:
        vencimento = parse_date(payload.get('vencimento', payload.get('due_date')))
    except ValueError:
        return {'error': 'Data de vencimento invalida.'}, 400

    pago_em = None
    paid_at_raw = payload.get('pago_em', payload.get('paid_at'))
    if paid_at_raw:
        try:
            pago_em = datetime.fromisoformat(str(paid_at_raw).replace('Z', '+00:00'))
        except ValueError:
            try:
                pago_em = datetime.combine(parse_date(paid_at_raw), datetime.min.time())
            except ValueError:
                return {'error': 'Data de pagamento invalida.'}, 400
    elif status == 'pago':
        pago_em = datetime.now()

    external_id = str(payload.get('external_id', '')).strip() or None
    referencia = re.sub(r'\s+', ' ', str(payload.get('referencia', payload.get('reference', 'Mensalidade'))).strip())
    descricao = re.sub(r'\s+', ' ', str(payload.get('descricao', payload.get('description', f'Mensalidade - {aluno.nome}'))).strip())
    provider = re.sub(r'\s+', '-', str(payload.get('provider', 'webhook')).strip().lower()) or 'webhook'

    recebimento = None
    if external_id:
        recebimento = RecebimentoAluno.query.filter_by(external_id=external_id).first()

    if not recebimento:
        recebimento = RecebimentoAluno(
            aluno_id=aluno.id,
            aluno_nome=aluno.nome,
            aluno_cpf=cpf,
            external_id=external_id,
            referencia=referencia,
            descricao=descricao,
            provider=provider,
            status=status,
            valor=valor,
            vencimento=vencimento,
            pago_em=pago_em,
        )
        db.session.add(recebimento)
    else:
        recebimento.aluno_id = aluno.id
        recebimento.aluno_nome = aluno.nome
        recebimento.aluno_cpf = cpf
        recebimento.referencia = referencia
        recebimento.descricao = descricao
        recebimento.provider = provider
        recebimento.status = status
        recebimento.valor = valor
        recebimento.vencimento = vencimento
        recebimento.pago_em = pago_em

    update_aluno_payment_snapshot(aluno, status, vencimento, pago_em)
    db.session.commit()
    return serialize_recebimento_aluno(recebimento), 200


def ensure_default_receipts():
    if RecebimentoAluno.query.count() > 0:
        return

    alunos = AlunoCadastro.query.order_by(AlunoCadastro.id.asc()).limit(6).all()
    if not alunos:
        return

    today = datetime.now().date()
    seeded_receipts = []
    status_cycle = ['pago', 'pendente', 'atrasado', 'pago', 'pendente', 'pago']

    for index, aluno in enumerate(alunos):
        due_date = today.replace(day=min(28, 5 + index * 2))
        status = status_cycle[index % len(status_cycle)]
        paid_at = datetime.now() - timedelta(days=index) if status == 'pago' else None
        seeded_receipts.append(
            RecebimentoAluno(
                aluno_id=aluno.id,
                aluno_nome=aluno.nome,
                aluno_cpf=aluno.cpf,
                referencia=due_date.strftime('%m/%Y'),
                descricao=f'Mensalidade - {aluno.nome}',
                provider='seed',
                external_id=f'seed-{aluno.cpf}-{due_date.strftime("%Y%m")}',
                status=status,
                valor=get_plan_price(aluno.plano),
                vencimento=due_date,
                pago_em=paid_at,
            )
        )
        update_aluno_payment_snapshot(aluno, status, due_date, paid_at)

    db.session.add_all(seeded_receipts)
    db.session.commit()


def serialize_folha_pagamento(folha):
    return {
        'id': folha.id,
        'professorId': folha.professor_id,
        'professorName': folha.professor_nome,
        'professorCpf': format_cpf(folha.professor_cpf),
        'reference': folha.referencia,
        'baseAmount': folha.valor_base,
        'baseAmountLabel': format_currency_brl(folha.valor_base),
        'adjustedAmount': folha.valor_ajustado,
        'adjustedAmountLabel': format_currency_brl(folha.valor_ajustado),
        'dueDate': format_date_br(folha.vencimento),
        'dueDateIso': folha.vencimento.isoformat(),
        'status': folha.status,
        'notes': folha.observacao or '',
        'createdAt': folha.criado_em.isoformat(),
        'updatedAt': folha.atualizado_em.isoformat(),
    }


def serialize_turma_agenda(turma):
    alunos = sorted(turma.alunos, key=lambda item: item.aluno_nome.lower())
    return {
        'id': turma.id,
        'time': turma.horario,
        'event': turma.evento,
        'professor': turma.professor,
        'professorStatus': turma.professor_status,
        'room': turma.sala,
        'capacity': turma.capacidade,
        'students': [
            {
                'name': aluno.aluno_nome,
                'cpf': format_cpf(aluno.aluno.cpf) if aluno.aluno else None,
                'payment': aluno.pagamento,
                'present': aluno.presente,
            }
            for aluno in alunos
        ],
    }


def create_dashboard_alert(alert_id, alert_type, group, icon, title, message, detail, primary_action, secondary_action=None):
    return {
        'id': alert_id,
        'type': alert_type,
        'group': group,
        'icon': icon,
        'title': title,
        'message': message,
        'detail': detail,
        'primaryAction': primary_action,
        'secondaryAction': secondary_action,
    }


def build_dashboard_alerts():
    ensure_default_agenda_classes()
    ensure_default_receipts()
    ensure_default_academy_plans()
    ensure_monthly_payroll()

    alerts = []
    now = datetime.now()
    today = now.date()

    overdue_students = AlunoCadastro.query.filter_by(status='ativo', pagamento='atrasado').order_by(AlunoCadastro.nome.asc()).all()
    if overdue_students:
        target_student = overdue_students[0]
        alerts.append(
            create_dashboard_alert(
                'late-payments',
                'danger',
                'prioridade',
                'alert-circle',
                'Mensalidades atrasadas',
                f'{len(overdue_students)} aluno(s) com mensalidade atrasada.',
                f'Contato prioritario: {target_student.nome}.',
                {
                    'id': 'charge_whatsapp',
                    'label': 'Cobrar agora',
                    'studentCpf': format_cpf(target_student.cpf),
                    'studentPhone': format_phone(target_student.telefone),
                },
                {'id': 'open_overdue_students', 'label': 'Ver atrasados'},
            )
        )

    students_due_soon = []
    for aluno in AlunoCadastro.query.filter_by(status='ativo').all():
        try:
            due_date = parse_date(aluno.vencimento)
        except ValueError:
            continue
        hours_left = int((datetime.combine(due_date, datetime.min.time()) - now).total_seconds() // 3600)
        if 0 <= hours_left <= 48:
            students_due_soon.append((aluno, hours_left))

    if students_due_soon:
        smallest_hours = min(hours_left for _, hours_left in students_due_soon)
        alerts.append(
            create_dashboard_alert(
                'plans-expiring',
                'warning',
                'prioridade',
                'clock',
                'Planos prestes a vencer',
                f'{len(students_due_soon)} plano(s) vencem em {max(smallest_hours, 1)}h.',
                'Priorize contato com os alunos de renovacao imediata.',
                {'id': 'open_students', 'label': 'Abrir alunos'},
                {'id': 'open_finance', 'label': 'Abrir financeiro'},
            )
        )

    active_alunos = AlunoCadastro.query.filter_by(status='ativo').all()
    if active_alunos:
        aluno_ids = [a.id for a in active_alunos]
        enrolled_rows = TurmaAluno.query.with_entities(TurmaAluno.aluno_id).filter(TurmaAluno.aluno_id.in_(aluno_ids)).all()
        enrolled_ids = set(r[0] for r in enrolled_rows)
        students_without_class = [aluno for aluno in active_alunos if aluno.id not in enrolled_ids]
    else:
        students_without_class = []
    if students_without_class:
        alerts.append(
            create_dashboard_alert(
                'churn-risk',
                'danger',
                'prioridade',
                'user-x',
                'Gestao de evasao',
                f'{len(students_without_class)} aluno(s) ativos sem turma vinculada ha mais tempo.',
                f'Comece por {students_without_class[0].nome}.',
                {'id': 'open_students', 'label': 'Ver alunos'},
                {'id': 'focus_student', 'label': 'Acao rapida', 'studentCpf': format_cpf(students_without_class[0].cpf)},
            )
        )

    current_reference = now.strftime('%Y-%m')
    pending_payroll_entries = FolhaPagamentoProfessor.query.filter(
        FolhaPagamentoProfessor.referencia == current_reference,
        FolhaPagamentoProfessor.status != 'pago',
    ).all()
    if pending_payroll_entries:
        alerts.append(
            create_dashboard_alert(
                'hours-report',
                'warning',
                'prioridade',
                'clipboard-check',
                'Gestao de professores',
                f'{len(pending_payroll_entries)} lancamento(s) da folha de {current_reference} aguardam aprovacao.',
                'Financeiro depende disso para fechar o pagamento no 5o dia util.',
                {'id': 'open_finance', 'label': 'Abrir financeiro'},
                {'id': 'open_professors', 'label': 'Ver professores'},
            )
        )

    pending_attendance = (
        TurmaAgenda.query
        .filter(
            TurmaAgenda.professor_status != 'presente',
            TurmaAgenda.horario <= now.strftime('%H:%M'),
        )
        .order_by(TurmaAgenda.horario.asc())
        .all()
    )
    if pending_attendance:
        turma = pending_attendance[0]
        alerts.append(
            create_dashboard_alert(
                'attendance-missing',
                'warning',
                'informativos',
                'clipboard-check',
                'Presenca pendente',
                f'{turma.professor} nao registrou a presenca da turma das {turma.horario}.',
                'Cobrar registro antes do fechamento operacional do dia.',
                {'id': 'open_agenda', 'label': 'Abrir agenda', 'classId': turma.id},
                {'id': 'open_professors', 'label': 'Ver professor'},
            )
        )

    recent_students = AlunoCadastro.query.filter(AlunoCadastro.criado_em >= now - timedelta(days=3)).order_by(AlunoCadastro.criado_em.desc()).all()
    if recent_students:
        alerts.append(
            create_dashboard_alert(
                'new-students',
                'info',
                'informativos',
                'user-plus',
                'Novos cadastros',
                f'{len(recent_students)} aluno(s) cadastrados nos ultimos 3 dias.',
                'Concluir encaixe em turmas acelera a ativacao.',
                {'id': 'open_students', 'label': 'Gerenciar alunos'},
                {'id': 'focus_student', 'label': 'Acao rapida', 'studentCpf': format_cpf(recent_students[0].cpf)},
            )
        )

    return alerts


def normalize_professor_status(value):
    normalized = re.sub(r'[^a-z-]', '', str(value or '').strip().lower())
    if normalized in ('presente', 'confirmado'):
        return normalized
    return 'confirmado'


def generate_agenda_class_id():
    last_class = TurmaAgenda.query.order_by(TurmaAgenda.criado_em.desc(), TurmaAgenda.id.desc()).first()
    if not last_class:
        return 'a1'

    match = re.fullmatch(r'a(\d+)', last_class.id or '')
    next_index = int(match.group(1)) + 1 if match else int(datetime.now().timestamp())
    return f'a{next_index}'


def persist_turma_agenda(payload, existing_class=None):
    event = re.sub(r'\s+', ' ', str(payload.get('event') or payload.get('evento') or '').strip())
    time = str(payload.get('time') or payload.get('horario') or '').strip()
    room = re.sub(r'\s+', ' ', str(payload.get('room') or payload.get('sala') or '').strip())
    professor = re.sub(r'\s+', ' ', str(payload.get('professor') or '').strip())
    professor_status = normalize_professor_status(payload.get('professorStatus') or payload.get('professor_status'))

    try:
        capacity = int(str(payload.get('capacity') or payload.get('capacidade') or '').strip())
    except ValueError:
        return {'error': 'Capacidade invalida.'}, 400

    if len(event) < 3 or len(event) > 100:
        return {'error': 'Nome da turma invalido.'}, 400
    if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', time):
        return {'error': 'Horario invalido. Use o formato HH:MM.'}, 400
    if len(room) < 2 or len(room) > 50:
        return {'error': 'Sala invalida.'}, 400
    if len(professor) < 3 or len(professor) > 100:
        return {'error': 'Professor invalido.'}, 400
    if capacity <= 0 or capacity > 100:
        return {'error': 'Capacidade deve estar entre 1 e 100.'}, 400

    turma = existing_class or TurmaAgenda(id=generate_agenda_class_id())
    turma.evento = event
    turma.horario = time
    turma.sala = room
    turma.professor = professor
    turma.professor_status = professor_status
    turma.capacidade = capacity
    db.session.add(turma)
    db.session.commit()
    return serialize_turma_agenda(turma), 200 if existing_class else 201


def seed_turma_aluno(turma, student_name, payment, present):
    aluno = AlunoCadastro.query.filter_by(nome=student_name).first()
    turma_aluno = TurmaAluno(
        turma_id=turma.id,
        aluno_id=aluno.id if aluno else None,
        aluno_nome=aluno.nome if aluno else student_name,
        pagamento=aluno.pagamento if aluno else payment,
        presente=present,
    )
    db.session.add(turma_aluno)


def ensure_default_agenda_classes():
    if TurmaAgenda.query.count() > 0:
        return

    seed_classes = [
        {
            'id': 'a1',
            'horario': '06:00',
            'evento': 'Muay Thai Avancado',
            'professor': 'Prof. Ana Lima',
            'professor_status': 'presente',
            'sala': 'Sala 1',
            'capacidade': 20,
            'students': [
                ('Maria Silva', 'em-dia', True), ('Carlos Santos', 'em-dia', True), ('Pedro Costa', 'atrasado', False),
                ('Juliana Melo', 'em-dia', True), ('Bruno Alves', 'atrasado', False), ('Camila Rocha', 'em-dia', True),
                ('Ana Beatriz', 'em-dia', True), ('Rafael Nunes', 'atrasado', False), ('Lucas Ferreira', 'em-dia', False),
                ('Fernanda Souza', 'em-dia', True), ('Diego Reis', 'em-dia', True), ('Carla Mota', 'em-dia', True),
                ('Thiago Pires', 'em-dia', False), ('Joao Marcos', 'em-dia', True), ('Paula Costa', 'em-dia', False),
            ],
        },
        {
            'id': 'a2', 'horario': '07:00', 'evento': 'Funcional', 'professor': 'Prof. Ricardo Souza',
            'professor_status': 'confirmado', 'sala': 'Area Externa', 'capacidade': 18,
            'students': [
                ('Carla Mota', 'em-dia', True), ('Fernanda Souza', 'em-dia', False), ('Diego Reis', 'em-dia', True),
                ('Rafael Nunes', 'atrasado', False), ('Juliana Melo', 'em-dia', True), ('Bruno Alves', 'atrasado', False),
            ],
        },
        {
            'id': 'a3', 'horario': '08:00', 'evento': 'Musculacao - Turma B', 'professor': 'Prof. Ana Lima',
            'professor_status': 'presente', 'sala': 'Sala 1', 'capacidade': 16,
            'students': [
                ('Maria Silva', 'em-dia', True), ('Pedro Costa', 'atrasado', False), ('Ana Beatriz', 'em-dia', True),
                ('Camila Rocha', 'em-dia', True), ('Lucas Ferreira', 'em-dia', False),
            ],
        },
        {
            'id': 'a4', 'horario': '09:00', 'evento': 'Pilates', 'professor': 'Prof. Julia Santos',
            'professor_status': 'confirmado', 'sala': 'Sala 2', 'capacidade': 12,
            'students': [('Juliana Melo', 'em-dia', True), ('Camila Rocha', 'em-dia', True), ('Paula Costa', 'em-dia', False)],
        },
        {
            'id': 'a5', 'horario': '10:00', 'evento': 'Crossfit', 'professor': 'Prof. Fernanda Costa',
            'professor_status': 'presente', 'sala': 'Box', 'capacidade': 22,
            'students': [
                ('Carlos Santos', 'em-dia', True), ('Bruno Alves', 'atrasado', False), ('Diego Reis', 'em-dia', True),
                ('Carla Mota', 'em-dia', True), ('Rafael Nunes', 'atrasado', False), ('Fernanda Souza', 'em-dia', True),
                ('Pedro Costa', 'atrasado', False),
            ],
        },
        {
            'id': 'a6', 'horario': '14:00', 'evento': 'Personal Training', 'professor': 'Prof. Marcos Oliveira',
            'professor_status': 'confirmado', 'sala': 'Sala 3', 'capacidade': 4,
            'students': [('Maria Silva', 'em-dia', True)],
        },
        {
            'id': 'a7', 'horario': '16:00', 'evento': 'Natacao', 'professor': 'Prof. Thiago Reis',
            'professor_status': 'confirmado', 'sala': 'Piscina', 'capacidade': 14,
            'students': [
                ('Ana Beatriz', 'em-dia', True), ('Juliana Melo', 'em-dia', True), ('Lucas Ferreira', 'em-dia', False),
                ('Camila Rocha', 'em-dia', True),
            ],
        },
        {
            'id': 'a8', 'horario': '18:00', 'evento': 'Musculacao - Turma C', 'professor': 'Prof. Ana Lima',
            'professor_status': 'confirmado', 'sala': 'Sala 1', 'capacidade': 20,
            'students': [
                ('Pedro Costa', 'atrasado', False), ('Carlos Santos', 'em-dia', True), ('Diego Reis', 'em-dia', True),
                ('Bruno Alves', 'atrasado', False), ('Fernanda Souza', 'em-dia', True), ('Joao Marcos', 'em-dia', False),
            ],
        },
        {
            'id': 'a9', 'horario': '19:00', 'evento': 'Crossfit Noturno', 'professor': 'Prof. Fernanda Costa',
            'professor_status': 'confirmado', 'sala': 'Box', 'capacidade': 24,
            'students': [
                ('Carla Mota', 'em-dia', True), ('Rafael Nunes', 'atrasado', False), ('Maria Silva', 'em-dia', True),
                ('Ana Beatriz', 'em-dia', True), ('Camila Rocha', 'em-dia', False),
            ],
        },
    ]

    for item in seed_classes:
        turma = TurmaAgenda(
            id=item['id'],
            horario=item['horario'],
            evento=item['evento'],
            professor=item['professor'],
            professor_status=item['professor_status'],
            sala=item['sala'],
            capacidade=item['capacidade'],
        )
        db.session.add(turma)
        for student_name, payment, present in item['students']:
            seed_turma_aluno(turma, student_name, payment, present)

    db.session.commit()


def reallocate_student_between_classes(student_cpf, source_class_id, target_class_id):
    aluno = AlunoCadastro.query.filter_by(cpf=student_cpf).first()
    if not aluno:
        return {'error': 'Aluno nao encontrado.'}, 404

    # Eager-load alunos for source/target classes to avoid N+1 when checking/enumerating
    source_class = TurmaAgenda.query.options(selectinload(TurmaAgenda.alunos)).filter_by(id=source_class_id).first()
    target_class = TurmaAgenda.query.options(selectinload(TurmaAgenda.alunos)).filter_by(id=target_class_id).first()
    if not source_class or not target_class:
        return {'error': 'Turma de origem ou destino nao encontrada.'}, 404
    if source_class.id == target_class.id:
        return {'error': 'Escolha uma turma de destino diferente.'}, 400

    source_enrollment = TurmaAluno.query.filter_by(turma_id=source_class.id, aluno_id=aluno.id).first()
    if not source_enrollment:
        source_enrollment = TurmaAluno.query.filter_by(turma_id=source_class.id, aluno_nome=aluno.nome).first()
    if not source_enrollment:
        return {'error': 'Aluno nao esta vinculado a turma de origem.'}, 404

    target_exists = TurmaAluno.query.filter_by(turma_id=target_class.id, aluno_id=aluno.id).first()
    if target_exists:
        return {'error': 'Aluno ja esta vinculado a turma de destino.'}, 409
    if len(target_class.alunos) >= target_class.capacidade:
        return {'error': 'A turma de destino atingiu a capacidade maxima.'}, 409

    source_snapshot = {
        'pagamento': source_enrollment.pagamento,
        'presente': source_enrollment.presente,
    }
    db.session.delete(source_enrollment)
    db.session.flush()

    db.session.add(
        TurmaAluno(
            turma_id=target_class.id,
            aluno_id=aluno.id,
            aluno_nome=aluno.nome,
            pagamento=aluno.pagamento,
            presente=False if source_class.id != target_class.id else source_snapshot['presente'],
        )
    )
    db.session.commit()

    classes = (
        TurmaAgenda.query.options(
            selectinload(TurmaAgenda.alunos).selectinload(TurmaAluno.aluno)
        )
        .order_by(TurmaAgenda.horario.asc())
        .all()
    )
    return {
        'message': 'Aluno realocado com sucesso.',
        'classes': [serialize_turma_agenda(turma) for turma in classes],
    }, 200


def ensure_monthly_payroll(reference_date=None):
    reference = reference_date or datetime.now().date()
    reference_key = f'{reference.year:04d}-{reference.month:02d}'
    due_date = get_fifth_business_day(reference.year, reference.month)
    active_professors = ProfessorCadastro.query.filter_by(status='ativo').all()

    created_any = False
    for professor in active_professors:
        existing = FolhaPagamentoProfessor.query.filter_by(
            professor_id=professor.id,
            referencia=reference_key,
        ).first()
        if existing:
            continue

        payroll = FolhaPagamentoProfessor(
            professor_id=professor.id,
            professor_nome=professor.nome,
            professor_cpf=professor.cpf,
            referencia=reference_key,
            valor_base=professor.salario,
            valor_ajustado=professor.salario,
            vencimento=due_date,
            status='provisionado',
        )
        db.session.add(payroll)
        created_any = True

    if created_any:
        db.session.commit()


def update_payroll_entry(payroll, payload):
    amount_raw = payload.get('adjusted_amount', payload.get('valor'))
    due_date_raw = payload.get('due_date', payload.get('vencimento'))
    status_raw = str(payload.get('status', payroll.status)).strip().lower() or payroll.status
    notes = re.sub(r'\s+', ' ', str(payload.get('notes', payload.get('observacao', payroll.observacao or ''))).strip())

    if amount_raw is not None and str(amount_raw).strip() != '':
        try:
            adjusted_amount = parse_currency_to_float(amount_raw)
        except ValueError:
            return {'error': 'Valor ajustado invalido.'}, 400
        if adjusted_amount <= 0:
            return {'error': 'Valor ajustado deve ser maior que zero.'}, 400
        payroll.valor_ajustado = adjusted_amount

    if due_date_raw:
        try:
            payroll.vencimento = parse_date(due_date_raw)
        except ValueError:
            return {'error': 'Data de vencimento invalida.'}, 400

    if status_raw not in ('provisionado', 'ajustado', 'pago'):
        return {'error': 'Status da folha invalido.'}, 400

    payroll.status = status_raw
    payroll.observacao = notes or None
    payroll.professor_nome = payroll.professor.nome
    payroll.professor_cpf = payroll.professor.cpf
    db.session.commit()
    return serialize_folha_pagamento(payroll), 200


def _fake_notification(channel, destination, code, reason):
    if not DEV_FAKE_NOTIFICATIONS:
        return False, reason

    app.logger.warning(
        '[%s][FAKE] destino=%s codigo=%s motivo=%s',
        channel,
        destination,
        code,
        reason,
    )
    return True, f'{channel} em modo de simulacao'


def send_reset_email(destination_email, code):
    smtp_host = os.getenv('SMTP_HOST')
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_from = os.getenv('SMTP_FROM', smtp_user or 'no-reply@fitpro.local')
    use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'

    if not smtp_host:
        return _fake_notification('EMAIL', destination_email, code, 'SMTP_HOST ausente')

    try:
        message = EmailMessage()
        message['Subject'] = 'FitPro - Codigo de redefinicao de senha'
        message['From'] = smtp_from
        message['To'] = destination_email
        message.set_content(
            f'Seu codigo de redefinicao de senha e: {code}\n'
            f'Validade: {RESET_CODE_EXPIRATION_MINUTES} minutos.\n'
            'Se voce nao solicitou, ignore esta mensagem.'
        )

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
            if use_tls:
                smtp.starttls()
            if smtp_user and smtp_password:
                smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
        return True, 'email enviado'
    except Exception as exc:
        return _fake_notification('EMAIL', destination_email, code, str(exc))


def send_reset_whatsapp(destination_phone, code):
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_phone = os.getenv('TWILIO_WHATSAPP_FROM')
    to_phone = normalize_whatsapp(destination_phone)

    if not to_phone:
        return False, 'telefone de WhatsApp invalido'

    if not account_sid or not auth_token or not from_phone:
        return _fake_notification('WHATSAPP', to_phone, code, 'credenciais Twilio ausentes')

    if not from_phone.startswith('whatsapp:'):
        from_phone = f'whatsapp:{from_phone}'
    if not to_phone.startswith('+'):
        to_phone = f'+{to_phone}'

    body = (
        f'FitPro: seu codigo para redefinir a senha e {code}. '
        f'Validade: {RESET_CODE_EXPIRATION_MINUTES} minutos.'
    )
    payload = urllib.parse.urlencode(
        {
            'From': from_phone,
            'To': f'whatsapp:{to_phone}',
            'Body': body,
        }
    ).encode('utf-8')

    endpoint = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    token = base64.b64encode(f'{account_sid}:{auth_token}'.encode('utf-8')).decode('utf-8')
    request_obj = urllib.request.Request(endpoint, data=payload, method='POST')
    request_obj.add_header('Authorization', f'Basic {token}')
    request_obj.add_header('Content-Type', 'application/x-www-form-urlencoded')

    try:
        with urllib.request.urlopen(request_obj, timeout=20):
            return True, 'whatsapp enviado'
    except Exception as exc:
        return _fake_notification('WHATSAPP', to_phone, code, str(exc))


def cleanup_demo_data():
    # Remove registros de demo para manter o sistema limpo e parecido com uma instalacao nova.
    TurmaAluno.query.delete()
    TurmaAgenda.query.delete()
    RecebimentoAluno.query.delete()
    FolhaPagamentoProfessor.query.delete()
    AlunoCadastro.query.delete()
    ProfessorCadastro.query.delete()
    Usuario.query.filter(Usuario.cpf != SPECIAL_TEST_CPF).delete()
    db.session.commit()


def ensure_default_users():
    # Cria apenas um usuario padrao para desenvolvimento.
    if not Usuario.query.filter_by(cpf=SPECIAL_TEST_CPF).first():
        db.session.add(
            Usuario(
                nome='Desenvolvedor',
                cpf=SPECIAL_TEST_CPF,
                email='dev@fitpro.local',
                whatsapp='+5511999999999',
                role='admin',
                senha_hash=generate_password_hash(SPECIAL_TEST_PASSWORD),
            )
        )
        db.session.commit()


# -------------------------
# CORS JA CONFIGURADO VIA FLASK-CORS
# -------------------------
# Flask-CORS manipula automaticamente headers CORS e requests preflight OPTIONS.
# Nao e necessario manipular manualmente via @app.after_request.


# --- ROTAS DE PAGINAS (FRONT-END) ---
def api_response(data=None, success=True, status=200):
    body = {'success': bool(success), 'data': data}
    return jsonify(body), status


@app.route('/')
def index():
    # Antes: renderizava dashboard.html. Agora devolve JSON padronizado.
    payload = {
        'message': 'Back-end REST API. Use o front-end Next.js para a interface.',
        'endpoints': ['/api/*'],
    }
    return api_response(payload, success=True, status=200)


@app.route('/lista-alunos')
def view_alunos():
    # Endpoint legado que anteriormente servia a página HTML.
    # Agora devolve a lista de alunos em JSON para compatibilidade.
    alunos_db = AlunoCadastro.query.order_by(AlunoCadastro.id.desc()).all()
    if alunos_db:
        data = [serialize_aluno_cadastro(aluno) for aluno in alunos_db]
    else:
        alunos_list = Aluno.query.all()
        data = [{'id': aluno.id, 'nome': aluno.nome} for aluno in alunos_list]
    return api_response(data, success=True, status=200)


# --- ROTAS DE API (BACK-END) ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Retorna os numeros para os cards do dashboard."""
    total_alunos_cadastro = AlunoCadastro.query.count()
    total_professores_cadastro = ProfessorCadastro.query.count()
    total_planos_academia = PlanoAcademia.query.count()
    return jsonify(
        {
            'total_alunos': total_alunos_cadastro if total_alunos_cadastro > 0 else Aluno.query.count(),
            'total_planos': total_planos_academia if total_planos_academia > 0 else Plano.query.count(),
            'total_professores': total_professores_cadastro,
            'vencimentos': 5,  # Exemplo estatico
            'receita_mensal': 1250.00,  # Exemplo estatico
        }
    )


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/dashboard/alerts', methods=['GET'])
def dashboard_alerts():
    return jsonify(build_dashboard_alerts())


@app.route('/api/agenda/classes', methods=['GET'])
def agenda_classes():
    ensure_default_agenda_classes()
    q = (request.args.get('q') or '').strip()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('limit', 20))
    except Exception:
        page = 1
        per_page = 20

    query = TurmaAgenda.query.options(selectinload(TurmaAgenda.alunos).selectinload(TurmaAluno.aluno))
    if q:
        pattern = f"%{q}%"
        query = query.filter((TurmaAgenda.evento.ilike(pattern)) | (TurmaAgenda.professor.ilike(pattern)))

    pagination = query.order_by(TurmaAgenda.horario.asc()).paginate(page=page, per_page=per_page, error_out=False)
    items = [serialize_turma_agenda(turma) for turma in pagination.items]
    meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
    return jsonify({'success': True, 'data': items, 'meta': meta})


@app.route('/api/agenda/classes', methods=['POST'])
@validate_request(TurmaCreate, methods=('POST',))
def agenda_create_class():
    ensure_default_agenda_classes()
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_turma_agenda(payload)
    return jsonify(response_body), status_code


@app.route('/api/agenda/classes/<class_id>', methods=['PUT', 'DELETE'])
@validate_request(TurmaUpdate, methods=('PUT',), partial=True)
def agenda_manage_class(class_id):
    ensure_default_agenda_classes()
    turma = TurmaAgenda.query.get(class_id)
    if not turma:
        return jsonify({'error': 'Turma nao encontrada.'}), 404

    if request.method == 'DELETE':
        db.session.delete(turma)
        db.session.commit()
        return jsonify({'message': 'Turma cancelada com sucesso.', 'id': class_id})

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_turma_agenda(payload, existing_class=turma)
    return jsonify(response_body), status_code


@app.route('/api/agenda/reallocate-student', methods=['POST'])
def agenda_reallocate_student():
    ensure_default_agenda_classes()
    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    student_cpf = normalize_cpf(payload.get('studentCpf') or payload.get('student_cpf'))
    source_class_id = str(payload.get('sourceClassId') or payload.get('source_class_id') or '').strip()
    target_class_id = str(payload.get('targetClassId') or payload.get('target_class_id') or '').strip()

    if len(student_cpf) != 11:
        return jsonify({'error': 'Aluno invalido para realocacao.'}), 400
    if not source_class_id or not target_class_id:
        return jsonify({'error': 'Informe a turma de origem e a turma de destino.'}), 400

    response_body, status_code = reallocate_student_between_classes(student_cpf, source_class_id, target_class_id)
    return jsonify(response_body), status_code


@app.route('/api/planos', methods=['GET', 'POST'])
@validate_request(PlanoCreate, methods=('POST',))
def academy_plans():
    ensure_default_academy_plans()

    if request.method == 'GET':
        q = (request.args.get('q') or '').strip()
        ativo = request.args.get('ativo')
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('limit', 20))
        except Exception:
            page = 1
            per_page = 20

        query = PlanoAcademia.query
        if q:
            query = query.filter(PlanoAcademia.nome.ilike(f"%{q}%"))
        if ativo is not None:
            is_active = str(ativo).lower() in ('1', 'true', 'yes')
            query = query.filter_by(ativo=is_active)

        pagination = query.order_by(PlanoAcademia.id.asc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [serialize_plano_academia(plano) for plano in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_plano_academia(payload)
    return jsonify(response_body), status_code


@app.route('/api/planos/<int:plan_id>', methods=['PUT', 'DELETE'])
@validate_request(PlanoUpdate, methods=('PUT',), partial=True)
def academy_plan_detail(plan_id):
    plan = PlanoAcademia.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plano nao encontrado.'}), 404

    if request.method == 'DELETE':
        active_students_count = count_active_students_for_plan(plan.nome)
        if active_students_count > 0:
            return jsonify(
                {
                    'error': f'Este plano esta vinculado a {active_students_count} aluno(s) ativo(s). Realoque esses alunos antes de remover o plano.',
                    'active_students_count': active_students_count,
                }
            ), 409
        db.session.delete(plan)
        db.session.commit()
        return jsonify({'message': 'Plano removido com sucesso.'})

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_plano_academia(payload, existing_plan=plan)
    return jsonify(response_body), status_code


@app.route('/api/planos/<int:plan_id>/status', methods=['PATCH'])
def academy_plan_status(plan_id):
    plan = PlanoAcademia.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plano nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    next_status = parse_bool(payload.get('active', payload.get('ativo')), default=plan.ativo)
    plan.ativo = next_status
    db.session.add(plan)
    db.session.commit()
    return jsonify(serialize_plano_academia(plan))


@app.route('/api/planos/<int:plan_id>/realocar-alunos', methods=['POST'])
def academy_plan_reallocate_students(plan_id):
    source_plan = PlanoAcademia.query.get(plan_id)
    if not source_plan:
        return jsonify({'error': 'Plano de origem nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    target_plan_id = payload.get('target_plan_id') or payload.get('targetPlanId')

    try:
        target_plan_id = int(str(target_plan_id or '').strip())
    except ValueError:
        return jsonify({'error': 'Informe um plano de destino valido.'}), 400

    target_plan = PlanoAcademia.query.get(target_plan_id)
    if not target_plan:
        return jsonify({'error': 'Plano de destino nao encontrado.'}), 404
    if target_plan.id == source_plan.id:
        return jsonify({'error': 'Escolha um plano diferente para a realocacao.'}), 400
    if not target_plan.ativo:
        return jsonify({'error': 'O plano de destino precisa estar ativo.'}), 400

    updated_students = reallocate_active_students_between_plans(source_plan, target_plan)
    return jsonify(
        {
            'message': f'{len(updated_students)} aluno(s) ativo(s) foram realocados com sucesso.',
            'updated_count': len(updated_students),
            'source_plan': serialize_plano_academia(source_plan),
            'target_plan': serialize_plano_academia(target_plan),
            'students': [serialize_aluno_cadastro(aluno) for aluno in updated_students],
        }
    )


def build_receipts_payload():
    recebimentos = RecebimentoAluno.query.order_by(RecebimentoAluno.vencimento.desc(), RecebimentoAluno.criado_em.desc()).all()
    recent_receipts = recebimentos[:8]

    active_students = AlunoCadastro.query.filter_by(status='ativo').all()
    previsto = sum(get_plan_price(aluno.plano) for aluno in active_students)

    now = datetime.now()
    realizado = sum(
        recebimento.valor
        for recebimento in recebimentos
        if (
            recebimento.status == 'pago'
            and recebimento.pago_em
            and recebimento.pago_em.year == now.year
            and recebimento.pago_em.month == now.month
        )
    )

    status_totals = {
        'pago': sum(1 for recebimento in recebimentos if recebimento.status == 'pago'),
        'pendente': sum(1 for recebimento in recebimentos if recebimento.status == 'pendente'),
        'atrasado': sum(1 for recebimento in recebimentos if recebimento.status == 'atrasado'),
    }

    return {
        'recent_receipts': [serialize_recebimento_aluno(recebimento) for recebimento in recent_receipts],
        'summary': {
            'previsto': previsto,
            'previstoLabel': format_currency_brl(previsto),
            'realizado': realizado,
            'realizadoLabel': format_currency_brl(realizado),
            'statusTotals': status_totals,
        },
    }


@app.route('/api/finance/recebimentos', methods=['GET'])
def finance_receipts():
    ensure_default_receipts()
    return jsonify(build_receipts_payload())


@app.route('/api/payments/webhook', methods=['POST'])
def payments_webhook():
    payload = request.get_json(silent=True) or {}
    response_body, status_code = upsert_recebimento_aluno(payload)
    return jsonify(response_body), status_code


@app.route('/api/finance/payroll', methods=['GET'])
def finance_payroll():
    ensure_monthly_payroll()
    current_reference = datetime.now().strftime('%Y-%m')
    payroll_entries = FolhaPagamentoProfessor.query.filter_by(referencia=current_reference).order_by(FolhaPagamentoProfessor.professor_nome.asc()).all()

    total_base = sum(entry.valor_base for entry in payroll_entries)
    total_adjusted = sum(entry.valor_ajustado for entry in payroll_entries)
    adjusted_count = sum(1 for entry in payroll_entries if abs(entry.valor_ajustado - entry.valor_base) > 0.009 or entry.status == 'ajustado')

    return jsonify(
        {
            'reference': current_reference,
            'default_due_date': format_date_br(get_fifth_business_day(datetime.now().year, datetime.now().month)),
            'items': [serialize_folha_pagamento(entry) for entry in payroll_entries],
            'summary': {
                'totalBase': total_base,
                'totalBaseLabel': format_currency_brl(total_base),
                'totalAdjusted': total_adjusted,
                'totalAdjustedLabel': format_currency_brl(total_adjusted),
                'adjustedCount': adjusted_count,
            },
        }
    )


@app.route('/api/finance/payroll/<int:payroll_id>', methods=['PUT'])
def adjust_finance_payroll(payroll_id):
    payroll = FolhaPagamentoProfessor.query.get(payroll_id)
    if not payroll:
        return jsonify({'error': 'Lancamento de folha nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = update_payroll_entry(payroll, payload)
    return jsonify(response_body), status_code


@app.route('/api/cadastros/alunos', methods=['GET', 'POST'])
@validate_request(AlunoCreate, methods=('POST',))
def cadastros_alunos():
    if request.method == 'GET':
        q = (request.args.get('q') or '').strip()
        status = request.args.get('status')
        plano = request.args.get('plano')
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('limit', 20))
        except Exception:
            page = 1
            per_page = 20

        query = AlunoCadastro.query
        if q:
            pattern = f"%{q}%"
            query = query.filter(or_(AlunoCadastro.nome.ilike(pattern), AlunoCadastro.cpf.ilike(pattern)))
        if status:
            query = query.filter_by(status=status)
        if plano:
            query = query.filter(AlunoCadastro.plano.ilike(f"%{plano}%"))

        pagination = query.order_by(AlunoCadastro.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [serialize_aluno_cadastro(aluno) for aluno in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@app.route('/api/cadastros/professores', methods=['GET', 'POST'])
@validate_request(ProfessorCreate, methods=('POST',))
def cadastros_professores():
    if request.method == 'GET':
        q = (request.args.get('q') or '').strip()
        status = request.args.get('status')
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('limit', 20))
        except Exception:
            page = 1
            per_page = 20

        query = ProfessorCadastro.query
        if q:
            pattern = f"%{q}%"
            query = query.filter(or_(ProfessorCadastro.nome.ilike(pattern), ProfessorCadastro.especialidade.ilike(pattern)))
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(ProfessorCadastro.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [serialize_professor_cadastro(professor) for professor in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_professor_cadastro(payload)
    return jsonify(response_body), status_code


@app.route('/api/cadastros/professores/<cpf>', methods=['PUT'])
@validate_request(ProfessorUpdate, methods=('PUT',), partial=True)
def atualizar_professor(cpf):
    normalized_cpf = normalize_cpf(cpf)
    professor = ProfessorCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not professor:
        return jsonify({'error': 'Professor nao encontrado.'}), 404

    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    payload['cpf'] = normalized_cpf
    response_body, status_code = persist_professor_cadastro(payload, existing_professor=professor)
    return jsonify(response_body), status_code



# ========== ROTAS ADICIONAIS - INTEGRAÇÃO COM DASHBOARD REFATORADO ==========

@app.route('/api/cadastros/alunos/<cpf>', methods=['PUT'])
@validate_request(AlunoUpdate, methods=('PUT',), partial=True)
def atualizar_aluno(cpf):
    """Atualiza os dados de um aluno existente."""
    normalized_cpf = normalize_cpf(cpf)
    aluno = AlunoCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not aluno:
        return jsonify({'error': 'Aluno nao encontrado.'}), 404
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}

    try:
        if 'nome' in payload:
            aluno.nome = payload.get('nome', '').replace('  ', ' ').strip()
        if 'telefone' in payload:
            aluno.telefone = normalize_cpf(payload.get('telefone', ''))
        if 'email' in payload:
            aluno.email = payload.get('email', '').lower().strip()
        if 'idade' in payload:
            aluno.idade = int(payload.get('idade', aluno.idade))
        if 'peso' in payload:
            aluno.peso = float(payload.get('peso', aluno.peso))
        if 'plano' in payload:
            aluno.plano = payload.get('plano', '')
        if 'status' in payload:
            aluno.status = payload.get('status', '')
        if 'pagamento' in payload:
            aluno.pagamento = payload.get('pagamento', '')

        db.session.commit()
        return jsonify(serialize_aluno_cadastro(aluno)), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao atualizar aluno: {str(error)}'}), 400


@app.route('/api/finance/entries', methods=['POST'])
@validate_request(EntryCreate, methods=('POST',))
def criar_entrada_financeira():
    """Cria uma entrada de receita ou despesa no financeiro."""
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}

    description = payload.get('description', '').strip()
    category = payload.get('category', '').strip()
    try:
        amount = float(payload.get('amount', 0))
    except Exception:
        amount = 0
    entry_type = payload.get('type', 'receita')
    date_str = payload.get('date', datetime.now().isoformat().split('T')[0])

    if not description or not category or amount <= 0:
        return jsonify({'error': 'Informe descricao, valor e categoria validos.'}), 400

    if entry_type not in ['receita', 'despesa']:
        return jsonify({'error': 'Tipo deve ser receita ou despesa.'}), 400

    try:
        entry = {
            'id': f'fin-{int(datetime.now().timestamp() * 1000)}',
            'type': entry_type,
            'description': description,
            'category': category,
            'amount': amount,
            'date': date_str,
            'createdAt': datetime.now().isoformat(),
        }
        return jsonify(entry), 201
    except Exception as error:
        return jsonify({'error': f'Falha ao criar entrada: {str(error)}'}), 400


@app.route('/api/cadastros/professores/<cpf>/vacation', methods=['POST'])
def processar_ferias_professor(cpf):
    """Processa solicitação de férias (aprova, reprova ou concede)."""
    normalized_cpf = normalize_cpf(cpf)
    professor = ProfessorCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not professor:
        return jsonify({'error': 'Professor nao encontrado.'}), 404

    payload = request.get_json(silent=True) or {}
    action = payload.get('action')
    start_date = payload.get('startDate')
    end_date = payload.get('endDate')

    if not action or action not in ['aprovada', 'reprovada', 'realocada', 'concedida']:
        return jsonify({'error': 'Acao invalida.'}), 400

    if not start_date or not end_date:
        return jsonify({'error': 'Informe data de inicio e fim.'}), 400

    try:
        if action in ['aprovada', 'concedida']:
            professor.status = 'ferias'
        elif action == 'reprovada':
            professor.status = 'ativo'

        db.session.commit()

        vacation_entry = {
            'id': f'vac-{int(datetime.now().timestamp() * 1000)}',
            'action': action,
            'startDate': start_date,
            'endDate': end_date,
            'createdAt': datetime.now().isoformat(),
        }

        return jsonify(vacation_entry), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao processar ferias: {str(error)}'}), 400


@app.route('/api/finance/payments', methods=['POST'])
@validate_request(PaymentCreate, methods=('POST',))
def registrar_pagamento():
    """Registra pagamento manual e devolve o snapshot atualizado do financeiro."""
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or {}

    student_cpf = normalize_cpf(payload.get('studentCpf', ''))
    student_name = re.sub(r'\s+', ' ', str(payload.get('studentName', '')).strip())
    default_reference = datetime.now().strftime('%Y-%m')
    reference = re.sub(r'\s+', ' ', str(payload.get('reference', default_reference)).strip()) or default_reference
    description = re.sub(r'\s+', ' ', str(payload.get('description', f'Mensalidade {reference}')).strip()) or f'Mensalidade {reference}'
    payment_method = str(payload.get('paymentMethod', 'manual')).strip().lower() or 'manual'
    payment_date = payload.get('paymentDate', datetime.now().isoformat().split('T')[0])
    if payment_method not in {'manual', 'dinheiro', 'pix', 'cartao-debito', 'cartao-credito'}:
        payment_method = 'manual'

    try:
        amount = parse_currency_to_float(payload.get('amount', 0))
    except (TypeError, ValueError):
        amount = 0

    try:
        due_date = parse_date(payment_date)
    except ValueError:
        return jsonify({'error': 'Data de pagamento invalida.'}), 400

    if not student_cpf or not student_name or amount <= 0:
        return jsonify({'error': 'Informe CPF, nome e valor do pagamento.'}), 400

    try:
        aluno = AlunoCadastro.query.filter_by(cpf=student_cpf).first()
        if not aluno:
            return jsonify({'error': 'Aluno nao encontrado.'}), 404

        recebimento = RecebimentoAluno(
            aluno_id=aluno.id,
            aluno_nome=aluno.nome,
            aluno_cpf=aluno.cpf,
            referencia=reference,
            descricao=description,
            provider=payment_method,
            status='pago',
            valor=amount,
            vencimento=due_date,
            pago_em=datetime.now(),
        )

        db.session.add(recebimento)

        update_aluno_payment_snapshot(aluno, 'pago', due_date, recebimento.pago_em)
        aluno.status = 'ativo'

        db.session.commit()

        receipts_payload = build_receipts_payload()
        return jsonify({
            'id': recebimento.id,
            'message': 'Pagamento registrado com sucesso.',
            'student': serialize_aluno_cadastro(aluno),
            'receipt': serialize_recebimento_aluno(recebimento),
            'summary': receipts_payload['summary'],
        }), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao registrar pagamento: {str(error)}'}), 400


@app.route('/alunos', methods=['GET', 'POST'])
def alunos():
    # GET devolve todos os alunos em JSON para consumo por JS/SPA.
    if request.method == 'GET':
        q = (request.args.get('q') or '').strip()
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('limit', 20))
        except Exception:
            page = 1
            per_page = 20

        query = AlunoCadastro.query
        if q:
            query = query.filter(AlunoCadastro.nome.ilike(f"%{q}%"))

        pagination = query.order_by(AlunoCadastro.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        if pagination.items:
            items = [{'id': aluno.id, 'nome': aluno.nome} for aluno in pagination.items]
            meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
            return jsonify({'success': True, 'data': items, 'meta': meta})

        fallback = Aluno.query.order_by(Aluno.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [{'id': aluno.id, 'nome': aluno.nome} for aluno in fallback.items]
        meta = {'total': fallback.total, 'pages': fallback.pages, 'page': fallback.page, 'per_page': fallback.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@app.route('/alunos/adicionar', methods=['POST'])
def adicionar_aluno_legacy():
    payload = request.form.to_dict() or request.get_json(silent=True) or {}
    response_body, status_code = persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    payload = request.get_json(silent=True) or {}
    cpf = normalize_cpf(payload.get('cpf'))
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido. Informe 11 digitos.'}), 400

    query = Usuario.query.filter_by(cpf=cpf)
    if role:
        query = query.filter_by(role=role)

    user = query.first()
    if not user:
        return jsonify({'error': 'Nenhum usuario encontrado para este CPF.'}), 404

    reset_code = generate_reset_code()
    user.reset_code_hash = generate_password_hash(reset_code)
    user.reset_code_expires_at = datetime.now() + timedelta(minutes=RESET_CODE_EXPIRATION_MINUTES)
    user.reset_code_used = False
    db.session.commit()

    email_ok, email_msg = send_reset_email(user.email, reset_code)
    whatsapp_ok, whatsapp_msg = send_reset_whatsapp(user.whatsapp, reset_code)

    if email_ok and whatsapp_ok:
        return jsonify(
            {
                'message': 'Codigo enviado por e-mail e WhatsApp.',
                'expires_in_minutes': RESET_CODE_EXPIRATION_MINUTES,
                'email': mask_email(user.email),
                'whatsapp': mask_phone(user.whatsapp),
            }
        )

    return jsonify(
        {
            'error': 'Nao foi possivel enviar o codigo em todos os canais.',
            'details': {'email': email_msg, 'whatsapp': whatsapp_msg},
        }
    ), 502


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    payload = request.get_json(silent=True) or {}
    cpf = normalize_cpf(payload.get('cpf'))
    password = str(payload.get('password') or '')
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido. Informe 11 digitos.'}), 400
    if not password:
        return jsonify({'error': 'Senha obrigatoria.'}), 400

    user = get_user_for_login(cpf, role)

    if not user or not check_password_hash(user.senha_hash, password):
        return jsonify({'error': 'CPF ou senha invalidos.'}), 401

    return jsonify(
        {
            'message': 'Login realizado com sucesso.',
            'user': {
                'nome': user.nome,
                'cpf': format_cpf(user.cpf),
                'role': user.role,
                'email': mask_email(user.email),
                'whatsapp': mask_phone(user.whatsapp),
            },
        }
    )


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    payload = request.get_json(silent=True) or {}
    cpf = normalize_cpf(payload.get('cpf'))
    code = str(payload.get('code') or '').strip()
    new_password = str(payload.get('new_password') or '')
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido.'}), 400
    if len(code) != 6 or not code.isdigit():
        return jsonify({'error': 'Codigo invalido. Use 6 digitos.'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'A nova senha precisa ter ao menos 6 caracteres.'}), 400

    query = Usuario.query.filter_by(cpf=cpf)
    if role:
        query = query.filter_by(role=role)
    user = query.first()

    if not user:
        return jsonify({'error': 'Usuario nao encontrado.'}), 404

    if (
        not user.reset_code_hash
        or user.reset_code_used
        or not user.reset_code_expires_at
        or user.reset_code_expires_at < datetime.now()
    ):
        return jsonify({'error': 'Codigo expirado ou inexistente. Solicite um novo codigo.'}), 400

    if not check_password_hash(user.reset_code_hash, code):
        return jsonify({'error': 'Codigo invalido.'}), 400

    user.senha_hash = generate_password_hash(new_password)
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    user.reset_code_used = True
    db.session.commit()

    return jsonify({'message': 'Senha atualizada com sucesso.'})


# ----- HANDLERS GLOBAIS DE ERRO (respostas padronizadas) -----
@app.errorhandler(404)
def handle_404(error):
    payload = {'message': 'Endpoint nao encontrado.'}
    return api_response(payload, success=False, status=404)


@app.errorhandler(Exception)
def handle_exception(error):
    # Loga excecao para observabilidade.
    app.logger.exception(error)

    # Se for um HTTPException (400, 401, 403, 404, etc.), preserve o código e descricao.
    if isinstance(error, HTTPException):
        description = getattr(error, 'description', None) or str(error)
        return api_response({'message': description}, success=False, status=error.code)

    # Para excecoes nao esperadas, nao vaze detalhes em producao.
    show_details = app.debug or os.getenv('FLASK_DEBUG') == '1' or os.getenv('ENV', '').lower() == 'development'
    if show_details:
        payload = {'message': 'Erro interno no servidor.', 'details': str(error)}
    else:
        payload = {'message': 'Erro interno no servidor.'}

    return api_response(payload, success=False, status=500)


# Handler para erros de validacao do pydantic (quando instalado)
if PydanticValidationError:
    @app.errorhandler(PydanticValidationError)
    def handle_pydantic_validation(error):
        try:
            details = error.errors()
        except Exception:
            details = str(error)
        return api_response({'message': 'Payload invalido.', 'errors': details}, success=False, status=400)


# Handler para erros de validacao do pydantic (quando instalado)
if PydanticValidationError:
    @app.errorhandler(PydanticValidationError)
    def handle_pydantic_validation(error):
        try:
            details = error.errors()
        except Exception:
            details = str(error)
        return api_response({'message': 'Payload invalido.', 'errors': details}, success=False, status=400)


@app.after_request
def wrap_json_response(response):
    # Padroniza respostas JSON para o formato { success: bool, data|error: ... }
    content_type = response.headers.get('Content-Type', '')
    if 'application/json' in content_type:
        try:
            import json

            raw = response.get_data(as_text=True) or ''
            data = json.loads(raw) if raw else None
        except Exception:
            return response

        # Se já estiver no formato padronizado, não altera
        if isinstance(data, dict) and 'success' in data:
            return response

        status = response.status_code or 200
        try:
            if 200 <= status < 300:
                wrapped = {'success': True, 'data': data}
            else:
                wrapped = {'success': False, 'error': data}

            response.set_data(json.dumps(wrapped))
            response.headers['Content-Length'] = str(len(response.get_data()))
            response.headers['Content-Type'] = 'application/json'
        except Exception:
            # Caso de erro na serializacao, retorna resposta original
            return response

    return response


# -------------------------
# INICIALIZACAO DO APP
# -------------------------
def initialize_app():
    """Inicializa o app com dados padrao e tabelas do banco de dados."""
    with app.app_context():
        # Criar tabelas se nao existirem
        db.create_all()
        print("✅ Tabelas do banco de dados criadas/verificadas")
        
        # Garantir usuario padrao de desenvolvimento
        ensure_default_users()
        print("✅ Usuario padrao de desenvolvimento garantido")
        
        # Garantir dados iniciais (ordem importa)
        ensure_default_academy_plans()
        print("✅ Planos de academia carregados")
        
        ensure_default_agenda_classes()
        print("✅ Agenda de aulas carregada")
        
        ensure_default_receipts()
        print("✅ Recebimentos padrao carregados")
        
        ensure_monthly_payroll()
        print("✅ Folha de pagamento mensal provisionada")
        
        print("\n🚀 Aplicacao iniciada com sucesso!")
        print("📍 Endpoints disponiveis em: http://localhost:5000/api/*")
        print("🌐 CORS configurado para: http://localhost:3000 e http://127.0.0.1:3000")


if __name__ == '__main__':
    # Inicializa app antes de executar
    initialize_app()
    # debug=True facilita desenvolvimento local
    app.run(debug=True)
