def register_blueprints(app):
    from .auth import auth_bp
    from .alunos import alunos_bp
    from .professores import professores_bp
    from .planos import planos_bp
    from .agenda import agenda_bp
    from .finance import finance_bp
    from .dashboard import dashboard_bp

    blueprints = (
        auth_bp,
        alunos_bp,
        professores_bp,
        planos_bp,
        agenda_bp,
        finance_bp,
        dashboard_bp,
    )

    for blueprint in blueprints:
        app.register_blueprint(blueprint)
