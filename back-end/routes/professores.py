from flask import Blueprint, request, jsonify
from datetime import datetime

import utils
from models import ProfessorCadastro
from extensions import db
from validators import validate_request
from schemas import ProfessorCreate, ProfessorUpdate, ProfessorVacation
from sqlalchemy import or_

professores_bp = Blueprint('professores', __name__)


@professores_bp.route('/api/cadastros/professores', methods=['GET', 'POST'])
@validate_request(ProfessorCreate, methods=('POST',))
def cadastros_professores():
    if request.method == 'GET':
        # Query params: page, limit, q (search), status
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
        items = [utils.serialize_professor_cadastro(professor) for professor in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = utils.persist_professor_cadastro(payload)
    return jsonify(response_body), status_code


@professores_bp.route('/api/cadastros/professores/<cpf>', methods=['PUT'])
@validate_request(ProfessorUpdate, methods=('PUT',), partial=True)
def atualizar_professor(cpf):
    normalized_cpf = utils.normalize_cpf(cpf)
    professor = ProfessorCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not professor:
        return jsonify({'error': 'Professor nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    payload['cpf'] = normalized_cpf
    response_body, status_code = utils.persist_professor_cadastro(payload, existing_professor=professor)
    return jsonify(response_body), status_code


@professores_bp.route('/api/cadastros/professores/<cpf>/vacation', methods=['POST'])
@validate_request(ProfessorVacation, methods=('POST',))
def processar_ferias_professor(cpf):
    normalized_cpf = utils.normalize_cpf(cpf)
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
