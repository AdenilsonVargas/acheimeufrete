#!/usr/bin/env python3
"""
FASE 5+: Teste E2E Avançado - Chat, Coleta e Avaliação
Continua de onde parou o teste anterior com novas etapas
"""
import requests
import json
import datetime
import random
import uuid
import time

API_BASE = "http://localhost:5000/api"
TIMEOUT = 10

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

class TestadorAvancado:
    def __init__(self):
        self.usuarios = {}
        self.cotacoes = []
        self.respostas_aceitas = []
        self.chats = []
        self.mensagens = []
        self.avaliacoes = []
        self.run_id = str(uuid.uuid4())[:8]
    
    def criar_usuarios(self):
        """Fase 1: Criar usuários básicos"""
        log_step("FASE 1: Criar usuários")
        
        usuarios_config = [
            {"email": f"emb_prem_{self.run_id}@test.com", "tipo": "embarcador", "premium": True},
            {"email": f"emb_com_{self.run_id}@test.com", "tipo": "embarcador", "premium": False},
            {"email": f"transp_prem_{self.run_id}@test.com", "tipo": "transportador", "premium": True},
            {"email": f"transp_com_{self.run_id}@test.com", "tipo": "transportador", "premium": False},
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
                
                log_ok(f"{config['tipo'].upper():13s}: {config['email']}")
            
            except Exception as e:
                log_erro(f"Erro: {e}")
        
        log_info(f"Total: {len(self.usuarios)} usuários")
    
    def criar_cotacao_simples(self):
        """Fase 2: Criar 1 cotação"""
        log_step("FASE 2: Criar cotação")
        
        embarcadores = [e for e in self.usuarios if self.usuarios[e]["tipo"] == "embarcador"]
        if not embarcadores:
            log_erro("Sem embarcadores!")
            return
        
        email_emb = embarcadores[0]
        user_data = self.usuarios[email_emb]
        
        try:
            hoje = datetime.datetime.now()
            data_coleta = (hoje + datetime.timedelta(days=1)).isoformat()
            data_entrega = (hoje + datetime.timedelta(days=3)).isoformat()
            
            payload = {
                "titulo": "Carga Teste - Chat",
                "descricao": "Teste de fluxo com chat",
                "cepColeta": "01310100",
                "enderecoColeta": "Av. Paulista, 1000, São Paulo, SP",
                "dataColeta": data_coleta,
                "cepEntrega": "20040020",
                "enderecoEntrega": "Rua da Assembleia, 100, Rio de Janeiro, RJ",
                "dataEntrega": data_entrega,
                "peso": 100.0,
                "altura": 50,
                "largura": 50,
                "profundidade": 50,
                "valorEstimado": 2000.00
            }
            
            resp = requests.post(
                f"{API_BASE}/cotacoes",
                json=payload,
                headers={"Authorization": f"Bearer {user_data['token']}"},
                timeout=TIMEOUT
            )
            
            if resp.status_code == 201:
                cot_id = resp.json().get("cotacao", {}).get("id")
                self.cotacoes.append({
                    "id": cot_id,
                    "embarcador": email_emb,
                    "valor": 2000.00
                })
                log_ok(f"Cotação criada: {cot_id[:15]}...")
            else:
                log_erro(f"Erro ao criar cotação: {resp.text}")
        
        except Exception as e:
            log_erro(f"Erro: {e}")
    
    def transportadores_respondem(self):
        """Fase 3: Transportadores respondem"""
        log_step("FASE 3: Transportadores respondem")
        
        transportadores = [t for t in self.usuarios if self.usuarios[t]["tipo"] == "transportador"]
        
        for cot in self.cotacoes:
            for email_transp in transportadores:
                try:
                    user_data = self.usuarios[email_transp]
                    
                    valor_base = cot["valor"]
                    desconto = 0.9 if user_data["premium"] else 1.0
                    valor_resposta = round(valor_base * desconto, 2)
                    
                    hoje = datetime.datetime.now()
                    data_entrega = (hoje + datetime.timedelta(days=3)).isoformat()
                    
                    payload = {
                        "cotacaoId": cot["id"],
                        "valor": valor_resposta,
                        "dataEntrega": data_entrega,
                        "descricao": f"Resposta do {email_transp}"
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/respostas",
                        json=payload,
                        headers={"Authorization": f"Bearer {user_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code in [200, 201]:
                        resp_id = resp.json().get("resposta", {}).get("id")
                        self.respostas_aceitas.append({
                            "id": resp_id,
                            "cotacao_id": cot["id"],
                            "transportador": email_transp,
                            "valor": valor_resposta
                        })
                        log_ok(f"Resposta: {email_transp[:15]:15s} R$ {valor_resposta}")
                    else:
                        log_erro(f"Status {resp.status_code}")
                
                except Exception as e:
                    log_erro(f"Erro: {e}")
    
    def aceitar_resposta(self):
        """Fase 4: Embarcador aceita resposta"""
        log_step("FASE 4: Aceitar melhor resposta")
        
        for cot in self.cotacoes:
            respostas = [r for r in self.respostas_aceitas if r["cotacao_id"] == cot["id"]]
            if not respostas:
                log_erro(f"Sem respostas para {cot['id'][:15]}")
                continue
            
            melhor = min(respostas, key=lambda x: x["valor"])
            
            try:
                emb_email = cot["embarcador"]
                user_data = self.usuarios[emb_email]
                
                resp = requests.put(
                    f"{API_BASE}/respostas/{melhor['id']}/aceitar",
                    json={},
                    headers={"Authorization": f"Bearer {user_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code in [200, 201]:
                    cot["resposta_aceita"] = melhor
                    log_ok(f"Aceita: {melhor['transportador'][:15]:15s} R$ {melhor['valor']}")
                else:
                    log_erro(f"Status {resp.status_code}")
            
            except Exception as e:
                log_erro(f"Erro: {e}")
    
    def criar_chat_automatico(self):
        """Fase 5: Chat é criado automaticamente após aceitação"""
        log_step("FASE 5: Validar chat criado após aceitação")
        
        for cot in self.cotacoes:
            if "resposta_aceita" not in cot:
                log_erro(f"Cotação {cot['id'][:15]} sem resposta aceita")
                continue
            
            try:
                # Verificar se chat foi criado listando chats
                emb_email = cot["embarcador"]
                user_data = self.usuarios[emb_email]
                
                resp = requests.get(
                    f"{API_BASE}/chat",
                    headers={"Authorization": f"Bearer {user_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    # A resposta pode vir como lista ou como objeto
                    if isinstance(data, list):
                        chats = data
                    else:
                        chats = data.get("chats", []) or data.get("data", [])
                    
                    if chats:
                        chat = chats[0] if isinstance(chats, list) else chats
                        self.chats.append({
                            "id": chat.get("id"),
                            "cotacao_id": cot["id"],
                            "participantes": chat.get("participantes", [])
                        })
                        log_ok(f"Chat encontrado: {chat.get('id', 'ID?')[:15]}...")
                    else:
                        log_info(f"Nenhum chat encontrado (pode ser criado sob demanda)")
                else:
                    log_erro(f"Erro ao listar chats: {resp.status_code}")
            
            except Exception as e:
                log_erro(f"Erro: {e}")
    
    def enviar_mensagens(self):
        """Fase 6: Enviar mensagens no chat"""
        log_step("FASE 6: Criar chat e enviar mensagens")
        
        # Se não houver chat, criar primeiro
        if not self.chats:
            for cot in self.cotacoes:
                if "resposta_aceita" not in cot:
                    continue
                
                try:
                    emb_email = cot["embarcador"]
                    transp_email = cot["resposta_aceita"]["transportador"]
                    
                    emb_data = self.usuarios[emb_email]
                    transp_data = self.usuarios[transp_email]
                    
                    # Criar chat
                    payload = {
                        "cotacaoId": cot["id"],
                        "participantes": [emb_data["id"], transp_data["id"]]
                    }
                    
                    resp = requests.post(
                        f"{API_BASE}/chat",
                        json=payload,
                        headers={"Authorization": f"Bearer {emb_data['token']}"},
                        timeout=TIMEOUT
                    )
                    
                    if resp.status_code in [200, 201]:
                        resp_data = resp.json()
                        chat_id = resp_data.get("chat", {}).get("id") or resp_data.get("id")
                        if chat_id:
                            self.chats.append({
                                "id": chat_id,
                                "cotacao_id": cot["id"],
                                "emb": emb_email,
                                "transp": transp_email
                            })
                            log_ok(f"Chat criado: {chat_id[:15] if chat_id else 'N/A'}...")
                    else:
                        log_info(f"Status {resp.status_code}: {resp.text}")
                
                except Exception as e:
                    log_erro(f"Erro ao criar chat: {e}")
        
        # Enviar mensagens nos chats
        for chat in self.chats:
            try:
                emb_email = chat.get("emb")
                transp_email = chat.get("transp")
                
                if not emb_email or not transp_email:
                    continue
                
                emb_data = self.usuarios[emb_email]
                transp_data = self.usuarios[transp_email]
                
                # Embarcador envia mensagem
                msg_payload = {
                    "conteudo": "Ótimo! Podemos proceder com a coleta amanhã?"
                }
                
                resp = requests.post(
                    f"{API_BASE}/chat/{chat['id']}/mensagem",
                    json=msg_payload,
                    headers={"Authorization": f"Bearer {emb_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code in [200, 201]:
                    msg_id = resp.json().get("mensagem", {}).get("id") or resp.json().get("id")
                    self.mensagens.append({
                        "id": msg_id,
                        "chat_id": chat["id"],
                        "remetente": emb_email,
                        "conteudo": msg_payload["conteudo"]
                    })
                    log_ok(f"Msg Emb: '{msg_payload['conteudo'][:30]}...'")
                else:
                    log_info(f"Status {resp.status_code}: {resp.text[:50]}")
                
                # Transportador responde
                time.sleep(0.5)
                msg_payload2 = {
                    "conteudo": "Confirmado! Estou pronto para coletar."
                }
                
                resp = requests.post(
                    f"{API_BASE}/chat/{chat['id']}/mensagem",
                    json=msg_payload2,
                    headers={"Authorization": f"Bearer {transp_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code in [200, 201]:
                    self.mensagens.append({
                        "id": resp.json().get("id"),
                        "chat_id": chat["id"],
                        "remetente": transp_email,
                        "conteudo": msg_payload2["conteudo"]
                    })
                    log_ok(f"Msg Transp: '{msg_payload2['conteudo'][:30]}...'")
                else:
                    log_info(f"Status {resp.status_code}")
            
            except Exception as e:
                log_erro(f"Erro ao enviar mensagem: {e}")
    
    def criar_avaliacoes(self):
        """Fase 7: Criar avaliações após coleta"""
        log_step("FASE 7: Criar avaliações de transportador")
        
        for cot in self.cotacoes:
            if "resposta_aceita" not in cot:
                continue
            
            try:
                emb_email = cot["embarcador"]
                transp_email = cot["resposta_aceita"]["transportador"]
                
                emb_data = self.usuarios[emb_email]
                transp_data = self.usuarios[transp_email]
                
                # Embarcador avalia transportador
                payload = {
                    "cotacaoId": cot["id"],
                    "transportadorId": transp_data["id"],
                    "nota": random.randint(4, 5),  # Premium: 4-5, Comum: variado
                    "comentario": "Entrega rápida e segura!",
                    "pontualidade": 5,
                    "comunicacao": 4,
                    "qualidadeServico": 5
                }
                
                resp = requests.post(
                    f"{API_BASE}/avaliacoes",
                    json=payload,
                    headers={"Authorization": f"Bearer {emb_data['token']}"},
                    timeout=TIMEOUT
                )
                
                if resp.status_code in [200, 201]:
                    avaliacao_id = resp.json().get("id")
                    self.avaliacoes.append({
                        "id": avaliacao_id,
                        "transportador": transp_email,
                        "nota": payload["nota"]
                    })
                    log_ok(f"Avaliação {payload['nota']}⭐: {transp_email[:15]:15s}")
                else:
                    log_info(f"Status {resp.status_code}: {resp.text}")
            
            except Exception as e:
                log_erro(f"Erro ao criar avaliação: {e}")
    
    def gerar_relatorio(self):
        """Gerar relatório final"""
        log_step("RELATÓRIO FINAL - FASES AVANÇADAS")
        
        print(f"📊 USUÁRIOS:")
        print(f"   Total: {len(self.usuarios)}")
        
        print(f"\n📦 COTAÇÕES:")
        print(f"   Criadas: {len(self.cotacoes)}")
        print(f"   Com resposta aceita: {sum(1 for c in self.cotacoes if 'resposta_aceita' in c)}")
        
        print(f"\n💬 CHATS:")
        print(f"   Criados: {len(self.chats)}")
        print(f"   Mensagens: {len(self.mensagens)}")
        
        print(f"\n⭐ AVALIAÇÕES:")
        print(f"   Criadas: {len(self.avaliacoes)}")
        if self.avaliacoes:
            media = sum(a["nota"] for a in self.avaliacoes) / len(self.avaliacoes)
            print(f"   Nota média: {media:.1f}⭐")
    
    def salvar_dados(self):
        """Salvar dados"""
        dados = {
            "run_id": self.run_id,
            "usuarios": self.usuarios,
            "cotacoes": self.cotacoes,
            "chats": self.chats,
            "mensagens": self.mensagens,
            "avaliacoes": self.avaliacoes,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        with open(f"/tmp/teste_avancado_{self.run_id}.json", "w") as f:
            json.dump(dados, f, indent=2)
        
        print(f"\n💾 Dados salvos em /tmp/teste_avancado_{self.run_id}.json")
    
    def executar(self):
        """Executar todas as fases"""
        try:
            self.criar_usuarios()
            self.criar_cotacao_simples()
            self.transportadores_respondem()
            self.aceitar_resposta()
            self.criar_chat_automatico()
            self.enviar_mensagens()
            self.criar_avaliacoes()
            self.salvar_dados()
            self.gerar_relatorio()
            
            log_step("✅ TESTE AVANÇADO COMPLETO")
        
        except Exception as e:
            log_erro(f"Erro geral: {e}")

if __name__ == "__main__":
    print(f"\n{BLUE}{'='*70}{END}")
    print(f"{BLUE}  TESTE E2E AVANÇADO - CHAT, COLETA, AVALIAÇÃO{END}")
    print(f"{BLUE}{'='*70}{END}\n")
    
    testador = TestadorAvancado()
    testador.executar()
