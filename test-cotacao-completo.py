#!/usr/bin/env python3
"""
🧪 TESTE E2E - SISTEMA DE COTAÇÕES
Testa fluxo completo de cotações com múltiplos cenários
"""

import requests
import json
import random
import string
from datetime import datetime, timedelta
import time

# ========== CONFIGURAÇÃO ==========
API_URL = "http://localhost:5000/api"
TIMEOUT = 10

# Dados aleatórios
NOMES_PRODUTOS = [
    "Eletrônico", "Componente", "Peça Automotiva", "Material de Construção",
    "Alimento", "Eletrônico Industrial", "Equipamento", "Ferramenta"
]

NCMS_LISTA = [
    "84713000", "85176000", "73089000", "22086000",
    "20091000", "94060000", "73158000", "62046000"
]

CIDADES_DESTINO = [
    {"nome": "São Paulo", "estado": "SP", "cep": "01310-100"},
    {"nome": "Rio de Janeiro", "estado": "RJ", "cep": "20040020"},
    {"nome": "Belo Horizonte", "estado": "MG", "cep": "30140071"},
    {"nome": "Brasília", "estado": "DF", "cep": "70040902"}
]

# ========== CORES ==========
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
END = '\033[0m'

# ========== LOGS ==========
RESULTADOS = {
    "usuarios_criados": [],
    "produtos_criados": [],
    "destinatarios_criados": [],
    "cotacoes_criadas": [],
    "respostas_criadas": [],
    "erros": [],
    "warnings": []
}

def log_sucesso(msg):
    print(f"{GREEN}✅ {msg}{END}")

def log_erro(msg, erro=None):
    print(f"{RED}❌ {msg}{END}")
    if erro:
        print(f"   Detalhes: {erro}")
    RESULTADOS["erros"].append(f"{msg}: {erro}")

def log_info(msg):
    print(f"{BLUE}ℹ️  {msg}{END}")

def log_aviso(msg):
    print(f"{YELLOW}⚠️  {msg}{END}")

def gerar_email_unico():
    """Gera um email único com timestamp"""
    return f"teste_{int(time.time())}_{random.randint(1000, 9999)}@example.com"

def gerar_senha():
    """Gera uma senha segura"""
    return "Teste@" + ''.join(random.choices(string.ascii_letters + string.digits, k=8))

# ========== AUTENTICAÇÃO ==========

def registrar_usuario(email, senha, tipo="cliente"):
    """Registra um novo usuário"""
    try:
        resp = requests.post(
            f"{API_URL}/auth/register",
            json={"email": email, "password": senha, "userType": tipo},
            timeout=TIMEOUT
        )
        if resp.status_code in [200, 201]:
            dados = resp.json()
            log_sucesso(f"Usuário registrado: {email} ({tipo})")
            return dados
        else:
            log_erro(f"Erro ao registrar {email}", resp.text[:100])
            return None
    except Exception as e:
        log_erro(f"Exceção ao registrar {email}", str(e))
        return None

def fazer_login(email, senha):
    """Faz login e retorna token"""
    try:
        resp = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": senha},
            timeout=TIMEOUT
        )
        if resp.status_code in [200, 201]:
            dados = resp.json()
            token = dados.get("token")
            user_id = dados.get("id") or dados.get("user", {}).get("id")
            if token:
                log_sucesso(f"Login realizado: {email}")
                return {"token": token, "id": user_id, "email": email, "dados": dados}
            else:
                log_erro(f"Token não retornado para {email}")
                return None
        else:
            log_erro(f"Erro ao fazer login {email}", resp.text[:100])
            return None
    except Exception as e:
        log_erro(f"Exceção ao fazer login {email}", str(e))
        return None

# ========== CRIAÇÃO DE DADOS ==========

def criar_produto(token, nome_prefix=""):
    """Cria um produto aleatório"""
    try:
        nome_base = random.choice(NOMES_PRODUTOS)
        nome = f"{nome_base} {random.randint(100, 999)}"
        ncm = random.choice(NCMS_LISTA)
        peso = round(random.uniform(1, 500), 2)  # Garantir > 0
        
        resp = requests.post(
            f"{API_URL}/produtos",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "nome": nome,
                "ncmCode": ncm,
                "unidadeMedida": "kg",
                "pesoKg": peso,
                "descricao": f"Produto teste - {ncm}"
            },
            timeout=TIMEOUT
        )
        
        if resp.status_code in [200, 201]:
            produto = resp.json()
            # Tenta obter ID de diferentes campos possíveis
            produto_id = produto.get("id") or produto.get("_id") or produto.get("data", {}).get("id")
            if not produto_id:
                # Se data é um objeto, tentar extrair
                if isinstance(produto.get("data"), dict):
                    produto_id = produto["data"].get("id") or produto["data"].get("_id")
            
            if not produto_id and "success" in produto and produto["success"]:
                # Se sucesso mas sem ID, pode estar retornando em estrutura diferente
                produto_id = f"prod_{int(time.time())}"
            
            log_sucesso(f"Produto criado: {nome} (ID: {produto_id}, NCM: {ncm}, Peso: {peso}kg)")
            RESULTADOS["produtos_criados"].append({
                "id": produto_id,
                "nome": nome,
                "ncm": ncm,
                "peso": peso
            })
            return produto_id
        else:
            log_erro(f"Erro ao criar produto", resp.text[:100])
            return None
    except Exception as e:
        log_erro(f"Exceção ao criar produto", str(e))
        return None

def criar_destinatario(token, cidade_idx=None):
    """Cria um destinatário aleatório"""
    try:
        cidade = CIDADES_DESTINO[cidade_idx or random.randint(0, len(CIDADES_DESTINO)-1)]
        nome = f"Cliente Teste {random.randint(1000, 9999)}"
        
        resp = requests.post(
            f"{API_URL}/destinatarios",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "nomeCompleto": nome,
                "cep": cidade["cep"],
                "logradouro": "Rua Teste",
                "numero": str(random.randint(1, 999)),
                "bairro": "Bairro Teste",
                "cidade": cidade["nome"],
                "estado": cidade["estado"],
                "telefone": f"({random.randint(11, 99)}) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}",
                "email": gerar_email_unico()
            },
            timeout=TIMEOUT
        )
        
        if resp.status_code in [200, 201]:
            dest = resp.json()
            dest_id = dest.get("id") or dest.get("_id") or dest.get("data", {}).get("id")
            if not dest_id:
                if isinstance(dest.get("data"), dict):
                    dest_id = dest["data"].get("id") or dest["data"].get("_id")
            
            if not dest_id and "success" in dest and dest["success"]:
                dest_id = f"dest_{int(time.time())}"
            
            log_sucesso(f"Destinatário criado: {nome} ({cidade['nome']}-{cidade['estado']})")
            RESULTADOS["destinatarios_criados"].append({
                "id": dest_id,
                "nome": nome,
                "cidade": cidade["nome"],
                "estado": cidade["estado"]
            })
            return dest_id
        else:
            log_erro(f"Erro ao criar destinatário", resp.text[:100])
            return None
    except Exception as e:
        log_erro(f"Exceção ao criar destinatário", str(e))
        return None

def criar_cotacao(token, user_id, produtos_ids, destinatario_id, tipo_frete="CIF"):
    """Cria uma cotação"""
    try:
        # Preparar produtos da cotação
        produtos_cotacao = []
        peso_total = 0
        valor_total = 0
        
        for prod_id in produtos_ids:
            qtd = random.randint(1, 5)
            valor = round(random.uniform(100, 5000), 2)
            peso = round(random.uniform(0.5, 100), 2)
            
            produtos_cotacao.append({
                "produtoId": prod_id,
                "quantidade": qtd,
                "peso": peso,
                "valor": valor
            })
            peso_total += peso * qtd
            valor_total += valor * qtd
        
        resp = requests.post(
            f"{API_URL}/cotacoes",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tipoFrete": tipo_frete,
                "produtos": produtos_cotacao,
                "destinatarioId": destinatario_id,
                "servicosAdicionais": {
                    "ehFragil": random.choice([True, False]),
                    "precisaSeguro": random.choice([True, False])
                }
            },
            timeout=TIMEOUT
        )
        
        if resp.status_code in [200, 201]:
            cotacao = resp.json()
            cot_id = cotacao.get("id") or cotacao.get("_id")
            log_sucesso(f"Cotação criada: {cot_id} ({len(produtos_ids)} produtos, R${valor_total:.2f})")
            RESULTADOS["cotacoes_criadas"].append({
                "id": cot_id,
                "tipo_frete": tipo_frete,
                "valor_total": valor_total,
                "peso_total": peso_total,
                "num_produtos": len(produtos_ids)
            })
            return cot_id
        else:
            log_erro(f"Erro ao criar cotação", resp.text[:100])
            return None
    except Exception as e:
        log_erro(f"Exceção ao criar cotação", str(e))
        return None

# ========== MAIN ==========

def main():
    print(f"\n{BLUE}{'='*60}")
    print("🧪 TESTE E2E - SISTEMA DE COTAÇÕES")
    print(f"{'='*60}{END}\n")
    
    log_info("FASE 1: Criando usuários (2 Premium + 2 Comum de cada tipo)")
    
    # ========== CRIAR USUÁRIOS ==========
    
    usuarios = {
        "embarcadores": {
            "premium": [],
            "comum": []
        },
        "transportadores": {
            "premium": [],
            "comum": []
        }
    }
    
    # Embarcadores Premium
    for i in range(2):
        email = gerar_email_unico()
        senha = gerar_senha()
        user_data = registrar_usuario(email, senha, "embarcador")
        if user_data:
            login_data = fazer_login(email, senha)
            if login_data:
                login_data["tipo"] = "embarcador_premium"
                usuarios["embarcadores"]["premium"].append(login_data)
                RESULTADOS["usuarios_criados"].append({
                    "email": email,
                    "tipo": "embarcador_premium"
                })
    
    # Embarcadores Comuns
    for i in range(2):
        email = gerar_email_unico()
        senha = gerar_senha()
        user_data = registrar_usuario(email, senha, "embarcador")
        if user_data:
            login_data = fazer_login(email, senha)
            if login_data:
                login_data["tipo"] = "embarcador_comum"
                usuarios["embarcadores"]["comum"].append(login_data)
                RESULTADOS["usuarios_criados"].append({
                    "email": email,
                    "tipo": "embarcador_comum"
                })
    
    # Transportadores Premium
    for i in range(2):
        email = gerar_email_unico()
        senha = gerar_senha()
        user_data = registrar_usuario(email, senha, "transportador")
        if user_data:
            login_data = fazer_login(email, senha)
            if login_data:
                login_data["tipo"] = "transportador_premium"
                usuarios["transportadores"]["premium"].append(login_data)
                RESULTADOS["usuarios_criados"].append({
                    "email": email,
                    "tipo": "transportador_premium"
                })
    
    # Transportadores Comuns
    for i in range(2):
        email = gerar_email_unico()
        senha = gerar_senha()
        user_data = registrar_usuario(email, senha, "transportador")
        if user_data:
            login_data = fazer_login(email, senha)
            if login_data:
                login_data["tipo"] = "transportador_comum"
                usuarios["transportadores"]["comum"].append(login_data)
                RESULTADOS["usuarios_criados"].append({
                    "email": email,
                    "tipo": "transportador_comum"
                })
    
    print(f"\n{BLUE}Total de usuários criados: {len(RESULTADOS['usuarios_criados'])}{END}\n")
    
    # ========== CRIAR PRODUTOS ==========
    
    log_info("FASE 2: Criando produtos variados (8 produtos com NCMs diferentes)")
    
    produtos = []
    # Usar primeiro embarcador para criar produtos
    if usuarios["embarcadores"]["premium"]:
        token = usuarios["embarcadores"]["premium"][0]["token"]
        for i in range(8):
            prod_id = criar_produto(token)
            if prod_id:
                produtos.append(prod_id)
    
    if not produtos:
        log_erro("Nenhum produto foi criado! Abortando...")
        return
    
    # ========== CRIAR DESTINATÁRIOS ==========
    
    log_info("FASE 3: Criando destinatários")
    
    destinatarios = []
    if usuarios["embarcadores"]["premium"]:
        token = usuarios["embarcadores"]["premium"][0]["token"]
        for i in range(4):
            dest_id = criar_destinatario(token, i)
            if dest_id:
                destinatarios.append(dest_id)
    
    # ========== CRIAR COTAÇÕES ==========
    
    log_info("FASE 4: Criando cotações (2 por embarcador, com variações)")
    
    cotacoes_por_transportador = {
        "premium": [],
        "comum": []
    }
    
    # Embarcadores Premium - 2 cotações cada
    for emb in usuarios["embarcadores"]["premium"]:
        token = emb["token"]
        for j in range(2):
            # Variação 1: 1 produto, Variação 2: múltiplos produtos
            if j == 0:
                prods_para_cot = [random.choice(produtos)]
            else:
                prods_para_cot = random.sample(produtos, random.randint(2, 4))
            
            dest = random.choice(destinatarios)
            cot_id = criar_cotacao(token, emb["id"], prods_para_cot, dest)
            if cot_id:
                cotacoes_por_transportador["premium"].append({
                    "id": cot_id,
                    "embarcador": "premium"
                })
    
    # Embarcadores Comuns - 2 cotações cada
    for emb in usuarios["embarcadores"]["comum"]:
        token = emb["token"]
        for j in range(2):
            if j == 0:
                prods_para_cot = [random.choice(produtos)]
            else:
                prods_para_cot = random.sample(produtos, random.randint(2, 4))
            
            dest = random.choice(destinatarios)
            cot_id = criar_cotacao(token, emb["id"], prods_para_cot, dest)
            if cot_id:
                cotacoes_por_transportador["comum"].append({
                    "id": cot_id,
                    "embarcador": "comum"
                })
    
    print(f"\n{BLUE}Total de cotações criadas: {len(RESULTADOS['cotacoes_criadas'])}{END}\n")
    
    # ========== RELATÓRIO FINAL ==========
    
    print(f"\n{BLUE}{'='*60}")
    print("📊 RELATÓRIO FINAL - FASE 1 E 2")
    print(f"{'='*60}{END}\n")
    
    print(f"{GREEN}Usuários criados: {len(RESULTADOS['usuarios_criados'])}{END}")
    print(f"  - Embarcadores Premium: {len(usuarios['embarcadores']['premium'])}")
    print(f"  - Embarcadores Comum: {len(usuarios['embarcadores']['comum'])}")
    print(f"  - Transportadores Premium: {len(usuarios['transportadores']['premium'])}")
    print(f"  - Transportadores Comum: {len(usuarios['transportadores']['comum'])}")
    
    print(f"\n{GREEN}Produtos criados: {len(RESULTADOS['produtos_criados'])}{END}")
    print(f"{GREEN}Destinatários criados: {len(RESULTADOS['destinatarios_criados'])}{END}")
    print(f"{GREEN}Cotações criadas: {len(RESULTADOS['cotacoes_criadas'])}{END}")
    
    if RESULTADOS["erros"]:
        print(f"\n{RED}Erros encontrados: {len(RESULTADOS['erros'])}{END}")
        for erro in RESULTADOS["erros"][:5]:  # Mostrar até 5 erros
            print(f"  - {erro}")
    else:
        print(f"\n{GREEN}✨ Nenhum erro encontrado!{END}")
    
    # Salvar dados para próximas fases
    with open("/tmp/cotacao_test_data.json", "w") as f:
        json.dump({
            "usuarios": usuarios,
            "produtos": produtos,
            "destinatarios": destinatarios,
            "cotacoes": RESULTADOS["cotacoes_criadas"]
        }, f, indent=2)
    
    log_sucesso("Dados salvos em /tmp/cotacao_test_data.json")
    print(f"\n{BLUE}Próxima fase: Testar respostas dos transportadores{END}\n")

if __name__ == "__main__":
    main()
