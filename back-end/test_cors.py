#!/usr/bin/env python3
"""
Script de teste para validar configuracao CORS
Execute: python test_cors.py
"""

import os
import sys

def test_imports():
    """Testa se todos os imports necessarios funcionam."""
    print("🔍 Testando imports...")
    try:
        import flask
        print(f"  ✅ Flask {flask.__version__}")
        
        import flask_cors
        print(f"  ✅ Flask-CORS") 
        
        import flask_sqlalchemy
        print(f"  ✅ Flask-SQLAlchemy")
        
        import dotenv
        print(f"  ✅ python-dotenv")
        
        return True
    except ImportError as e:
        print(f"  ❌ Erro: {e}")
        print("\n💡 Execute: pip install -r requirements.txt")
        return False

def test_app_syntax():
    """Testa se o app.py tem sintaxe correta."""
    print("\n🔍 Testando sintaxe de app.py...")
    try:
        import py_compile
        py_compile.compile('app.py', doraise=True)
        print("  ✅ app.py tem sintaxe correta")
        return True
    except py_compile.PyCompileError as e:
        print(f"  ❌ Erro de sintaxe: {e}")
        return False

def test_cors_config():
    """Verifica se CORS esta configurado."""
    print("\n🔍 Testando configuracao CORS...")
    try:
        with open('app.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ("from flask_cors import CORS", "Import CORS"),
            ("CORS(", "Inicializacao CORS"),
            ("'origins':", "Configuracao de origins"),
            ("'http://localhost:3000'", "Origin localhost:3000"),
            ("'methods':", "Configuracao de methods"),
            ("'supports_credentials': True", "Credentials habilitado"),
        ]
        
        all_ok = True
        for pattern, desc in checks:
            if pattern in content:
                print(f"  ✅ {desc}")
            else:
                print(f"  ❌ {desc} - Padrão não encontrado: {pattern}")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False

def test_no_manual_cors():
    """Verifica se foi removido CORS manual."""
    print("\n🔍 Verificando limpeza de CORS manual...")
    try:
        with open('app.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        issues = [
            ("def add_cors_headers", "Função manual add_cors_headers"),
            ("@app.after_request\ndef add_cors_headers", "Decorator @app.after_request com add_cors_headers"),
            ("ALLOWED_ORIGINS = [", "Variável ALLOWED_ORIGINS"),
        ]
        
        all_ok = True
        for pattern, desc in issues:
            if pattern not in content:
                print(f"  ✅ {desc} removido")
            else:
                print(f"  ⚠️  {desc} ainda presente")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False

def test_initialize_function():
    """Verifica se funcao initialize_app existe."""
    print("\n🔍 Testando funcao initialize_app()...")
    try:
        with open('app.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "def initialize_app():" in content:
            print("  ✅ Funcao initialize_app() existe")
            
            if "if __name__ == '__main__':" in content and "initialize_app()" in content:
                print("  ✅ initialize_app() eh chamada no main")
                return True
            else:
                print("  ❌ initialize_app() nao eh chamada no main")
                return False
        else:
            print("  ❌ Funcao initialize_app() nao encontrada")
            return False
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 TESTE DE CONFIGURACAO FLASK-CORS")
    print("=" * 60)
    
    results = {
        "Imports": test_imports(),
        "Sintaxe": test_app_syntax(),
        "CORS Configurado": test_cors_config(),
        "CORS Manual Removido": test_no_manual_cors(),
        "Initialize Function": test_initialize_function(),
    }
    
    print("\n" + "=" * 60)
    print("📊 RESULTADO FINAL")
    print("=" * 60)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    print(f"\n{passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🚀 Tudo esta configurado corretamente!")
        print("Execute 'python app.py' para iniciar o servidor")
        return 0
    else:
        print("\n⚠️  Alguns testes falharam. Verifique os erros acima.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
