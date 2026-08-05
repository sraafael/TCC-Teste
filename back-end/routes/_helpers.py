from flask import g, request


def get_request_payload(*, prefer_form=False, use_validated_data=False):
    if use_validated_data:
        validated_data = getattr(g, 'validated_data', None)
        if validated_data:
            return validated_data

    json_payload = request.get_json(silent=True) or {}
    form_payload = request.form.to_dict() or {}
    return (form_payload or json_payload) if prefer_form else (json_payload or form_payload)


def get_pagination_arguments(default_page=1, default_per_page=20):
    try:
        return int(request.args.get('page', default_page)), int(request.args.get('limit', default_per_page))
    except (TypeError, ValueError):
        return default_page, default_per_page


def serialize_pagination(pagination):
    return {
        'total': pagination.total,
        'pages': pagination.pages,
        'page': pagination.page,
        'per_page': pagination.per_page,
    }
