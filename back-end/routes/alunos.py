from flask import Blueprint, request, jsonify

import utils
from models import Aluno, AlunoCadastro
from extensions import db
from validators import validate_request
from schemas import AlunoCreate, AlunoUpdate
from sqlalchemy import or_

alunos_bp = Blueprint('alunos', __name__)


@alunos_bp.route('/api/cadastros/alunos', methods=['GET', 'POST'])
@validate_request(AlunoCreate, methods=('POST',))
def cadastros_alunos():
    // TODO: REFACTOR - A rota trata consulta, criação e formatos alternativos de payload em um mesmo endpoint, tornando a regra de negócio difícil de evoluir.
    if request.method == 'GET':
        # Query params: page, limit, q (search), status, plano
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
        items = [utils.serialize_aluno_cadastro(aluno) for aluno in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/alunos', methods=['GET', 'POST'])
@validate_request(AlunoCreate, methods=('POST',))
def alunos():
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
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/alunos/adicionar', methods=['POST'])
@validate_request(AlunoCreate, methods=('POST',))
def adicionar_aluno_legacy():
    payload = request.form.to_dict() or request.get_json(silent=True) or {}
    response_body, status_code = utils.persist_aluno_cadastro(payload)
    return jsonify(response_body), status_code


@alunos_bp.route('/api/cadastros/alunos/<cpf>', methods=['PUT'])
@validate_request(AlunoUpdate, methods=('PUT',), partial=True)
def atualizar_aluno(cpf):
    // TODO: REFACTOR - A atualização de aluno faz transformações de domínio diretamente na rota, misturando persistência e regras de negócio.
    normalized_cpf = utils.normalize_cpf(cpf)
    aluno = AlunoCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not aluno:
        return jsonify({'error': 'Aluno nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}

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
