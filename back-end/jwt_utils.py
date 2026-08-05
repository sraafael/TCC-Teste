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

SECRET = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY', 'fitpro-dev-key')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_EXPIRES = int(os.getenv('JWT_ACCESS_EXPIRES', '3600'))


def get_bearer_token(authorization_header):
    if not authorization_header:
        return None

    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    return parts[1]


def create_access_token(identity: dict, expires_delta: int | None = None) -> str:
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

    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorization_header = request.headers.get('Authorization')
        if not authorization_header:
            return jsonify({'error': 'Authorization header missing'}), 401

        token = get_bearer_token(authorization_header)
        if not token:
            return jsonify({'error': 'Invalid authorization header.'}), 401

        try:
            g.jwt_payload = decode_access_token(token)
        except ExpiredSignatureError:
            return jsonify({'error': 'Token expirado.'}), 401
        except InvalidTokenError:
            return jsonify({'error': 'Token invalido.'}), 401
        except Exception:
            return jsonify({'error': 'Token invalido.'}), 401

        return fn(*args, **kwargs)

    return wrapper
