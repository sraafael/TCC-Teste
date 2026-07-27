import base64
import os
import re
import secrets
import smtplib
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from email.message import EmailMessage

from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

from extensions import db
from models import (
    Aluno,
    Plano,
    PlanoAcademia,
    AlunoCadastro,
    ProfessorCadastro,
    TurmaAgenda,
    TurmaAluno,
    RecebimentoAluno,
    FolhaPagamentoProfessor,
    Usuario,
)
from sqlalchemy.orm import selectinload

RESET_CODE_EXPIRATION_MINUTES = int(os.getenv('RESET_CODE_EXPIRATION_MINUTES', '10'))
SPECIAL_TEST_CPF = '54514214809'
SPECIAL_TEST_PASSWORD = '123456789'
DEV_FAKE_NOTIFICATIONS = os.getenv('DEV_FAKE_NOTIFICATIONS', 'true').lower() == 'true'


# -------------------------
# FUNCOES AUXILIARES
# -------------------------

def normalize_cpf(raw_value):
    digits = re.sub(r'\D', '', raw_value or '')
    return digits


def get_user_for_login(cpf, role=None):
    # TODO: REFACTOR - A lógica de autenticação faz fallback para usuário de teste e consulta por role em um mesmo ponto, escondendo regras de negócio importantes.
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
    # TODO: REFACTOR - A persistência de aluno mistura normalização, validação, criação e atualização com regras de negócio implícitas.
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
    # TODO: REFACTOR - A persistência de professor concentra domínio, status e relacionamento com alunos em uma função ampla.
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
    # TODO: REFACTOR - O upsert de recebimento assume um payload heterogêneo e faz várias transformações de negócio em sequência.
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

    recent_students = AlunoCadastro.query.filter(AlunoCadastro.criado_em >= datetime.now() - timedelta(days=3)).order_by(AlunoCadastro.criado_em.desc()).all()
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
    # TODO: REFACTOR - A persistência de turma mistura geração de ID, associação de alunos e atualização de estado em um único fluxo.
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
    # TODO: REFACTOR - A função de seed de agenda é um ponto de acoplamento forte entre dados mockados e regras operacionais reais.
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

    # Use app logger where available; here just return simulated success
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
    TurmaAluno.query.delete()
    TurmaAgenda.query.delete()
    RecebimentoAluno.query.delete()
    FolhaPagamentoProfessor.query.delete()
    AlunoCadastro.query.delete()
    ProfessorCadastro.query.delete()
    Usuario.query.filter(Usuario.cpf != SPECIAL_TEST_CPF).delete()
    db.session.commit()


def ensure_default_users():
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
