from functools import wraps
from flask import request, jsonify, g, current_app

try:
    from pydantic import ValidationError
except Exception:
    ValidationError = None


def validate_request(schema_model, methods=('POST', 'PUT'), partial=False):
    """Decorator to validate incoming JSON/form payloads using a Pydantic schema.

    - `schema_model`: Pydantic BaseModel class
    - `methods`: tuple of HTTP methods where validation should run
    - `partial`: when True, the validator will allow missing fields (use for PATCH/PUT partial updates)
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Only validate for specified methods
            if request.method not in methods:
                return fn(*args, **kwargs)

            data = request.get_json(silent=True)
            if data is None:
                data = request.form.to_dict() or {}

            try:
                # For partial updates, accept missing fields (pydantic will still validate provided ones)
                validated = schema_model(**data)
                # Store validated dict on flask.g for handlers to consume
                g.validated_data = validated.dict(exclude_unset=partial)
            except Exception as exc:
                # If pydantic is available and the error is a ValidationError, return details
                if ValidationError and isinstance(exc, ValidationError):
                    return jsonify({'errors': exc.errors()}), 400

                # Unexpected error during validation
                current_app.logger.exception('Validation failure: %s', exc)
                return jsonify({'error': 'Invalid request payload.'}), 400

            return fn(*args, **kwargs)

        return wrapper

    return decorator
