# 👮 SKILL G: ADMIN & MODERATION SYSTEM
## Dashboard, Auditing, Compliance, Dispute Resolution

> **OBJETIVO:** Admin poderoso, auditoria completa, compliance garantido

---

## 1. ADMIN DASHBOARD

### 📊 Overview Dashboard
```javascript
// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity, Users, DollarSign, AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      const res = await apiClient.get('/admin/stats');
      setStats(res.data);
      setLoading(false);
    })();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Usuários Ativos"
          value={stats.usuariosAtivos}
          change={`+${stats.usuariosNovos} hoje`}
        />
        <StatCard
          icon={DollarSign}
          label="Receita (30 dias)"
          value={`R$ ${stats.receita30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={stats.receitaGrowth > 0 ? `+${stats.receitaGrowth}%` : `${stats.receitaGrowth}%`}
        />
        <StatCard
          icon={Activity}
          label="Quotações (30 dias)"
          value={stats.quotacoes30d}
          change={`${stats.quotacoesGrowth > 0 ? '+' : ''}${stats.quotacoesGrowth}%`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Documentos Pendentes"
          value={stats.docsPendentes}
          urgent={stats.docsPendentes > 10}
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Receita por dia */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Receita (Últimos 30 dias)</h2>
          <LineChart width={400} height={250} data={stats.receita}>
            <CartesianGrid />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="valor" stroke="#3B82F6" />
          </LineChart>
        </div>
        
        {/* Status de quotações */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Status das Quotações</h2>
          <BarChart width={400} height={250} data={stats.statusQuotacoes}>
            <CartesianGrid />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </div>
      </div>
      
      {/* Alertas recentes */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Alertas Recentes</h2>
        <AlertsList alerts={stats.alertasRecentes} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, urgent = false }) {
  return (
    <div className={`p-4 rounded-lg ${urgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <Icon className={`w-5 h-5 ${urgent ? 'text-red-600' : 'text-blue-600'}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
    </div>
  );
}
```

---

## 2. USER MANAGEMENT

### 👥 User Management Table
```javascript
// src/pages/admin/Users.jsx
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const columns = [
    { field: 'id', label: 'ID' },
    { field: 'nome', label: 'Nome' },
    { field: 'email', label: 'Email' },
    {
      field: 'userType',
      label: 'Tipo',
      render: (type) => (
        <Badge status={type} label={
          type === 'embarcador' ? '📦 Embarcador' :
          type === 'transportador-pj' ? '🚚 Transportador PJ' :
          type === 'transportador-autonomo' ? '🏍️ Autônomo' :
          type
        } />
      )
    },
    {
      field: 'status',
      label: 'Status',
      render: (status) => (
        <Badge status={status === 'ativo' ? 'ativa' : 'cancelada'} />
      )
    },
    {
      field: 'dataRegistro',
      label: 'Registrado',
      render: (date) => new Date(date).toLocaleDateString('pt-BR')
    },
    {
      field: 'ações',
      label: 'Ações',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedUser(row); setShowModal(true); }}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            Editar
          </button>
          <button
            onClick={() => suspendUser(row.id)}
            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            Suspender
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Usuários</h1>
      
      <DataTable
        data={users}
        columns={columns}
        filterable
        sortable
        pagination
      />
      
      {/* Modal de edição */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

---

## 3. AUDIT LOG SYSTEM

### 📋 Audit Logger
```javascript
// backend/utils/auditLog.js
const logAction = async (userId, acao, recursos, detalhes) => {
  await prisma.auditLog.create({
    data: {
      usuarioId: userId,
      acao,  // 'login', 'criar_quotacao', 'aceitar_proposta', 'reembolsar', etc
      recurso: recursos,  // 'quotacao', 'usuario', 'pagamento', etc
      recursoId: detalhes.id,
      mudancas: JSON.stringify(detalhes),
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      timestamp: new Date()
    }
  });
};

// Middleware para logging automático
app.use('/api/*', async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data?.sucesso || res.statusCode === 200 || res.statusCode === 201) {
      const metodo = req.method;
      const recurso = req.path.split('/')[2];
      
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(metodo)) {
        logAction(req.userId, metodo, recurso, {
          path: req.path,
          dados: req.body
        });
      }
    }
    return originalJson.call(this, data);
  };
  
  next();
});
```

### 📊 Audit Log Viewer
```javascript
// src/pages/admin/AuditLog.jsx
export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ acao: '', recurso: '', dataInicio: null });
  
  useEffect(() => {
    (async () => {
      const res = await apiClient.get('/admin/audit-logs', { params: filters });
      setLogs(res.data);
    })();
  }, [filters]);
  
  const columns = [
    { field: 'timestamp', label: 'Data/Hora', render: (d) => new Date(d).toLocaleString('pt-BR') },
    { field: 'usuarioNome', label: 'Usuário' },
    { field: 'acao', label: 'Ação' },
    { field: 'recurso', label: 'Recursos' },
    { field: 'mudancas', label: 'Detalhes', render: (m) => <button onClick={() => showDetails(m)}>Ver</button> },
    { field: 'ipAddress', label: 'IP' }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Audit Log</h1>
      
      {/* Filtros */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Filtrar por ação"
          onChange={(e) => setFilters({ ...filters, acao: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        />
        <select
          onChange={(e) => setFilters({ ...filters, recurso: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        >
          <option>Todos os recursos</option>
          <option>quotacao</option>
          <option>usuario</option>
          <option>pagamento</option>
        </select>
        <input
          type="date"
          onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        />
      </div>
      
      <DataTable data={logs} columns={columns} />
    </div>
  );
}
```

---

## 4. DISPUTE RESOLUTION

### ⚖️ Dispute Management
```javascript
// src/pages/admin/Disputes.jsx
export function DisputeManagement() {
  const [disputes, setDisputes] = useState([]);
  const [filter, setFilter] = useState('abertos');
  
  useEffect(() => {
    (async () => {
      const res = await apiClient.get(`/admin/disputes?status=${filter}`);
      setDisputes(res.data);
    })();
  }, [filter]);
  
  const columns = [
    { field: 'id', label: 'ID', render: (id) => <code>{id.slice(0, 8)}</code> },
    { field: 'freteId', label: 'Frete' },
    { field: 'reclamente', label: 'Reclamante' },
    { field: 'motivo', label: 'Motivo' },
    { field: 'status', label: 'Status', render: (s) => <Badge status={s} /> },
    {
      field: 'ações',
      label: 'Ações',
      render: (_, row) => (
        <button
          onClick={() => resolveDispute(row.id)}
          className="px-3 py-1 bg-green-100 text-green-600 rounded"
        >
          Resolver
        </button>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Disputas</h1>
      
      <div className="mb-4 flex gap-2">
        {['abertos', 'em_revisao', 'resolvidos'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg ${filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {status.replace(/_/, ' ').toUpperCase()}
          </button>
        ))}
      </div>
      
      <DataTable data={disputes} columns={columns} />
    </div>
  );
}
```

---

## 🎯 Success Metrics
✅ Dashboard loads < 2s  
✅ Audit log 100% coverage  
✅ Compliance checks automated  
✅ Dispute resolution < 24h  
✅ Admin actions logged & reviewed

---

**Próxima Skill:** SKILL H - Product & Customer Management
