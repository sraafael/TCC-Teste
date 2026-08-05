from flask import Blueprint, request, jsonify

import utils
from models import TurmaAgenda, TurmaAluno
from sqlalchemy.orm import selectinload
from validators import validate_request
from schemas import TurmaCreate, TurmaUpdate, ReallocateStudent
from ._helpers import get_pagination_arguments, get_request_payload, serialize_pagination

agenda_bp = Blueprint('agenda', __name__)


@agenda_bp.route('/api/agenda/classes', methods=['GET'])
def agenda_classes():
    utils.ensure_default_agenda_classes()
    # Query params: page, limit, q (search by event or professor)
    q = (request.args.get('q') or '').strip()
    page, per_page = get_pagination_arguments()

    query = TurmaAgenda.query.options(selectinload(TurmaAgenda.alunos).selectinload(TurmaAluno.aluno))
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (TurmaAgenda.evento.ilike(pattern)) | (TurmaAgenda.professor.ilike(pattern))
        )

    pagination = query.order_by(TurmaAgenda.horario.asc()).paginate(page=page, per_page=per_page, error_out=False)
    items = [utils.serialize_turma_agenda(turma) for turma in pagination.items]
    meta = serialize_pagination(pagination)
    return jsonify({'success': True, 'data': items, 'meta': meta})


@agenda_bp.route('/api/agenda/classes', methods=['POST'])
@validate_request(TurmaCreate, methods=('POST',))
def agenda_create_class():
    utils.ensure_default_agenda_classes()
    payload = get_request_payload(use_validated_data=True)
    response_body, status_code = utils.persist_turma_agenda(payload)
    return jsonify(response_body), status_code


@agenda_bp.route('/api/agenda/classes/<class_id>', methods=['PUT', 'DELETE'])
@validate_request(TurmaUpdate, methods=('PUT',), partial=True)
def agenda_manage_class(class_id):
    utils.ensure_default_agenda_classes()
    turma = TurmaAgenda.query.get(class_id)
    if not turma:
        return jsonify({'error': 'Turma nao encontrada.'}), 404

    if request.method == 'DELETE':
        from extensions import db

        db.session.delete(turma)
        db.session.commit()
        return jsonify({'message': 'Turma cancelada com sucesso.', 'id': class_id})

    payload = get_request_payload()
    response_body, status_code = utils.persist_turma_agenda(payload, existing_class=turma)
    return jsonify(response_body), status_code


@agenda_bp.route('/api/agenda/reallocate-student', methods=['POST'])
@validate_request(ReallocateStudent, methods=('POST',))
def agenda_reallocate_student():
    utils.ensure_default_agenda_classes()
    payload = get_request_payload(use_validated_data=True)
    student_cpf = utils.normalize_cpf(payload.get('studentCpf') or payload.get('student_cpf'))
    source_class_id = str(payload.get('sourceClassId') or payload.get('source_class_id') or '').strip()
    target_class_id = str(payload.get('targetClassId') or payload.get('target_class_id') or '').strip()

    response_body, status_code = utils.reallocate_student_between_classes(student_cpf, source_class_id, target_class_id)
    return jsonify(response_body), status_code
