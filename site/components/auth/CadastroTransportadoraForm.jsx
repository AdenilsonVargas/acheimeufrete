import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CadastroTransportadoraForm({ user, onSuccess, onVoltar }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    emailAcesso: "",
    senha: "",
    confirmarSenha: "",
    razaoSocial: user?.full_name || "",
    cnpj: "",
    tipoTransportador: "pj",
    telefoneComercial: "",
    telefonePessoal: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!formData.cnpj || formData.cnpj.length < 14) {
      setError("CNPJ inválido. Transportadora deve sempre ser CNPJ");
      return;
    }

    setSubmitting(true);

    try {
      // Verificar se email já está em uso
      const todasCredenciais = await base44.entities.Credencial.list();
      const credencialExistente = todasCredenciais.find(c =>
        c.emailAcesso?.toLowerCase() === formData.emailAcesso.toLowerCase() &&
        c.tipo === "transportadora"
      );

      if (credencialExistente) {
        setError("Este email já está cadastrado como transportadora");
        setSubmitting(false);
        return;
      }

      // PASSO 1: Criar perfil de transportadora PRIMEIRO
      const perfilTransportadora = await base44.entities.PerfilTransportadora.create({
        userIdGoogle: user.id,
        emailAcesso: formData.emailAcesso.toLowerCase(),
        razaoSocial: formData.razaoSocial.toUpperCase(),
        cnpj: formData.cnpj,
        tipoTransportador: formData.tipoTransportador,
        telefoneComercial: formData.telefoneComercial,
        telefonePessoal: formData.telefonePessoal,
        status: "pending",
        perfilCompleto: false
      });

      console.log("Perfil transportadora criado:", perfilTransportadora);

      // PASSO 2: Criar credencial usando o ID do perfil criado
      await base44.entities.Credencial.create({
        userId: user.id,
        emailGoogle: user.email,
        tipo: "transportadora",
        emailAcesso: formData.emailAcesso.toLowerCase(),
        senhaHash: btoa(formData.senha),
        perfilId: perfilTransportadora.id,
        ativo: true
      });

      console.log("Credencial criada com perfilId:", perfilTransportadora.id);

      // PASSO 3: Criar endereço
      await base44.entities.Endereco.create({
        userId: perfilTransportadora.id,
        tipo: "comercial",
        cep: formData.cep,
        logradouro: formData.logradouro.toUpperCase(),
        numero: formData.numero,
        complemento: formData.complemento.toUpperCase(),
        bairro: formData.bairro.toUpperCase(),
        cidade: formData.cidade.toUpperCase(),
        estado: formData.estado.toUpperCase(),
        principal: true
      });

      console.log("Endereço criado");

      onSuccess();
    } catch (error) {
      console.error("Erro ao criar cadastro:", error);
      setError("Erro ao criar cadastro. Tente novamente.");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Transportadora:</strong> Deve sempre ser CNPJ. Crie um email e senha exclusivos para este acesso.
          <br />
          {formData.tipoTransportador === "autonomo" && (
            <span className="text-blue-900 font-medium mt-2 block">
              ⚠️ Como Autônomo, você será OBRIGADO a emitir CIOT pelo nosso sistema após coleta confirmada.
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dados de Acesso</h3>
        
        <div>
          <Label htmlFor="emailAcesso">Email de Acesso *</Label>
          <Input
            id="emailAcesso"
            type="email"
            value={formData.emailAcesso}
            onChange={(e) => setFormData({ ...formData, emailAcesso: e.target.value })}
            placeholder="empresa@email.com"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
            <Input
              id="confirmarSenha"
              type="password"
              value={formData.confirmarSenha}
              onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
              placeholder="Digite novamente"
              required
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold text-lg">Dados da Empresa</h3>

        <div>
          <Label htmlFor="tipoTransportador">Tipo de Transportador *</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipoTransportador: "pj" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                formData.tipoTransportador === "pj"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-lg">PJ Transportadora</div>
              <div className="text-sm text-gray-600 mt-1">
                Emissão de CT-e e documentos fiscais completos
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipoTransportador: "autonomo" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                formData.tipoTransportador === "autonomo"
                  ? "border-orange-600 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-lg">Autônomo</div>
              <div className="text-sm text-gray-600 mt-1">
                Emissão OBRIGATÓRIA de CIOT pelo sistema
              </div>
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="razaoSocial">Razão Social *</Label>
          <Input
            id="razaoSocial"
            value={formData.razaoSocial}
            onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
            placeholder="NOME DA EMPRESA"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Será automaticamente convertido para maiúsculas</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cnpj">CNPJ * (Obrigatório)</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
          <div>
            <Label htmlFor="telefoneComercial">Telefone Comercial *</Label>
            <Input
              id="telefoneComercial"
              value={formData.telefoneComercial}
              onChange={(e) => setFormData({ ...formData, telefoneComercial: e.target.value })}
              placeholder="(00) 0000-0000"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="telefonePessoal">Telefone Pessoal/Celular *</Label>
          <Input
            id="telefonePessoal"
            value={formData.telefonePessoal}
            onChange={(e) => setFormData({ ...formData, telefonePessoal: e.target.value })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold text-lg">Endereço da Empresa</h3>

        <div>
          <Label htmlFor="cep">CEP *</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            placeholder="00000-000"
            required
          />
        </div>

        <div>
          <Label htmlFor="logradouro">Logradouro *</Label>
          <Input
            id="logradouro"
            value={formData.logradouro}
            onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
            placeholder="RUA, AVENIDA, ETC"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numero">Número *</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              placeholder="SALA, GALPÃO, ETC"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bairro">Bairro *</Label>
          <Input
            id="bairro"
            value={formData.bairro}
            onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="estado">Estado *</Label>
            <Input
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              placeholder="SP"
              maxLength={2}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onVoltar}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
        >
          {submitting ? "Cadastrando..." : "Criar Conta"}
        </Button>
      </div>
    </form>
  );
}
