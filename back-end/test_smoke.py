# Quick smoke test for API endpoints
from app import app

client = app.test_client()

paths = ['/', '/lista-alunos', '/api/health', '/api/stats']
for p in paths:
    resp = client.get(p)
    try:
        body = resp.get_json()
    except Exception:
        body = resp.get_data(as_text=True)
    print(p, resp.status_code, body)
