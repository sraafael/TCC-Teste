from functools import wraps
from flask import request, jsonify, g, current_app

try:
    from pydantic import ValidationError
except Exception:
    ValidationError = None


def get_request_data():
    return request.get_json(silent=True) or request.form.to_dict() or {}


def validation_error_response(error):
    if ValidationError and isinstance(error, ValidationError):
        return jsonify({'errors': error.errors()}), 400
    return jsonify({'error': 'Invalid request payload.'}), 400


def validate_request(schema_model, methods=('POST', 'PUT'), partial=False):
    """Decorator to validate incoming JSON/form payloads using a Pydantic schema.

    - `schema_model`: Pydantic BaseModel class
    - `methods`: tuple of HTTP methods where validation should run
    - `partial`: when True, the validator will allow missing fields (use for PATCH/PUT partial updates)
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method not in methods:
                return fn(*args, **kwargs)

            data = get_request_data()

            try:
                validated = schema_model(**data)
                g.validated_data = validated.dict(exclude_unset=partial)
            except Exception as exc:
                current_app.logger.exception('Validation failure: %s', exc)
                return validation_error_response(exc)

            return fn(*args, **kwargs)

        return wrapper

    return decorator
