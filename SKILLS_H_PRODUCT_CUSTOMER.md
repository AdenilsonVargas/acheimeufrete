# 🏪 SKILL H: PRODUCT & CUSTOMER MANAGEMENT
## Cadastro de Produtos, Perfil de Clientes, Dados Master

> **OBJETIVO:** Produtos bem classificados, clientes com histórico, zero duplicatas

---

## 1. PRODUCT MANAGEMENT

### 📦 Product Registration
```javascript
// src/pages/admin/Products.jsx
import { useFormWithValidation } from '@/lib/formSetup';
import { z } from 'zod';

const produtoSchema = z.object({
  nome: z.string().min(5, 'Mínimo 5 caracteres'),
  descricao: z.string().min(20),
  ncmCodigo: z.string()
    .length(8, 'NCM deve ter 8 dígitos')
    .regex(/^\d+$/),
  peso: z.number().positive('Peso deve ser > 0').max(50000),
  preco: z.number().optional(),
  estoque: z.number().default(0),
  ativo: z.boolean().default(true)
});

export function ProdutoForm({ produto = null, onSave }) {
  const { register, handleSubmit, errors, isValid } = useFormWithValidation(
    produtoSchema,
    onSubmit
  );
  
  async function onSubmit(data) {
    try {
      if (produto) {
        await apiClient.put(`/admin/produtos/${produto.id}`, data);
      } else {
        await apiClient.post('/admin/produtos', data);
      }
      toast.success('Produto salvo!');
    } catch (err) {
      toast.error(err.response.data.erro);
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormInput
        label="Nome do Produto"
        register={register}
        name="nome"
        errors={errors}
      />
      
      <FormInput
        label="Descrição"
        register={register}
        name="descricao"
        errors={errors}
        type="textarea"
        rows={4}
      />
      
      <FormInput
        label="Código NCM (8 dígitos)"
        register={register}
        name="ncmCodigo"
        errors={errors}
        placeholder="12345678"
      />
      
      <FormInput
        label="Peso (kg)"
        type="number"
        register={register}
        name="peso"
        errors={errors}
      />
      
      <FormInput
        label="Preço (R$) (opcional)"
        type="number"
        register={register}
        name="preco"
        errors={errors}
        step="0.01"
      />
      
      <FormInput
        label="Estoque"
        type="number"
        register={register}
        name="estoque"
        errors={errors}
      />
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="ativo"
          {...register('ativo')}
          defaultChecked={!produto || produto.ativo}
        />
        <label htmlFor="ativo">Produto ativo</label>
      </div>
      
      <button
        type="submit"
        disabled={!isValid}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {produto ? 'Atualizar' : 'Criar'} Produto
      </button>
    </form>
  );
}
```

### 📊 Products List
```javascript
// src/pages/admin/ProductsList.jsx
export function ProductsList() {
  const [produtos, setProdutos] = useState([]);
  const [editing, setEditing] = useState(null);
  
  const columns = [
    { field: 'nome', label: 'Nome' },
    { field: 'ncmCodigo', label: 'NCM' },
    { field: 'peso', label: 'Peso (kg)' },
    { field: 'preco', label: 'Preço', render: (p) => p ? `R$ ${p.toFixed(2)}` : '—' },
    { field: 'estoque', label: 'Estoque' },
    {
      field: 'status',
      label: 'Status',
      render: (_, row) => <Badge status={row.ativo ? 'ativa' : 'cancelada'} />
    },
    {
      field: 'ações',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(row)}
            className="text-blue-600 hover:underline"
          >
            Editar
          </button>
          <button
            onClick={() => deletarProduto(row.id)}
            className="text-red-600 hover:underline"
          >
            Deletar
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <button
          onClick={() => setEditing('novo')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Novo Produto
        </button>
      </div>
      
      {editing ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <ProdutoForm
            produto={editing === 'novo' ? null : editing}
            onSave={() => setEditing(null)}
          />
        </div>
      ) : null}
      
      <DataTable data={produtos} columns={columns} exportable />
    </div>
  );
}
```

---

## 2. CUSTOMER PROFILES

### 👤 Customer Profile
```javascript
// src/pages/MeuPerfil.jsx
export function MeuPerfil() {
  const { user, updateUser } = useAuth();
  const [editando, setEditando] = useState(false);
  const [histórico, setHistórico] = useState([]);
  
  useEffect(() => {
    (async () => {
      const res = await apiClient.get('/perfil/historico');
      setHistórico(res.data);
    })();
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header com foto */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-6">
          <img
            src={user.fotoUrl || '/avatar-default.png'}
            alt={user.nome}
            className="w-24 h-24 rounded-full border-4 border-blue-600"
          />
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.nome}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            
            <div className="mt-4 flex gap-4">
              <Badge
                status={user.userType === 'embarcador' ? 'ativa' : 'aguardando'}
                label={getHumanUserType(user.userType)}
              />
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-200 rounded-full text-sm">
                Membro desde {new Date(user.dataRegistro).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setEditando(!editando)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>
      
      {/* Formulário de edição */}
      {editando && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <PerfilForm user={user} onSave={() => setEditando(false)} />
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Quotações" value={histórico.filter(h => h.tipo === 'quotacao').length} />
        <StatCard label="Fretes Aceitos" value={histórico.filter(h => h.tipo === 'aceita').length} />
        <StatCard label="Avaliação Média" value={user.avaliacaoMedia?.toFixed(1) || '—'} />
        <StatCard label="Saldo em Créditos" value={`R$ ${user.saldoCreditos?.toFixed(2) || '0.00'}`} />
      </div>
      
      {/* Histórico de atividades */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Histórico de Atividades</h2>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {histórico.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {getIconoAtividade(item.tipo)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.descricao}</p>
                <p className="text-sm text-gray-500">{new Date(item.data).toLocaleString('pt-BR')}</p>
              </div>
              {item.valor && <p className="font-semibold">{item.valor}</p>}
            </div>
          ))}
        </div>
      </div>
      
      {/* Dados sensíveis */}
      {!editando && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Informações Pessoais</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <InfoField label="CPF/CNPJ" value={maskCpf(user.cpf)} hidden visible={user.id === (await getCurrentUser()).id} />
            <InfoField label="Telefone" value={user.telefone} />
            <InfoField label="Endereco" value={`${user.endereco.rua}, ${user.endereco.numero}`} />
            <InfoField label="CEP" value={user.endereco.cep} />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 3. CUSTOMER VALIDATION

### ✅ Validation Rules
```javascript
// backend/validators/customer.js
export const validateCustomer = async (data) => {
  const errors = [];
  
  // 1. Validar duplicatas por CPF/CNPJ
  const existing = await prisma.user.findFirst({
    where: { cpf: cleanCpf(data.cpf) }
  });
  
  if (existing && existing.id !== data.id) {
    errors.push('CPF/CNPJ já registrado');
  }
  
  // 2. Validar emails únicos
  const emailExists = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase() }
  });
  
  if (emailExists && emailExists.id !== data.id) {
    errors.push('Email já registrado');
  }
  
  // 3. Validar formato CPF/CNPJ
  if (!isValidCpf(data.cpf) && !isValidCnpj(data.cpf)) {
    errors.push('CPF/CNPJ inválido');
  }
  
  // 4. Validar dados obrigatórios
  if (!data.nome || data.nome.trim().length < 5) {
    errors.push('Nome muito curto');
  }
  
  return errors;
};

// Middleware para aplicar validação
app.post('/api/usuarios/registrar', async (req, res) => {
  const errors = await validateCustomer(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ erros: errors });
  }
  
  // Continuar com registro
});
```

---

## 4. DATA IMPORT/EXPORT

### 📥 Bulk Import
```javascript
// src/pages/admin/ImportProdutos.jsx
export function ImportProdutos() {
  const [file, setFile] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  
  const handleImport = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setImportando(true);
      const res = await apiClient.post('/admin/produtos/importar', formData);
      setResultado(res.data);  // { sucesso: 100, erros: 5, mensagens: [...] }
    } catch (err) {
      toast.error('Erro ao importar');
    } finally {
      setImportando(false);
    }
  };
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Importar Produtos</h1>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <p className="text-sm">
          Formato esperado: CSV com colunas: <code>nome,descricao,ncmCodigo,peso,preco</code>
        </p>
        <a
          href="/template-produtos.csv"
          className="text-blue-600 hover:underline text-sm"
        >
          📥 Baixar template
        </a>
      </div>
      
      <form onSubmit={handleImport} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          required
          className="block w-full"
        />
        
        <button
          type="submit"
          disabled={!file || importando}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {importando ? 'Importando...' : 'Importar'}
        </button>
      </form>
      
      {resultado && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="font-bold mb-2">Resultado</h2>
          <p>✅ {resultado.sucesso} produtos importados</p>
          {resultado.erros > 0 && <p>❌ {resultado.erros} erros</p>}
          {resultado.mensagens.map((msg, idx) => (
            <p key={idx} className="text-sm text-gray-600">{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Success Metrics
✅ 100% validação de dados antes do BD  
✅ Zero duplicatas de clientes  
✅ Importação < 5s (10K registros)  
✅ Histórico de cada cliente auditavel  
✅ Dados master sempre sincronizados  

---

**Próxima Skill:** SKILLS INDEX (Central Repository)
