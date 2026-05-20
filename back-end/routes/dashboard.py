from flask import Blueprint, jsonify

import utils
from models import AlunoCadastro, ProfessorCadastro, PlanoAcademia, Aluno

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/api/stats', methods=['GET'])
def get_stats():
    total_alunos_cadastro = AlunoCadastro.query.count()
    total_professores_cadastro = ProfessorCadastro.query.count()
    total_planos_academia = PlanoAcademia.query.count()
    return jsonify(
        {
            'total_alunos': total_alunos_cadastro if total_alunos_cadastro > 0 else Aluno.query.count(),
            'total_planos': total_planos_academia if total_planos_academia > 0 else 0,
            'total_professores': total_professores_cadastro,
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
