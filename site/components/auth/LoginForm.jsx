import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock } from "lucide-react";

export default function LoginForm({ user, tipo, onSuccess, onCriarConta }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      console.log("=== INICIANDO LOGIN ===");
      console.log("Email:", formData.email);
      console.log("Tipo:", tipo);

      // Buscar credenciais apenas do tipo selecionado
      const todasCredenciais = await base44.entities.Credencial.list();
      console.log("Total de credenciais no banco:", todasCredenciais.length);
      
      // IMPORTANTE: Filtrar por tipo PRIMEIRO para evitar confusão
      const credenciaisEncontradas = todasCredenciais.filter(c => 
        c.tipo === tipo &&
        c.ativo === true &&
        c.emailAcesso?.toLowerCase() === formData.email.toLowerCase()
      );
      
      console.log(`Credenciais ${tipo} encontradas para ${formData.email}:`, credenciaisEncontradas.length);

      console.log("Credenciais encontradas para este email e tipo:", credenciaisEncontradas.length);

      if (credenciaisEncontradas.length === 0) {
        console.log("❌ Nenhuma credencial encontrada");
        setError("Email ou senha incorretos");
        setSubmitting(false);
        return;
      }

      const credencial = credenciaisEncontradas[0];
      console.log("✅ Credencial encontrada:", {
        emailAcesso: credencial.emailAcesso,
        tipo: credencial.tipo,
        perfilId: credencial.perfilId
      });

      // Verificar senha - aceitar tanto texto plano quanto base64
      let senhaCorreta = false;
      
      // Tentar comparação direta (texto plano)
      if (credencial.senhaHash === formData.senha) {
        senhaCorreta = true;
        console.log("✅ Senha correta (texto plano)");
      } else {
        // Tentar comparação com base64
        try {
          const senhaDigitadaCodificada = btoa(formData.senha);
          console.log("Tentando senha codificada:", senhaDigitadaCodificada);
          if (credencial.senhaHash === senhaDigitadaCodificada) {
            senhaCorreta = true;
            console.log("✅ Senha correta (base64)");
          }
        } catch (e) {
          console.error("Erro ao codificar senha:", e);
        }
        
        // Tentar decodificar a senha armazenada e comparar
        if (!senhaCorreta) {
          try {
            const senhaDecodificada = atob(credencial.senhaHash);
            console.log("Senha decodificada do banco:", senhaDecodificada);
            if (senhaDecodificada === formData.senha) {
              senhaCorreta = true;
              console.log("✅ Senha correta (decodificada)");
            }
          } catch (e) {
            console.log("Senha não está em base64");
          }
        }
      }
      
      if (!senhaCorreta) {
        console.log("❌ Senha incorreta");
        setError("Email ou senha incorretos");
        setSubmitting(false);
        return;
      }

      // Buscar perfil usando o perfilId da credencial
      console.log("Buscando perfil com ID:", credencial.perfilId);
      let perfil;
      
      if (tipo === "cliente") {
        const todosPerfis = await base44.entities.PerfilCliente.list();
        console.log("Total de perfis de cliente:", todosPerfis.length);
        const perfisEncontrados = todosPerfis.filter(p => p.id === credencial.perfilId);
        perfil = perfisEncontrados[0];
        console.log("Perfil cliente encontrado:", perfil ? "SIM" : "NÃO");
        if (perfil) {
          console.log("Dados do perfil:", {
            id: perfil.id,
            nomeCompleto: perfil.nomeCompleto,
            status: perfil.status,
            isPremium: perfil.isPremium
          });
        }
      } else {
        const todosPerfis = await base44.entities.PerfilTransportadora.list();
        console.log("Total de perfis de transportadora:", todosPerfis.length);
        const perfisEncontrados = todosPerfis.filter(p => p.id === credencial.perfilId);
        perfil = perfisEncontrados[0];
        console.log("Perfil transportadora encontrado:", perfil ? "SIM" : "NÃO");
        if (perfil) {
          console.log("Dados do perfil:", {
            id: perfil.id,
            razaoSocial: perfil.razaoSocial,
            status: perfil.status,
            isPremium: perfil.isPremium
          });
        }
      }

      if (!perfil) {
        console.log("❌ Perfil não encontrado com ID:", credencial.perfilId);
        setError("Perfil não encontrado. Entre em contato com o suporte.");
        setSubmitting(false);
        return;
      }

      console.log("Atualizando dados do usuário no User...");
      console.log("Tipo sendo salvo no user:", credencial.tipo);
      
      // IMPORTANTE: Usar o tipo da credencial encontrada para garantir consistência
      const tipoCorreto = credencial.tipo;
      
      // Atualizar user atual com dados do perfil + emailAcesso
      await base44.auth.updateMe({
        tipo: tipoCorreto,
        emailAcesso: credencial.emailAcesso,
        perfilAtivoId: perfil.id,
        ...(tipoCorreto === "cliente" ? {
          nomeCompleto: perfil.nomeCompleto,
          cpfOuCnpj: perfil.cpfOuCnpj,
          telefoneComercial: perfil.telefoneComercial,
          telefonePessoal: perfil.telefonePessoal,
          documentoCpfScan: perfil.documentoCpfScan,
          documentoComprovanteEndereco: perfil.documentoComprovanteEndereco,
          status: perfil.status,
          isPremium: perfil.isPremium || false
        } : {
          razaoSocial: perfil.razaoSocial,
          cpfOuCnpj: perfil.cnpj,
          telefoneComercial: perfil.telefoneComercial,
          telefonePessoal: perfil.telefonePessoal,
          logoUrl: perfil.logoUrl,
          documentoCnpjScan: perfil.documentoCnpjScan,
          documentoAlvara: perfil.documentoAlvara,
          documentoComprovanteEndereco: perfil.documentoComprovanteEndereco,
          status: perfil.status,
          perfilCompleto: perfil.perfilCompleto,
          isPremium: perfil.isPremium || false
        })
      });

      console.log("✅ User atualizado com sucesso!");
      console.log("Tipo final salvo:", tipoCorreto);
      console.log("=== LOGIN CONCLUÍDO COM SUCESSO ===");
      
      // Invalidar cache do layout para forçar reload do user
      window.dispatchEvent(new Event('user-updated'));
      
      onSuccess(perfil.id);
    } catch (error) {
      console.error("❌ Erro no login:", error);
      setError("Erro ao fazer login: " + (error.message || "Tente novamente."));
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email de Acesso</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="seu@email.com"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="senha"
            type="password"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            placeholder="••••••"
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {submitting ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-600 mb-3">Ainda não tem conta?</p>
        <Button
          type="button"
          variant="outline"
          onClick={onCriarConta}
          className="w-full"
        >
          Criar Nova Conta
        </Button>
      </div>
    </form>
  );
}
