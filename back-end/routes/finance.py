from flask import Blueprint, request, jsonify
from datetime import datetime
import re

import utils
from models import RecebimentoAluno, AlunoCadastro, FolhaPagamentoProfessor
from extensions import db
from validators import validate_request
from schemas import EntryCreate, PaymentCreate, PayrollUpdate
from sqlalchemy import func, case

finance_bp = Blueprint('finance', __name__)


@finance_bp.route('/api/finance/recebimentos', methods=['GET'])
def finance_receipts():
    utils.ensure_default_receipts()
    return jsonify(utils.build_receipts_payload())


@finance_bp.route('/api/payments/webhook', methods=['POST'])
def payments_webhook():
    # Webhook payloads are provider-specific; do not enforce strict schema here
    payload = request.get_json(silent=True) or {}
    response_body, status_code = utils.upsert_recebimento_aluno(payload)
    return jsonify(response_body), status_code


@finance_bp.route('/api/finance/payroll', methods=['GET'])
def finance_payroll():
    utils.ensure_monthly_payroll()
    current_reference = datetime.now().strftime('%Y-%m')
    # pagination
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('limit', 20))
    except Exception:
        page = 1
        per_page = 20

    base_query = FolhaPagamentoProfessor.query.filter_by(referencia=current_reference).order_by(FolhaPagamentoProfessor.professor_nome.asc())

    # Aggregates computed via SQL to avoid loading full table
    total_base = db.session.query(func.coalesce(func.sum(FolhaPagamentoProfessor.valor_base), 0.0)).filter(FolhaPagamentoProfessor.referencia == current_reference).scalar() or 0.0
    total_adjusted = db.session.query(func.coalesce(func.sum(FolhaPagamentoProfessor.valor_ajustado), 0.0)).filter(FolhaPagamentoProfessor.referencia == current_reference).scalar() or 0.0
    adjusted_cond = (FolhaPagamentoProfessor.valor_ajustado - FolhaPagamentoProfessor.valor_base) > 0.009
    adjusted_count = db.session.query(
        func.coalesce(func.sum(case([(adjusted_cond, 1), (FolhaPagamentoProfessor.status == 'ajustado', 1)], else_=0)), 0)
    ).filter(FolhaPagamentoProfessor.referencia == current_reference).scalar() or 0

    pagination = base_query.paginate(page=page, per_page=per_page, error_out=False)
    items = [utils.serialize_folha_pagamento(entry) for entry in pagination.items]

    return jsonify(
        {
            'reference': current_reference,
            'default_due_date': utils.format_date_br(utils.get_fifth_business_day(datetime.now().year, datetime.now().month)),
            'items': items,
            'meta': {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page},
            'summary': {
                'totalBase': total_base,
                'totalBaseLabel': utils.format_currency_brl(total_base),
                'totalAdjusted': total_adjusted,
                'totalAdjustedLabel': utils.format_currency_brl(total_adjusted),
                'adjustedCount': int(adjusted_count),
            },
        }
    )


@finance_bp.route('/api/finance/payroll/<int:payroll_id>', methods=['PUT'])
@validate_request(PayrollUpdate, methods=('PUT',), partial=True)
def adjust_finance_payroll(payroll_id):
    payroll = FolhaPagamentoProfessor.query.get(payroll_id)
    if not payroll:
        return jsonify({'error': 'Lancamento de folha nao encontrado.'}), 404
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = utils.update_payroll_entry(payroll, payload)
    return jsonify(response_body), status_code


@finance_bp.route('/api/finance/entries', methods=['POST'])
@validate_request(EntryCreate, methods=('POST',))
def criar_entrada_financeira():
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


@finance_bp.route('/api/finance/payments', methods=['POST'])
@validate_request(PaymentCreate, methods=('POST',))
def registrar_pagamento():
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or {}

    student_cpf = utils.normalize_cpf(payload.get('studentCpf', ''))
    student_name = re.sub(r'\s+', ' ', str(payload.get('studentName', '')).strip()) if payload.get('studentName') else ''
    default_reference = datetime.now().strftime('%Y-%m')
    reference = re.sub(r'\s+', ' ', str(payload.get('reference', default_reference)).strip()) or default_reference
    description = re.sub(r'\s+', ' ', str(payload.get('description', f'Mensalidade {reference}')).strip()) or f'Mensalidade {reference}'
    payment_method = str(payload.get('paymentMethod', 'manual')).strip().lower() or 'manual'
    payment_date = payload.get('paymentDate', datetime.now().isoformat().split('T')[0])
    if payment_method not in {'manual', 'dinheiro', 'pix', 'cartao-debito', 'cartao-credito'}:
        payment_method = 'manual'

    try:
        amount = utils.parse_currency_to_float(payload.get('amount', 0))
    except (TypeError, ValueError):
        amount = 0

    try:
        due_date = utils.parse_date(payment_date)
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

        utils.update_aluno_payment_snapshot(aluno, 'pago', due_date, recebimento.pago_em)
        aluno.status = 'ativo'

        db.session.commit()

        receipts_payload = utils.build_receipts_payload()
        return jsonify({
            'id': recebimento.id,
            'message': 'Pagamento registrado com sucesso.',
            'student': utils.serialize_aluno_cadastro(aluno),
            'receipt': utils.serialize_recebimento_aluno(recebimento),
            'summary': receipts_payload['summary'],
        }), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao registrar pagamento: {str(error)}'}), 400
