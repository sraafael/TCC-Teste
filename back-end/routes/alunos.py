from flask import Blueprint, request, jsonify

import utils
from models import Aluno, AlunoCadastro
from extensions import db
from validators import validate_request
from schemas import AlunoCreate, AlunoUpdate
from sqlalchemy import or_
from ._helpers import get_pagination_arguments, get_request_payload, serialize_pagination

alunos_bp = Blueprint('alunos', __name__)


@alunos_bp.route('/api/cadastros/alunos', methods=['GET', 'POST'])
@validate_request(AlunoCreate, methods=('POST',))
def cadastros_alunos():
    if request.method == 'GET':
        # Query params: page, limit, q (search), status, plano
        q = (request.args.get('q') or '').strip()
        status = request.args.get('status')
        plano = request.args.get('plano')
        page, per_page = get_pagination_arguments()

        query = AlunoCadastro.query
        if q:
            pattern = f"%{q}%"
            query = query.filter(or_(AlunoCadastro.nome.ilike(pattern), AlunoCadastro.cpf.ilike(pattern)))
        if status:
            query = query.filter_by(status=status)
        if plano:
            query = query.filter(AlunoCadastro.plano.ilike(f"%{plano}%"))

        pagination = query.order_by(AlunoCadastro.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [utils.serialize_aluno_cadastro(aluno) for aluno in pagination.items]
        meta = serialize_pagination(pagination)
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = get_request_payload()
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/alunos', methods=['GET', 'POST'])
@validate_request(AlunoCreate, methods=('POST',))
def alunos():
    if request.method == 'GET':
        q = (request.args.get('q') or '').strip()
        page, per_page = get_pagination_arguments()

        query = AlunoCadastro.query
        if q:
            query = query.filter(AlunoCadastro.nome.ilike(f"%{q}%"))

        pagination = query.order_by(AlunoCadastro.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        if pagination.items:
            items = [{'id': aluno.id, 'nome': aluno.nome} for aluno in pagination.items]
            meta = serialize_pagination(pagination)
            return jsonify({'success': True, 'data': items, 'meta': meta})

        fallback = Aluno.query.order_by(Aluno.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [{'id': aluno.id, 'nome': aluno.nome} for aluno in fallback.items]
        meta = serialize_pagination(fallback)
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = get_request_payload()
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/alunos/adicionar', methods=['POST'])
@validate_request(AlunoCreate, methods=('POST',))
def adicionar_aluno_legacy():
    payload = get_request_payload(prefer_form=True)
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/api/cadastros/alunos/<cpf>', methods=['PUT'])
@validate_request(AlunoUpdate, methods=('PUT',), partial=True)
def atualizar_aluno(cpf):
    normalized_cpf = utils.normalize_cpf(cpf)
    aluno = AlunoCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not aluno:
        return jsonify({'error': 'Aluno nao encontrado.'}), 404

    payload = get_request_payload()

    try:
        if 'nome' in payload:
            aluno.nome = payload.get('nome', '').replace('  ', ' ').strip()
        if 'telefone' in payload:
            aluno.telefone = utils.normalize_cpf(payload.get('telefone', ''))
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
        return jsonify(utils.serialize_aluno_cadastro(aluno)), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao atualizar aluno: {str(error)}'}), 400
