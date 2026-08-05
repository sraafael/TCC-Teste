from flask import Blueprint, jsonify

import utils
from models import AlunoCadastro, ProfessorCadastro, PlanoAcademia, Aluno

dashboard_bp = Blueprint('dashboard', __name__)


def fallback_count(primary_model, fallback_model=None):
    primary_count = primary_model.query.count()
    if primary_count or fallback_model is None:
        return primary_count
    return fallback_model.query.count()


@dashboard_bp.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify(
        {
            'total_alunos': fallback_count(AlunoCadastro, Aluno),
            'total_planos': fallback_count(PlanoAcademia),
            'total_professores': fallback_count(ProfessorCadastro),
            'vencimentos': 5,
            'receita_mensal': 1250.00,
        }
    )


@dashboard_bp.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@dashboard_bp.route('/api/dashboard/alerts', methods=['GET'])
def dashboard_alerts():
    return jsonify(utils.build_dashboard_alerts())
