from flask import Blueprint, request, jsonify

import utils
from models import PlanoAcademia
from extensions import db
from validators import validate_request
from schemas import PlanoCreate, PlanoUpdate, PlanReallocate

planos_bp = Blueprint('planos', __name__)


@planos_bp.route('/api/planos', methods=['GET', 'POST'])
@validate_request(PlanoCreate, methods=('POST',))
def academy_plans():
    // TODO: REFACTOR - A rota de planos mistura criação de dados padrão, filtragem, paginação e persistência em uma única função.
    utils.ensure_default_academy_plans()

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
            # accept 'true'/'false' or '1'/'0'
            is_active = str(ativo).lower() in ('1', 'true', 'yes')
            query = query.filter_by(ativo=is_active)

        pagination = query.order_by(PlanoAcademia.id.asc()).paginate(page=page, per_page=per_page, error_out=False)
        items = [utils.serialize_plano_academia(plano) for plano in pagination.items]
        meta = {'total': pagination.total, 'pages': pagination.pages, 'page': pagination.page, 'per_page': pagination.per_page}
        return jsonify({'success': True, 'data': items, 'meta': meta})

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = utils.persist_plano_academia(payload)
    return jsonify(response_body), status_code


@planos_bp.route('/api/planos/<int:plan_id>', methods=['PUT', 'DELETE'])
@validate_request(PlanoUpdate, methods=('PUT',), partial=True)
def academy_plan_detail(plan_id):
    // TODO: REFACTOR - A regra de impedir remoção com alunos ativos está embutida na rota, acoplando negócio à camada HTTP.
    plan = PlanoAcademia.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plano nao encontrado.'}), 404

    if request.method == 'DELETE':
        active_students_count = utils.count_active_students_for_plan(plan.nome)
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

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    response_body, status_code = utils.persist_plano_academia(payload, existing_plan=plan)
    return jsonify(response_body), status_code


@planos_bp.route('/api/planos/<int:plan_id>/status', methods=['PATCH'])
def academy_plan_status(plan_id):
    plan = PlanoAcademia.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plano nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    next_status = utils.parse_bool(payload.get('active', payload.get('ativo')), default=plan.ativo)
    plan.ativo = next_status
    db.session.add(plan)
    db.session.commit()
    return jsonify(utils.serialize_plano_academia(plan))


@planos_bp.route('/api/planos/<int:plan_id>/realocar-alunos', methods=['POST'])
@validate_request(PlanReallocate, methods=('POST',))
def academy_plan_reallocate_students(plan_id):
    // TODO: REFACTOR - A realocação de alunos entre planos tem validações e transformações de domínio diretamente na rota.
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

    updated_students = utils.reallocate_active_students_between_plans(source_plan, target_plan)
    return jsonify(
        {
            'message': f'{len(updated_students)} aluno(s) ativo(s) foram realocados com sucesso.',
            'updated_count': len(updated_students),
            'source_plan': utils.serialize_plano_academia(source_plan),
            'target_plan': utils.serialize_plano_academia(target_plan),
            'students': [utils.serialize_aluno_cadastro(aluno) for aluno in updated_students],
        }
    )
