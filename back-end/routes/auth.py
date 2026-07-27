from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

import utils
from jwt_utils import create_access_token, ACCESS_EXPIRES
from models import Usuario
from extensions import db
from validators import validate_request
from schemas import ForgotPasswordSchema, LoginSchema, ResetPasswordSchema

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
@validate_request(ForgotPasswordSchema, methods=('POST',))
def forgot_password():
    // TODO: REFACTOR - O fluxo de recuperação de senha combina validação, persistência, envio por múltiplos canais e resposta em uma única função.
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or {}
    cpf = utils.normalize_cpf(payload.get('cpf'))
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido. Informe 11 digitos.'}), 400

    query = Usuario.query.filter_by(cpf=cpf)
    if role:
        query = query.filter_by(role=role)

    user = query.first()
    if not user:
        return jsonify({'error': 'Nenhum usuario encontrado para este CPF.'}), 404

    reset_code = utils.generate_reset_code()
    user.reset_code_hash = generate_password_hash(reset_code)
    user.reset_code_expires_at = datetime.now() + timedelta(minutes=utils.RESET_CODE_EXPIRATION_MINUTES)
    user.reset_code_used = False
    db.session.commit()

    email_ok, email_msg = utils.send_reset_email(user.email, reset_code)
    whatsapp_ok, whatsapp_msg = utils.send_reset_whatsapp(user.whatsapp, reset_code)

    if email_ok and whatsapp_ok:
        return jsonify(
            {
                'message': 'Codigo enviado por e-mail e WhatsApp.',
                'expires_in_minutes': utils.RESET_CODE_EXPIRATION_MINUTES,
                'email': utils.mask_email(user.email),
                'whatsapp': utils.mask_phone(user.whatsapp),
            }
        )

    return jsonify(
        {
            'error': 'Nao foi possivel enviar o codigo em todos os canais.',
            'details': {'email': email_msg, 'whatsapp': whatsapp_msg},
        }
    ), 502


@auth_bp.route('/api/auth/login', methods=['POST'])
@validate_request(LoginSchema, methods=('POST',))
def auth_login():
    // TODO: REFACTOR - O login concentra autenticação, normalização de CPF, geração de token e montagem de resposta em um único ponto.
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or {}
    cpf = utils.normalize_cpf(payload.get('cpf'))
    password = str(payload.get('password') or '')
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido. Informe 11 digitos.'}), 400
    if not password:
        return jsonify({'error': 'Senha obrigatoria.'}), 400

    user = utils.get_user_for_login(cpf, role)

    if not user or not check_password_hash(user.senha_hash, password):
        return jsonify({'error': 'CPF ou senha invalidos.'}), 401

    # Gera JWT de acesso com expiracao
    token = create_access_token({'cpf': user.cpf, 'role': user.role, 'nome': user.nome})

    return jsonify(
        {
            'message': 'Login realizado com sucesso.',
            'user': {
                'nome': user.nome,
                'cpf': utils.format_cpf(user.cpf),
                'role': user.role,
                'email': utils.mask_email(user.email),
                'whatsapp': utils.mask_phone(user.whatsapp),
            },
            'access_token': token,
            'expires_in': ACCESS_EXPIRES,
        }
    )


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
@validate_request(ResetPasswordSchema, methods=('POST',))
def reset_password():
    // TODO: REFACTOR - A redefinição de senha mistura validação de código, expiração e atualização de senha com o fluxo HTTP.
    from flask import g
    payload = getattr(g, 'validated_data', None) or request.get_json(silent=True) or {}
    cpf = utils.normalize_cpf(payload.get('cpf'))
    code = str(payload.get('code') or '').strip()
    new_password = str(payload.get('new_password') or '')
    role = (payload.get('role') or '').strip().lower()

    if len(cpf) != 11:
        return jsonify({'error': 'CPF invalido.'}), 400
    if len(code) != 6 or not code.isdigit():
        return jsonify({'error': 'Codigo invalido. Use 6 digitos.'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'A nova senha precisa ter ao menos 6 caracteres.'}), 400

    query = Usuario.query.filter_by(cpf=cpf)
    if role:
        query = query.filter_by(role=role)
    user = query.first()

    if not user:
        return jsonify({'error': 'Usuario nao encontrado.'}), 404

    if (
        not user.reset_code_hash
        or user.reset_code_used
        or not user.reset_code_expires_at
        or user.reset_code_expires_at < datetime.now()
    ):
        return jsonify({'error': 'Codigo expirado ou inexistente. Solicite um novo codigo.'}), 400

    if not check_password_hash(user.reset_code_hash, code):
        return jsonify({'error': 'Codigo invalido.'}), 400

    user.senha_hash = generate_password_hash(new_password)
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    user.reset_code_used = True
    db.session.commit()

    return jsonify({'message': 'Senha atualizada com sucesso.'})
