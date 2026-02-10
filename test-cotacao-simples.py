#!/usr/bin/env python3
"""
Teste E2E simplificado para Cotação
"""
import requests
import json
import datetime
import random

API_BASE = "http://localhost:5000/api"

# Dados de teste
USUARIOS = [
    {"email": "emb_premium1@test.com", "senha": "Test@123", "tipo": "embarcador", "premium": True},
    {"email": "emb_comum1@test.com", "senha": "Test@123", "tipo": "embarcador", "premium": False},
    {"email": "transp_premium1@test.com", "senha": "Test@123", "tipo": "transportador", "premium": True},
    {"email": "transp_comum1@test.com", "senha": "Test@123", "tipo": "transportador", "premium": False},
]

def log_ok(msg):
    print(f"  ✅ {msg}")

def log_erro(msg):
    print(f"  ❌ {msg}")

def registrar_usuario(email, senha, tipo):
    """Registrar usuário"""
    try:
        resp = requests.post(
            f"{API_BASE}/auth/register",
            json={"email": email, "password": senha, "userType": tipo},
            timeout=10
        )
        if resp.status_code == 201:
            user_id = resp.json().get("user", {}).get("id")
            log_ok(f"Usuário {tipo}: {email} -> ID: {user_id}")
            return user_id
        else:
            log_erro(f"Erro ao registrar {email}: {resp.text}")
            return None
    except Exception as e:
        log_erro(f"Erro: {e}")
        return None

def fazer_login(email, senha):
    """Fazer login"""
    try:
        resp = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": email, "password": senha},
            timeout=10
        )
        if resp.status_code == 200:
            token = resp.json().get("token")
            user_id = resp.json().get("user", {}).get("id")
            log_ok(f"Login {email} -> Token OK")
            return {"token": token, "user_id": user_id}
        else:
            log_erro(f"Erro login {email}: {resp.text}")
            return None
    except Exception as e:
        log_erro(f"Erro: {e}")
        return None

def criar_cotacao(token, titulo, cep_coleta, cep_entrega):
    """Criar cotação com formato correto"""
    try:
        hoje = datetime.datetime.now()
        data_coleta = (hoje + datetime.timedelta(days=1)).isoformat()
        data_entrega = (hoje + datetime.timedelta(days=3)).isoformat()
        
        payload = {
            "titulo": titulo,
            "descricao": f"Teste automático {hoje.isoformat()}",
            "cepColeta": cep_coleta,
            "enderecoColeta": f"Rua {random.randint(1, 1000)}, São Paulo, SP",
            "dataColeta": data_coleta,
            "cepEntrega": cep_entrega,
            "enderecoEntrega": f"Rua {random.randint(1, 1000)}, Rio de Janeiro, RJ",
            "dataEntrega": data_entrega,
            "peso": round(random.uniform(10, 100), 2),
            "altura": round(random.uniform(10, 50), 2),
            "largura": round(random.uniform(10, 50), 2),
            "profundidade": round(random.uniform(10, 50), 2),
            "valorEstimado": round(random.uniform(500, 2000), 2)
        }
        
        print(f"\n  📦 Criando cotação: {titulo}")
        print(f"     CEP Coleta: {cep_coleta} -> CEP Entrega: {cep_entrega}")
        
        resp = requests.post(
            f"{API_BASE}/cotacoes",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if resp.status_code == 201:
            cotacao_id = resp.json().get("cotacao", {}).get("id")
            log_ok(f"Cotação criada: {cotacao_id}")
            return cotacao_id
        else:
            log_erro(f"Status {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        log_erro(f"Erro: {e}")
        return None

def main():
    print("🚀 TESTE E2E - COTAÇÃO SIMPLIFICADO\n")
    
    # Limpar dados anteriores
    print("📝 Fase 1: Registrar usuários")
    usuarios_auth = {}
    for user_data in USUARIOS:
        user_id = registrar_usuario(user_data["email"], user_data["senha"], user_data["tipo"])
        if user_id:
            auth_data = fazer_login(user_data["email"], user_data["senha"])
            if auth_data:
                usuarios_auth[user_data["email"]] = auth_data
    
    print(f"\n✅ Total {len(usuarios_auth)} usuários autenticados\n")
    
    # Criar cotações
    print("📦 Fase 2: Criar cotações")
    cotacoes = []
    
    # Embarcador Premium cria 2 cotações
    if "emb_premium1@test.com" in usuarios_auth:
        token = usuarios_auth["emb_premium1@test.com"]["token"]
        
        cot1 = criar_cotacao(token, "Cotação Premium 1", "01310100", "20040020")
        if cot1:
            cotacoes.append(cot1)
        
        cot2 = criar_cotacao(token, "Cotação Premium 2", "05418000", "30130010")
        if cot2:
            cotacoes.append(cot2)
    
    # Embarcador Comum cria 2 cotações
    if "emb_comum1@test.com" in usuarios_auth:
        token = usuarios_auth["emb_comum1@test.com"]["token"]
        
        cot3 = criar_cotacao(token, "Cotação Comum 1", "02310140", "40010020")
        if cot3:
            cotacoes.append(cot3)
        
        cot4 = criar_cotacao(token, "Cotação Comum 2", "06310300", "35010000")
        if cot4:
            cotacoes.append(cot4)
    
    print(f"\n✅ Total {len(cotacoes)} cotações criadas\n")
    
    # Salvar dados
    dados_teste = {
        "usuarios": usuarios_auth,
        "cotacoes": cotacoes,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    with open("/tmp/cotacao_test_v2.json", "w") as f:
        json.dump(dados_teste, f, indent=2)
    
    print(f"💾 Dados salvos em /tmp/cotacao_test_v2.json")
    print(f"\n📊 RESUMO:")
    print(f"   Usuários autenticados: {len(usuarios_auth)}")
    print(f"   Cotações criadas: {len(cotacoes)}")

if __name__ == "__main__":
    main()
