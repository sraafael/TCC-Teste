import os
from datetime import datetime, timedelta
from functools import wraps

from flask import request, jsonify, g

try:
    import jwt
    from jwt import ExpiredSignatureError, InvalidTokenError
except Exception:
    jwt = None
    class ExpiredSignatureError(Exception):
        pass
    class InvalidTokenError(Exception):
        pass

# TODO: REFACTOR - A configuração de JWT está acoplada a valores globais de ambiente e fallback local, o que pode mascarar políticas distintas por ambiente.
# Config
SECRET = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY', 'fitpro-dev-key')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_EXPIRES = int(os.getenv('JWT_ACCESS_EXPIRES', '3600'))  # seconds


def create_access_token(identity: dict, expires_delta: int | None = None) -> str:
    # TODO: REFACTOR - A identidade do usuário é codificada diretamente no token sem uma estratégia explícita de claims e escopo.
    """Cria um JWT com `identity` embutido e claim `exp`.

    identity: dicionario com identificadores (ex: {'cpf': '...','role':'admin'})
    expires_delta: segundos de validade (fallback para ACCESS_EXPIRES)
    """
    if jwt is None:
        raise RuntimeError('PyJWT nao esta instalado')

    now = datetime.utcnow()
    exp = now + timedelta(seconds=(expires_delta or ACCESS_EXPIRES))
    payload = {
        'exp': exp,
        'iat': now,
        'sub': identity.get('cpf') or identity.get('id'),
        'identity': identity,
    }
    token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def decode_access_token(token: str) -> dict:
    if jwt is None:
        raise RuntimeError('PyJWT nao esta instalado')
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])


def jwt_required(fn):
    """Decorator simples para validar Authorization: Bearer <token> e expirar token."""
    # TODO: REFACTOR - O decorator mistura autenticação, resposta HTTP e tratamento de erro em um só ponto, dificultando composição com outras políticas.

    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth:
            return jsonify({'error': 'Authorization header missing'}), 401

        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header.'}), 401

        token = parts[1]
        try:
            payload = decode_access_token(token)
            g.jwt_payload = payload
            return fn(*args, **kwargs)
        except ExpiredSignatureError:
            return jsonify({'error': 'Token expirado.'}), 401
        except InvalidTokenError:
            return jsonify({'error': 'Token invalido.'}), 401
        except Exception:
            return jsonify({'error': 'Token invalido.'}), 401

    return wrapper
