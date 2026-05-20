def register_blueprints(app):
    from .auth import auth_bp
    from .alunos import alunos_bp
    from .professores import professores_bp
    from .planos import planos_bp
    from .agenda import agenda_bp
    from .finance import finance_bp
    from .dashboard import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(alunos_bp)
    app.register_blueprint(professores_bp)
    app.register_blueprint(planos_bp)
    app.register_blueprint(agenda_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(dashboard_bp)
