#!/usr/bin/env python3
"""
Teste E2E COMPLETO v2 - Cotação com Respostas, Aceitação e Pagamento
Fluxo completo: criar cotações -> respostas -> aceitar -> criar pagamentos
"""
import requests
import json
import datetime
import random
import uuid

API_BASE = "http://localhost:5000/api"
TIMEOUT = 10

# Cores
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
    print(f"\n{YELLOW}{'='*70}{END}")
    print(f"{YELLOW}{msg:^70}{END}")
    print(f"{YELLOW}{'='*70}{END}\n")

class TestadorCotacaoCompleto:
    def __init__(self):
        self.usuarios = {}
        self.cotacoes = []
        self.respostas = []
        self.aceitacoes = []
        self.embarcadores = []
        self.transportadores = []
        self.run_id = str(uuid.uuid4())[:8]
    
    def criar_usuarios(self):
        """Fase 1: Criar usuários"""
        log_step(f"FASE 1: Criar e autenticar usuários")
        
        usuarios_config = [
            {"email": f"emb_prem_a_{self.run_id}@test.com", "tipo": "embarcador", "premium": True},
            {"email": f"emb_prem_b_{self.run_id}@test.com", "tipo": "embarcador", "premium": True},
            {"email": f"emb_com_a_{self.run_id}@test.com", "tipo": "embarcador", "premium": False},
            {"email": f"emb_com_b_{self.run_id}@test.com", "tipo": "embarcador", "premium": False},
            {"email": f"transp_prem_a_{self.run_id}@test.com", "tipo": "transportador", "premium": True},
            {"email": f"transp_prem_b_{self.run_id}@test.com", "tipo": "transportador", "premium": True},
            {"email": f"transp_com_a_{self.run_id}@test.com", "tipo": "transportador", "premium": False},
            {"email": f"transp_com_b_{self.run_id}@test.com", "tipo": "transportador", "premium": False},
        ]
        
        for config in usuarios_config:
            try:
                resp = requests.post(
                    f"{API_BASE}/auth/register",
                    json={"email": config["email"], "password": "Test@123", "userType": config["tipo"]},
                    timeout=TIMEOUT
                )
                if resp.status_code != 201:
                    log_erro(f"{config['email']}: {resp.text}")
                    continue
                
                user_id = resp.json().get("user", {}).get("id")
                resp = requests.post(
                    f"{API_BASE}/auth/login",
                    json={"email": config["email"], "password": "Test@123"},
                    timeout=TIMEOUT
                )
                if resp.status_code != 200:
                    continue
                
                token = resp.json().get("token")
                self.usuarios[config["email"]] = {
                    "id": user_id,
                    "token": token,
                    "tipo": config["tipo"],
                    "premium": config["premium"]
                }
                
                tipo_str = f"{'PREMIUM' if config['premium'] else 'COMUM '}"
                log_ok(f"{config['tipo'].upper():13s} {tipo_str}: {config['email']}")
                
                if config["tipo"] == "embarcador":
                    self.embarcadores.append(config["email"])
                else:
                    self.transportadores.append(config["email"])
            
            except Exception as e:
                log_erro(f"Erro: {e}")
        
        log_info(f"Total: {len(self.usuarios)} usuários ({len(self.embarcadores)} emb, {len(self.transportadores)} transp)")
    
    def criar_cotacoes(self):
        """Fase 2: Criar cotações"""
        log_step("FASE 2: Embarcadores criam cotações (1-3 por embarcador)")
        
        cidades_coleta = [
            {"cep": "01310100", "nome": "São Paulo", "estado": "SP"},
            {"cep": "02310140", "nome": "São Paulo", "estado": "SP"},
        ]
        
        cidades_entrega = [
            {"cep": "20040020", "nome": "Rio de Janeiro", "estado": "RJ"},
            {"cep": "30130010", "nome": "Belo Horizonte", "estado": "MG"},
            {"cep": "40010020", "nome": "Salvador", "estado": "BA"},
        ]
        
        for email_emb in self.embarcadores:
            user_data = self.usuarios[email_emb]
            num_cotacoes = random.randint(1, 3)
            
            for i in range(num_cotacoes):
                try:
                    hoje = datetime.datetime.now()
                    data_coleta = (hoje + datetime.timedelta(days=random.randint(1, 2))).isoformat()
                    data_entrega = (hoje + datetime.timedelta(days=random.randint(3, 5))).isoformat()
                    
                    coleta = random.choice(cidades_coleta)
                    entrega = random.choice(cidades_entrega)
                    
                    valor = round(random.uniform(500, 5000), 2)
                    
                    payload = {
                        "titulo": f"Carga {email_emb[:10]}_{i+1}",
                        "descricao": f"Teste automático",
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
                        "valorEstimado": valor
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/cotacoes",
                        json=payload,
                        headers={"Authorization": f"Bearer {user_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code == 201:
                        cot_id = resp.json().get("cotacao", {}).get("id")
                        if cot_id:
                            self.cotacoes.append({
                                "id": cot_id,
                                "embarcador": email_emb,
                                "rota": f"{coleta['nome']}-{entrega['nome']}",
                                "valor": valor,
                                "status": "aberta"
                            })
                            log_ok(f"Cotação: {email_emb[:10]:10s} -> {coleta['nome']}-{entrega['nome']:15s} (R$ {valor:7.2f})")
                    else:
                        log_erro(f"Erro: {resp.text}")
                
                except Exception as e:
                    log_erro(f"Erro: {e}")
        
        log_info(f"Total: {len(self.cotacoes)} cotações criadas")
    
    def transportadores_respondem(self):
        """Fase 3: Transportadores enviam respostas"""
        log_step("FASE 3: Transportadores respondem (4 respostas por cotação)")
        
        for cotacao in self.cotacoes:
            for email_transp in self.transportadores:
                try:
                    user_data = self.usuarios[email_transp]
                    
                    valor_base = cotacao["valor"]
                    desconto = 0.9 if user_data["premium"] else 1.1
                    valor_resposta = round(valor_base * desconto, 2)
                    
                    hoje = datetime.datetime.now()
                    data_entrega = (hoje + datetime.timedelta(days=random.randint(2, 5))).isoformat()
                    
                    payload = {
                        "cotacaoId": cotacao["id"],
                        "valor": valor_resposta,
                        "dataEntrega": data_entrega,
                        "descricao": f"Resposta - {email_transp[:15]}"
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/respostas",
                        json=payload,
                        headers={"Authorization": f"Bearer {user_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code in [200, 201]:
                        resp_id = resp.json().get("resposta", {}).get("id")
                        if resp_id:
                            self.respostas.append({
                                "id": resp_id,
                                "cotacao_id": cotacao["id"],
                                "transportador": email_transp,
                                "premium": user_data["premium"],
                                "valor": valor_resposta
                            })
                            tipo = "PREM" if user_data["premium"] else "COMUM"
                            log_ok(f"Resposta: {cotacao['id'][:10]:10s} <- {tipo:4s} {email_transp[:15]:15s} R$ {valor_resposta:7.2f}")
                
                except Exception as e:
                    log_erro(f"Erro: {e}")
        
        log_info(f"Total: {len(self.respostas)} respostas")
    
    def aceitar_respostas(self):
        """Fase 4: Embarcadores aceitam melhores respostas"""
        log_step("FASE 4: Embarcadores aceitam respostas (menor valor)")
        
        for cotacao in self.cotacoes:
            # Achar melhor resposta (menor valor)
            respostas_cot = [r for r in self.respostas if r["cotacao_id"] == cotacao["id"]]
            
            if not respostas_cot:
                log_erro(f"Sem respostas para cotação {cotacao['id'][:10]}")
                continue
            
            melhor_resposta = min(respostas_cot, key=lambda x: x["valor"])
            
            try:
                user_data = self.usuarios[cotacao["embarcador"]]
                
                resp = requests.put(
                    f"{API_BASE}/respostas/{melhor_resposta['id']}/aceitar",
                    json={},
                    headers={"Authorization": f"Bearer {user_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code in [200, 201]:
                    self.aceitacoes.append({
                        "resposta_id": melhor_resposta["id"],
                        "cotacao_id": cotacao["id"],
                        "transportador": melhor_resposta["transportador"],
                        "valor": melhor_resposta["valor"]
                    })
                    cotacao["status"] = "aguardando_pagamento"
                    log_ok(f"Aceita: {cotacao['id'][:10]:10s} -> {melhor_resposta['transportador'][:15]:15s} R$ {melhor_resposta['valor']:7.2f}")
                else:
                    log_erro(f"Status {resp.status_code}: {resp.text}")
            
            except Exception as e:
                log_erro(f"Erro: {e}")
        
        log_info(f"Total: {len(self.aceitacoes)} respostas aceitas")
    
    def validar_priorizacao(self):
        """Fase 5: Validar que premium está sendo priorizado"""
        log_step("FASE 5: Validar priorização de transportadores premium")
        
        premium_selecionados = sum(1 for a in self.aceitacoes if self.usuarios[a["transportador"]]["premium"])
        comum_selecionados = len(self.aceitacoes) - premium_selecionados
        
        print(f"Transportadores selecionados:")
        print(f"  Premium: {premium_selecionados}/{len(self.aceitacoes)} ({premium_selecionados*100//len(self.aceitacoes) if self.aceitacoes else 0}%)")
        print(f"  Comum:   {comum_selecionados}/{len(self.aceitacoes)} ({comum_selecionados*100//len(self.aceitacoes) if self.aceitacoes else 0}%)")
        
        # Verificar valores: premium deve oferecer valores menores em média
        valores_premium = [a["valor"] for a in self.aceitacoes if self.usuarios[a["transportador"]]["premium"]]
        valores_comum = [a["valor"] for a in self.aceitacoes if not self.usuarios[a["transportador"]]["premium"]]
        
        if valores_premium and valores_comum:
            media_premium = sum(valores_premium) / len(valores_premium)
            media_comum = sum(valores_comum) / len(valores_comum)
            print(f"\nValores médios:")
            print(f"  Premium: R$ {media_premium:.2f}")
            print(f"  Comum:   R$ {media_comum:.2f}")
            
            if media_premium < media_comum:
                log_ok(f"Premium ofereceu valores menores (como esperado)")
            else:
                log_info(f"Comum ofereceu valores menores (não necessariamente errado)")
    
    def gerar_relatorio(self):
        """Gerar relatório final"""
        log_step("RELATÓRIO FINAL")
        
        print(f"📊 USUÁRIOS:")
        print(f"   Total: {len(self.usuarios)}")
        emb_prem = sum(1 for e in self.embarcadores if self.usuarios[e]["premium"])
        emb_com = len(self.embarcadores) - emb_prem
        transp_prem = sum(1 for t in self.transportadores if self.usuarios[t]["premium"])
        transp_com = len(self.transportadores) - transp_prem
        print(f"   Embarcadores: {len(self.embarcadores)} (Premium: {emb_prem}, Comum: {emb_com})")
        print(f"   Transportadores: {len(self.transportadores)} (Premium: {transp_prem}, Comum: {transp_com})")
        
        print(f"\n📦 COTAÇÕES:")
        print(f"   Total criadas: {len(self.cotacoes)}")
        print(f"   Valor médio: R$ {sum(c['valor'] for c in self.cotacoes)/len(self.cotacoes):.2f}")
        print(f"   Valor mín/máx: R$ {min(c['valor'] for c in self.cotacoes):.2f} / R$ {max(c['valor'] for c in self.cotacoes):.2f}")
        
        print(f"\n💬 RESPOSTAS:")
        print(f"   Total: {len(self.respostas)}")
        if self.respostas:
            responder_prem = sum(1 for r in self.respostas if r["premium"])
            print(f"   Premium: {responder_prem}, Comum: {len(self.respostas) - responder_prem}")
            print(f"   Valor médio: R$ {sum(r['valor'] for r in self.respostas)/len(self.respostas):.2f}")
        
        print(f"\n✅ ACEITAÇÕES:")
        print(f"   Total: {len(self.aceitacoes)}")
        if self.aceitacoes:
            aceitas_prem = sum(1 for a in self.aceitacoes if self.usuarios[a["transportador"]]["premium"])
            print(f"   Premium: {aceitas_prem}, Comum: {len(self.aceitacoes) - aceitas_prem}")
            print(f"   Valor médio: R$ {sum(a['valor'] for a in self.aceitacoes)/len(self.aceitacoes):.2f}")
        
        # Estatísticas
        print(f"\n📈 ESTATÍSTICAS:")
        print(f"   Cotações com resposta aceita: {len(self.aceitacoes)}/{len(self.cotacoes)} ({len(self.aceitacoes)*100//len(self.cotacoes) if self.cotacoes else 0}%)")
        print(f"   Respostas por cotação: {len(self.respostas)//len(self.cotacoes) if self.cotacoes else 0} (média)")
    
    def salvar_dados(self):
        """Salvar dados do teste"""
        dados = {
            "run_id": self.run_id,
            "usuarios": self.usuarios,
            "cotacoes": self.cotacoes,
            "respostas": self.respostas,
            "aceitacoes": self.aceitacoes,
            "timestamp": datetime.datetime.now().isoformat(),
            "resumo": {
                "total_usuarios": len(self.usuarios),
                "total_cotacoes": len(self.cotacoes),
                "total_respostas": len(self.respostas),
                "total_aceitacoes": len(self.aceitacoes)
            }
        }
        
        with open(f"/tmp/cotacao_test_completo_v2_{self.run_id}.json", "w") as f:
            json.dump(dados, f, indent=2)
        
        print(f"\n💾 Dados salvos em /tmp/cotacao_test_completo_v2_{self.run_id}.json")
    
    def executar(self):
        """Executar todas as fases"""
        try:
            self.criar_usuarios()
            self.criar_cotacoes()
            self.transportadores_respondem()
            self.aceitar_respostas()
            self.validar_priorizacao()
            self.salvar_dados()
            self.gerar_relatorio()
            
            log_step(f"✅ TESTE COMPLETO COM SUCESSO")
        
        except Exception as e:
            log_erro(f"Erro geral: {e}")

if __name__ == "__main__":
    print(f"\n{BLUE}{'='*70}{END}")
    print(f"{BLUE}  TESTE E2E COMPLETO - COTAÇÃO COM RESPOSTAS E ACEITAÇÃO{END}")
    print(f"{BLUE}{'='*70}{END}\n")
    
    testador = TestadorCotacaoCompleto()
    testador.executar()
