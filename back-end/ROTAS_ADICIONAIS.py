# ============================================================================
# ROTAS ADICIONAIS PARA INTEGRAÇÃO COM O DASHBOARD REFATORADO
# ============================================================================
# 
# Adicione estas rotas ao seu app.py ANTES da linha: if __name__ == '__main__'
# 
# ============================================================================
from flask import request, jsonify
from datetime import datetime

# ============================================================================
# 1. ROTA: Editar Aluno (PUT /api/cadastros/alunos/{cpf})
# ============================================================================
@app.route('/api/cadastros/alunos/<cpf>', methods=['PUT', 'OPTIONS'])
def atualizar_aluno(cpf):
    """Atualiza os dados de um aluno existente."""
    if request.method == 'OPTIONS':
        return ('', 204)

    normalized_cpf = normalize_cpf(cpf)
    aluno = AlunoCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not aluno:
        return jsonify({'error': 'Aluno nao encontrado.'}), 404

    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    payload['cpf'] = normalized_cpf

    try:
        aluno.nome = payload.get('nome', aluno.nome).replace(/\s+/g, " ").strip()
        aluno.telefone = normalize_cpf(payload.get('telefone', aluno.telefone))
        aluno.email = payload.get('email', aluno.email).lower().strip()
        aluno.idade = int(payload.get('idade', aluno.idade))
        aluno.peso = float(payload.get('peso', aluno.peso))
        aluno.plano = payload.get('plano', aluno.plano)
        aluno.status = payload.get('status', aluno.status)
        aluno.pagamento = payload.get('pagamento', aluno.pagamento)

        db.session.commit()

        return jsonify(serialize_aluno_cadastro(aluno)), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao atualizar aluno: {str(error)}'}), 400


# ============================================================================
# 2. ROTA: Salvar Entrada Financeira (POST /api/finance/entries)
# ============================================================================
@app.route('/api/finance/entries', methods=['POST', 'OPTIONS'])
def criar_entrada_financeira():
    """Cria uma entrada de receita ou despesa no financeiro."""
    if request.method == 'OPTIONS':
        return ('', 204)

    payload = request.get_json(silent=True) or request.form.to_dict() or {}

    description = payload.get('description', '').strip()
    category = payload.get('category', '').strip()
    amount = float(payload.get('amount', 0))
    entry_type = payload.get('type', 'receita')  # 'receita' ou 'despesa'
    date_str = payload.get('date', datetime.now().isoformat().split('T')[0])

    if not description or not category or amount <= 0:
        return jsonify({'error': 'Informe descricao, valor e categoria validos.'}), 400

    # Validar tipo
    if entry_type not in ['receita', 'despesa']:
        return jsonify({'error': 'Tipo deve ser receita ou despesa.'}), 400

    try:
        # Aqui você pode opcionalmente salvar em um modelo de FinanceEntry
        # Por enquanto, apenas retornamos sucesso
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


# ============================================================================
# 3. ROTA: Gerenciar Férias de Professor (POST /api/cadastros/professores/{cpf}/vacation)
# ============================================================================
@app.route('/api/cadastros/professores/<cpf>/vacation', methods=['POST', 'OPTIONS'])
def processar_ferias_professor(cpf):
    """Processa solicitação de férias (aprova, reprova ou concede)."""
    if request.method == 'OPTIONS':
        return ('', 204)

    normalized_cpf = normalize_cpf(cpf)
    professor = ProfessorCadastro.query.filter_by(cpf=normalized_cpf).first()
    if not professor:
        return jsonify({'error': 'Professor nao encontrado.'}), 404

    payload = request.get_json(silent=True) or {}
    action = payload.get('action')  # 'aprovada', 'reprovada', 'realocada', 'concedida'
    start_date = payload.get('startDate')
    end_date = payload.get('endDate')

    if not action or action not in ['aprovada', 'reprovada', 'realocada', 'concedida']:
        return jsonify({'error': 'Acao invalida.'}), 400

    if not start_date or not end_date:
        return jsonify({'error': 'Informe data de inicio e fim.'}), 400

    try:
        # Atualizar status do professor se aprovado/concedido
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


# ============================================================================
# 4. ROTA: Registrar Pagamento de Mensalidade (POST /api/finance/payments)
# ============================================================================
@app.route('/api/finance/payments', methods=['POST', 'OPTIONS'])
def registrar_pagamento():
    """Registra um pagamento de mensalidade de aluno."""
    if request.method == 'OPTIONS':
        return ('', 204)

    payload = request.get_json(silent=True) or {}

    student_cpf = normalize_cpf(payload.get('studentCpf', ''))
    student_name = payload.get('studentName', '').strip()
    amount = float(payload.get('amount', 0))
    payment_date = payload.get('paymentDate', datetime.now().isoformat().split('T')[0])
    reference = payload.get('reference', datetime.now().isoformat().split('T')[0][:7])

    if not student_cpf or not student_name or amount <= 0:
        return jsonify({'error': 'Informe CPF, nome e valor do pagamento.'}), 400

    try:
        # Buscar aluno
        aluno = AlunoCadastro.query.filter_by(cpf=student_cpf).first()
        if not aluno:
            return jsonify({'error': 'Aluno nao encontrado.'}), 404

        # Criar recebimento
        recebimento = RecebimentoAluno(
            aluno_id=aluno.id,
            aluno_nome=aluno.nome,
            aluno_cpf=aluno.cpf,
            referencia=reference,
            descricao=f'Mensalidade {reference}',
            provider='manual',
            status='pago',
            valor=amount,
            vencimento=datetime.strptime(payment_date, '%Y-%m-%d').date(),
            pago_em=datetime.now(),
        )

        db.session.add(recebimento)

        # Atualizar status de pagamento do aluno
        aluno.pagamento = 'em-dia'
        aluno.ultimo_pagamento = payment_date
        aluno.status = 'ativo'

        db.session.commit()

        return jsonify({
            'id': recebimento.id,
            'message': 'Pagamento registrado com sucesso.',
            'student': serialize_aluno_cadastro(aluno),
        }), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'error': f'Falha ao registrar pagamento: {str(error)}'}), 400


# ============================================================================
# 5. HELPER: Versão melhorada de serialize_aluno_cadastro
# ============================================================================
# Certifique-se que sua função serialize_aluno_cadastro retorna todos esses campos:
def serialize_aluno_cadastro(aluno):
    """Serializa um objeto AlunoCadastro para JSON."""
    return {
        'id': aluno.id,
        'name': aluno.nome,
        'cpf': aluno.cpf,
        'phone': aluno.telefone,
        'email': aluno.email,
        'age': aluno.idade,
        'weight': f'{aluno.peso}kg',
        'plan': aluno.plano,
        'status': aluno.status,
        'payment': aluno.pagamento,
        'vencimento': aluno.vencimento,
        'lastPayment': aluno.ultimo_pagamento,
    }


def serialize_professor_cadastro(professor):
    """Serializa um objeto ProfessorCadastro para JSON."""
    return {
        'name': professor.nome,
        'cpf': professor.cpf,
        'speciality': professor.especialidade,
        'students': professor.alunos_ativos,
        'status': professor.status,
        'phone': professor.telefone,
        'email': professor.email,
        'horario': professor.horario,
        'salario': f'{professor.salario:.2f}',
        'modalidades': [professor.especialidade],
    }
