import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CadastroClienteForm({ user, onSuccess, onVoltar }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [formData, setFormData] = useState({
    emailAcesso: "",
    senha: "",
    confirmarSenha: "",
    nomeCompleto: user?.full_name || "",
    cpfOuCnpj: "",
    telefoneComercial: "",
    telefonePessoal: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    documentoCpfScan: "",
    documentoComprovanteEndereco: ""
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [field]: file_url });
    } catch (error) {
      setError("Erro ao fazer upload do documento. Tente novamente.");
      console.error("Erro upload:", error);
    }
    setUploadingDoc(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("Iniciando validações...");
    console.log("Form data:", formData);

    // Validações básicas
    if (!formData.emailAcesso || !formData.senha) {
      setError("Email e senha são obrigatórios");
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!formData.nomeCompleto || formData.nomeCompleto.trim() === "") {
      setError("Nome completo é obrigatório");
      return;
    }

    if (!formData.cpfOuCnpj || formData.cpfOuCnpj.trim() === "") {
      setError("CPF ou CNPJ é obrigatório");
      return;
    }

    if (!formData.telefoneComercial || formData.telefoneComercial.trim() === "") {
      setError("Telefone comercial é obrigatório");
      return;
    }

    if (!formData.telefonePessoal || formData.telefonePessoal.trim() === "") {
      setError("Telefone pessoal é obrigatório");
      return;
    }

    if (!formData.cep || !formData.logradouro || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      setError("Todos os campos de endereço são obrigatórios");
      return;
    }

    if (!formData.documentoCpfScan || !formData.documentoComprovanteEndereco) {
      setError("Por favor, faça upload de todos os documentos obrigatórios");
      return;
    }

    setSubmitting(true);
    console.log("Validações passaram, iniciando cadastro...");

    try {
      // Verificar se email já está em uso
      const todasCredenciais = await base44.entities.Credencial.list();
      const credencialExistente = todasCredenciais.find(c => 
        c.emailAcesso?.toLowerCase() === formData.emailAcesso.toLowerCase() &&
        c.tipo === "cliente"
      );

      if (credencialExistente) {
        setError("Este email já está cadastrado");
        setSubmitting(false);
        return;
      }

      console.log("Email disponível, criando perfil...");

      // PASSO 1: Criar perfil de cliente PRIMEIRO
      const perfilCliente = await base44.entities.PerfilCliente.create({
        userIdGoogle: user.id,
        emailAcesso: formData.emailAcesso.toLowerCase(),
        nomeCompleto: formData.nomeCompleto.toUpperCase(),
        cpfOuCnpj: formData.cpfOuCnpj,
        telefoneComercial: formData.telefoneComercial,
        telefonePessoal: formData.telefonePessoal,
        documentoCpfScan: formData.documentoCpfScan,
        documentoComprovanteEndereco: formData.documentoComprovanteEndereco,
        status: "pending"
      });

      console.log("✅ Perfil cliente criado:", perfilCliente);

      // PASSO 2: Criar credencial usando o ID do perfil criado
      await base44.entities.Credencial.create({
        userId: user.id,
        emailGoogle: user.email,
        tipo: "cliente",
        emailAcesso: formData.emailAcesso.toLowerCase(),
        senhaHash: btoa(formData.senha),
        perfilId: perfilCliente.id,
        ativo: true
      });

      console.log("✅ Credencial criada com perfilId:", perfilCliente.id);

      // PASSO 3: Criar endereço
      await base44.entities.Endereco.create({
        userId: perfilCliente.id,
        tipo: "residencial",
        cep: formData.cep,
        logradouro: formData.logradouro.toUpperCase(),
        numero: formData.numero,
        complemento: formData.complemento.toUpperCase(),
        bairro: formData.bairro.toUpperCase(),
        cidade: formData.cidade.toUpperCase(),
        estado: formData.estado.toUpperCase(),
        principal: true
      });

      console.log("✅ Endereço criado");
      console.log("✅ Cadastro completo! Redirecionando...");

      onSuccess();
    } catch (error) {
      setError("Erro ao criar cadastro: " + (error.message || "Tente novamente."));
      console.error("❌ Erro no cadastro:", error);
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

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Cliente pode ser CPF ou CNPJ.</strong> Crie suas credenciais de acesso e complete seu cadastro.
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
            placeholder="seu@email.com"
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
        <h3 className="font-semibold text-lg">Dados Pessoais</h3>

        <div>
          <Label htmlFor="nomeCompleto">Nome Completo *</Label>
          <Input
            id="nomeCompleto"
            value={formData.nomeCompleto}
            onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
            placeholder="Digite seu nome completo"
            required
          />
          <p className="text-xs text-gray-500 mt-1">O nome será automaticamente convertido para maiúsculas</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cpfOuCnpj">CPF ou CNPJ *</Label>
            <Input
              id="cpfOuCnpj"
              value={formData.cpfOuCnpj}
              onChange={(e) => setFormData({ ...formData, cpfOuCnpj: e.target.value })}
              placeholder="000.000.000-00"
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
          <Label htmlFor="telefonePessoal">Telefone Pessoal *</Label>
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
        <h3 className="font-semibold text-lg">Endereço</h3>

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
            placeholder="Rua, Avenida, etc"
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
              placeholder="Apto, Casa, etc"
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

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold text-lg">Documentos *</h3>

        <div>
          <Label htmlFor="documentoCpf">Documento CPF/CNPJ *</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              id="documentoCpf"
              onChange={(e) => handleFileUpload(e, "documentoCpfScan")}
              accept="image/*,.pdf"
              disabled={uploadingDoc}
            />
            {formData.documentoCpfScan && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={formData.documentoCpfScan} target="_blank" rel="noopener noreferrer">
                  Ver
                </a>
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="comprovanteEndereco">Comprovante de Endereço *</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              id="comprovanteEndereco"
              onChange={(e) => handleFileUpload(e, "documentoComprovanteEndereco")}
              accept="image/*,.pdf"
              disabled={uploadingDoc}
            />
            {formData.documentoComprovanteEndereco && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={formData.documentoComprovanteEndereco} target="_blank" rel="noopener noreferrer">
                  Ver
                </a>
              </Button>
            )}
          </div>
        </div>

        {uploadingDoc && (
          <p className="text-sm text-blue-600">Fazendo upload...</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onVoltar}
          className="flex-1"
          disabled={submitting}
        >
          Voltar
        </Button>
        <Button
          type="submit"
          disabled={submitting || uploadingDoc}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
        >
          {submitting ? "Cadastrando..." : "Criar Conta"}
        </Button>
      </div>
    </form>
  );
}
