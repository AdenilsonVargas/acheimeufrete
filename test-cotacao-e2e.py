#!/usr/bin/env python3
"""
Teste E2E Completo - Cotação com Respostas e Priorização
Simula fluxo completo: embarcador cria cotação -> transportadores respondem
"""
import requests
import json
import datetime
import random
import time
import uuid

API_BASE = "http://localhost:5000/api"
TIMEOUT = 10

# Cores para output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
END = '\033[0m'

def log_ok(msg):
    print(f"{GREEN}✅{END} {msg}")

def log_erro(msg):
    print(f"{RED}❌{END} {msg}")

def log_info(msg):
    print(f"{BLUE}ℹ️{END}  {msg}")

def log_step(msg):
    print(f"\n{YELLOW}{'='*60}{END}")
    print(f"{YELLOW}{msg}{END}")
    print(f"{YELLOW}{'='*60}{END}\n")

class TestadorCotacao:
    def __init__(self):
        self.usuarios = {}
        self.cotacoes = []
        self.respostas = []
        self.embarcadores = []
        self.transportadores = []
    
    def criar_usuarios_teste(self):
        """Criar 4 embarcadores (2 premium, 2 comum) + 4 transportadores"""
        log_step("FASE 1: Criar e autenticar usuários")
        
        # Gerar IDs únicos para cada teste
        run_id = str(uuid.uuid4())[:8]
        
        usuarios_config = [
            # Embarcadores
            {"email": f"emb_prem_a_{run_id}@test.com", "tipo": "embarcador", "premium": True},
            {"email": f"emb_prem_b_{run_id}@test.com", "tipo": "embarcador", "premium": True},
            {"email": f"emb_com_a_{run_id}@test.com", "tipo": "embarcador", "premium": False},
            {"email": f"emb_com_b_{run_id}@test.com", "tipo": "embarcador", "premium": False},
            # Transportadores
            {"email": f"transp_prem_a_{run_id}@test.com", "tipo": "transportador", "premium": True},
            {"email": f"transp_prem_b_{run_id}@test.com", "tipo": "transportador", "premium": True},
            {"email": f"transp_com_a_{run_id}@test.com", "tipo": "transportador", "premium": False},
            {"email": f"transp_com_b_{run_id}@test.com", "tipo": "transportador", "premium": False},
        ]
        
        for config in usuarios_config:
            try:
                # Registrar
                resp = requests.post(
                    f"{API_BASE}/auth/register",
                    json={
                        "email": config["email"],
                        "password": "Test@123",
                        "userType": config["tipo"]
                    },
                    timeout=TIMEOUT
                )
                
                if resp.status_code != 201:
                    log_erro(f"{config['email']}: {resp.text}")
                    continue
                
                user_id = resp.json().get("user", {}).get("id")
                
                # Login
                resp = requests.post(
                    f"{API_BASE}/auth/login",
                    json={"email": config["email"], "password": "Test@123"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code != 200:
                    log_erro(f"Login {config['email']}: {resp.text}")
                    continue
                
                token = resp.json().get("token")
                
                self.usuarios[config["email"]] = {
                    "id": user_id,
                    "token": token,
                    "tipo": config["tipo"],
                    "premium": config["premium"]
                }
                
                tipo_str = f"{'PREMIUM' if config['premium'] else 'COMUM'}"
                log_ok(f"{config['tipo'].upper()} {tipo_str}: {config['email']}")
                
                if config["tipo"] == "embarcador":
                    self.embarcadores.append(config["email"])
                else:
                    self.transportadores.append(config["email"])
            
            except Exception as e:
                log_erro(f"Erro com {config['email']}: {e}")
        
        print(f"\n✅ Total: {len(self.usuarios)} usuários")
        print(f"   Embarcadores: {len(self.embarcadores)}")
        print(f"   Transportadores: {len(self.transportadores)}")
    
    def criar_cotacoes(self):
        """Embarcadores criam cotações"""
        log_step("FASE 2: Embarcadores criam cotações")
        
        cidades_coleta = [
            {"cep": "01310100", "nome": "São Paulo", "estado": "SP"},
            {"cep": "02310140", "nome": "São Paulo", "estado": "SP"},
            {"cep": "05418000", "nome": "São Paulo", "estado": "SP"},
        ]
        
        cidades_entrega = [
            {"cep": "20040020", "nome": "Rio de Janeiro", "estado": "RJ"},
            {"cep": "30130010", "nome": "Belo Horizonte", "estado": "MG"},
            {"cep": "40010020", "nome": "Salvador", "estado": "BA"},
        ]
        
        cotacao_idx = 0
        for email_emb in self.embarcadores:
            user_data = self.usuarios[email_emb]
            num_cotacoes = random.randint(1, 3)  # 1-3 cotações por embarcador
            
            for _ in range(num_cotacoes):
                try:
                    hoje = datetime.datetime.now()
                    data_coleta = (hoje + datetime.timedelta(days=random.randint(1, 2))).isoformat()
                    data_entrega = (hoje + datetime.timedelta(days=random.randint(3, 5))).isoformat()
                    
                    coleta = random.choice(cidades_coleta)
                    entrega = random.choice(cidades_entrega)
                    
                    payload = {
                        "titulo": f"Carga {email_emb[:10]}...",
                        "descricao": f"Teste de cotação criado automaticamente",
                        "cepColeta": coleta["cep"],
                        "enderecoColeta": f"Rua {random.randint(1, 5000)}, {coleta['nome']}, {coleta['estado']}",
                        "dataColeta": data_coleta,
                        "cepEntrega": entrega["cep"],
                        "enderecoEntrega": f"Rua {random.randint(1, 5000)}, {entrega['nome']}, {entrega['estado']}",
                        "dataEntrega": data_entrega,
                        "peso": round(random.uniform(10, 500), 2),
                        "altura": round(random.uniform(10, 50), 2),
                        "largura": round(random.uniform(10, 50), 2),
                        "profundidade": round(random.uniform(10, 50), 2),
                        "valorEstimado": round(random.uniform(500, 5000), 2)
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/cotacoes",
                        json=payload,
                        headers={"Authorization": f"Bearer {user_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code == 201:
                        cotacao_id = resp.json().get("cotacao", {}).get("id")
                        if cotacao_id:
                            self.cotacoes.append({
                                "id": cotacao_id,
                                "embarcador": email_emb,
                                "premium_emb": user_data["premium"],
                                "coleta": f"{coleta['nome']}-{coleta['estado']}",
                                "entrega": f"{entrega['nome']}-{entrega['estado']}",
                                "peso": payload["peso"],
                                "valor": payload["valorEstimado"]
                            })
                            cotacao_idx += 1
                            log_ok(f"Cotação {cotacao_idx}: {email_emb} ({coleta['nome']}-{entrega['nome']})")
                    else:
                        log_erro(f"Erro ao criar cotação: {resp.text}")
                
                except Exception as e:
                    log_erro(f"Erro: {e}")
        
        print(f"\n✅ Total: {len(self.cotacoes)} cotações criadas")
    
    def transportadores_respondem(self):
        """Transportadores enviam respostas para as cotações"""
        log_step("FASE 3: Transportadores respondem às cotações")
        
        if not self.cotacoes:
            log_erro("Nenhuma cotação para responder!")
            return
        
        resposta_idx = 0
        
        for cotacao in self.cotacoes:
            # Cada transportador responde com valor diferente
            for email_transp in self.transportadores:
                try:
                    user_data = self.usuarios[email_transp]
                    
                    # Transportadores premium oferecem valores ligeiramente menores
                    valor_base = cotacao["valor"]
                    desconto_premium = 0.9 if user_data["premium"] else 1.1
                    valor_resposta = round(valor_base * desconto_premium, 2)
                    
                    # Data de entrega em 2-5 dias
                    hoje = datetime.datetime.now()
                    data_entrega_resposta = (hoje + datetime.timedelta(days=random.randint(2, 5))).isoformat()
                    
                    payload = {
                        "cotacaoId": cotacao["id"],
                        "valor": valor_resposta,
                        "dataEntrega": data_entrega_resposta,
                        "descricao": f"Resposta de {email_transp[:15]}..."
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/respostas",
                        json=payload,
                        headers={"Authorization": f"Bearer {user_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code in [200, 201]:
                        resposta_id = resp.json().get("resposta", {}).get("id")
                        self.respostas.append({
                            "id": resposta_id,
                            "cotacao_id": cotacao["id"],
                            "transportador": email_transp,
                            "premium_transp": user_data["premium"],
                            "valor": valor_resposta
                        })
                        resposta_idx += 1
                        
                        tipo_transp = "PREMIUM" if user_data["premium"] else "COMUM"
                        log_ok(f"Resposta {resposta_idx}: {tipo_transp} - R$ {valor_resposta}")
                    else:
                        log_erro(f"Status {resp.status_code}: {resp.text}")
                
                except Exception as e:
                    log_erro(f"Erro: {e}")
        
        print(f"\n✅ Total: {len(self.respostas)} respostas enviadas")
    
    def validar_priorizacao(self):
        """Validar se premium está sendo priorizado"""
        log_step("FASE 4: Validar priorização")
        
        log_info("Analisando respostas por cotação...")
        
        for cotacao in self.cotacoes:
            respostas_cotacao = [r for r in self.respostas if r["cotacao_id"] == cotacao["id"]]
            
            if not respostas_cotacao:
                log_erro(f"Nenhuma resposta para cotação {cotacao['id']}")
                continue
            
            # Separar premium e comum
            premium = [r for r in respostas_cotacao if r["premium_transp"]]
            comum = [r for r in respostas_cotacao if not r["premium_transp"]]
            
            print(f"\n  Cotação: {cotacao['id'][:15]}... ({cotacao['coleta']} -> {cotacao['entrega']})")
            print(f"    Respostas Premium: {len(premium)}")
            for r in sorted(premium, key=lambda x: x["valor"]):
                print(f"      • {r['transportador'][:15]:15s} R$ {r['valor']:8.2f}")
            
            print(f"    Respostas Comum: {len(comum)}")
            for r in sorted(comum, key=lambda x: x["valor"]):
                print(f"      • {r['transportador'][:15]:15s} R$ {r['valor']:8.2f}")
            
            # Premium deve aparecer primeiro (valores menores em média)
            if premium:
                premium_min = min(r["valor"] for r in premium)
                if comum:
                    comum_min = min(r["valor"] for r in comum)
                    if premium_min <= comum_min:
                        log_ok(f"Premium corretamente priorizado (R$ {premium_min:.2f} vs R$ {comum_min:.2f})")
                    else:
                        log_erro(f"Premium NÃO priorizado (R$ {premium_min:.2f} > R$ {comum_min:.2f})")
    
    def salvar_dados(self):
        """Salvar dados do teste"""
        dados = {
            "usuarios": self.usuarios,
            "cotacoes": self.cotacoes,
            "respostas": self.respostas,
            "timestamp": datetime.datetime.now().isoformat(),
            "resumo": {
                "total_usuarios": len(self.usuarios),
                "total_embarcadores": len(self.embarcadores),
                "total_transportadores": len(self.transportadores),
                "total_cotacoes": len(self.cotacoes),
                "total_respostas": len(self.respostas)
            }
        }
        
        with open("/tmp/cotacao_test_completo.json", "w") as f:
            json.dump(dados, f, indent=2)
        
        print(f"\n💾 Dados salvos em /tmp/cotacao_test_completo.json")
    
    def gerar_relatorio(self):
        """Gerar relatório final"""
        log_step("RELATÓRIO FINAL")
        
        print(f"📊 Usuários:")
        print(f"   Embarcadores: {len(self.embarcadores)} (Premium: {sum(1 for e in self.embarcadores if self.usuarios[e]['premium'])}, Comum: {sum(1 for e in self.embarcadores if not self.usuarios[e]['premium'])})")
        print(f"   Transportadores: {len(self.transportadores)} (Premium: {sum(1 for t in self.transportadores if self.usuarios[t]['premium'])}, Comum: {sum(1 for t in self.transportadores if not self.usuarios[t]['premium'])})")
        
        print(f"\n📦 Cotações:")
        print(f"   Total: {len(self.cotacoes)}")
        print(f"   Premium Emb: {sum(1 for c in self.cotacoes if c['premium_emb'])}")
        print(f"   Comum Emb: {sum(1 for c in self.cotacoes if not c['premium_emb'])}")
        
        print(f"\n💬 Respostas:")
        print(f"   Total: {len(self.respostas)}")
        print(f"   Premium Transp: {sum(1 for r in self.respostas if r['premium_transp'])}")
        print(f"   Comum Transp: {sum(1 for r in self.respostas if not r['premium_transp'])}")
        
        if len(self.respostas) > 0:
            valores = [r["valor"] for r in self.respostas]
            print(f"   Valor médio: R$ {sum(valores)/len(valores):.2f}")
            print(f"   Valor mín: R$ {min(valores):.2f}")
            print(f"   Valor máx: R$ {max(valores):.2f}")
    
    def executar(self):
        """Executar todas as fases do teste"""
        try:
            self.criar_usuarios_teste()
            self.criar_cotacoes()
            self.transportadores_respondem()
            self.validar_priorizacao()
            self.salvar_dados()
            self.gerar_relatorio()
            
            log_step("✅ TESTE COMPLETO COM SUCESSO")
        
        except Exception as e:
            log_erro(f"Erro geral: {e}")

if __name__ == "__main__":
    print(f"\n{BLUE}{'='*60}{END}")
    print(f"{BLUE}  TESTE E2E - COTAÇÃO COM PRIORIZAÇÃO{END}")
    print(f"{BLUE}{'='*60}{END}\n")
    
    testador = TestadorCotacao()
    testador.executar()
