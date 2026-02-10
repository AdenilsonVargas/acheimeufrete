# 📊 SKILL D: DATA DISPLAY & TABLES
## Tabelas, Paginação, Filtros, Listas (Padrão para exibição de dados)

> **OBJETIVO:** Tabelas profissionais, paginação suave, filtros rápidos, dark mode perfeito

---

## 1. DATATABLE COMPONENT

### 🏗️ Componente Base Reutilizável
```javascript
// src/components/DataTable.jsx
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Loader } from 'lucide-react';

export function DataTable({
  data = [],
  columns = [],
  pagination = true,
  pageSize = 10,
  filterable = true,
  sortable = true,
  selectable = false,
  loading = false,
  onRowClick,
  exportable = false,
  dark = false
}) {
  const [sort, setSort] = useState({ field: null, direction: 'asc' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  
  // Filtrar
  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);
  
  // Ordenar
  const sorted = useMemo(() => {
    if (!sort.field) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);
  
  // Paginar
  const paged = useMemo(() => {
    if (!pagination) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);
  
  const totalPages = Math.ceil(sorted.length / pageSize);
  
  // Handle sort
  const handleSort = (field) => {
    if (!sortable) return;
    
    if (sort.field === field) {
      setSort({
        ...sort,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSort({ field, direction: 'asc' });
    }
    setPage(1);
  };
  
  // Export CSV
  const handleExport = () => {
    const csv = [
      columns.map(col => col.label).join(','),
      ...sorted.map(row =>
        columns.map(col => `"${row[col.field] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }
  
  if (paged.length === 0) {
    return (
      <div className={`p-12 text-center rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <Search className={`w-12 h-12 mx-auto mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
        <p className={dark ? 'text-gray-400' : 'text-gray-600'}>
          Nenhum resultado encontrado
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4">
        {filterable && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors
                ${dark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>
        )}
        
        {exportable && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        )}
      </div>
      
      {/* Table */}
      <div className={`overflow-x-auto rounded-lg border ${dark ? 'border-gray-700' : 'border-gray-300'}`}>
        <table className={`w-full text-sm ${dark ? 'bg-gray-800' : 'bg-white'}`}>
          <thead className={dark ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-100 border-b border-gray-300'}>
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selected.length === paged.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? paged.map((_, i) => i) : [])
                    }
                  />
                </th>
              )}
              
              {columns.map(col => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`px-6 py-3 font-semibold text-left ${
                    sortable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''
                  } ${dark ? 'text-gray-300' : 'text-gray-900'}`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable && (
                      <div className="w-4 h-4">
                        {sort.field === col.field && (
                          sort.direction === 'asc' ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {paged.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`border-t transition-colors ${
                  dark
                    ? 'border-gray-700 hover:bg-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectable && (
                  <td className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selected.includes(idx)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, idx]
                            : selected.filter(s => s !== idx)
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                
                {columns.map(col => (
                  <td
                    key={col.field}
                    className={`px-6 py-3 ${dark ? 'text-gray-300' : 'text-gray-900'}`}
                  >
                    {col.render ? col.render(row[col.field], row) : row[col.field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, sorted.length)} de {sorted.length}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ← Anterior
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : `border hover:bg-gray-100 dark:hover:bg-gray-700`
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 🔗 Uso em Página de Quotações
```javascript
// src/pages/MinhasQuotacoes.jsx
import { DataTable } from '@/components/DataTable';
import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';

export default function MinhasQuotacoes() {
  const [quotacoes, setQuotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/quotacoes/minhas');
        setQuotacoes(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  
  const columns = [
    {
      field: 'id',
      label: 'ID',
      render: (id) => <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{id.slice(0, 8)}</code>
    },
    {
      field: 'origem',
      label: 'Origem',
      render: (_, row) => `${row.cidadeOrigem} - ${row.cepOrigem}`
    },
    {
      field: 'destino',
      label: 'Destino',
      render: (_, row) => `${row.cidadeDestino} - ${row.cepDestino}`
    },
    {
      field: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
          status === 'aguardando' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
          status === 'aceita' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
          'bg-gray-100 text-gray-800 dark:bg-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      field: 'propostas',
      label: 'Propostas',
      render: (_, row) => <strong>{row._count.propostas}</strong>
    },
    {
      field: 'valor',
      label: 'Valor Est.',
      render: (valor) => valor ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
    },
    {
      field: 'ações',
      label: 'Ações',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/quotacao/${row.id}`)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => deletarQuotacao(row.id)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Deletar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Minhas Quotações</h1>
      
      <DataTable
        data={quotacoes}
        columns={columns}
        loading={loading}
        pagination
        pageSize={15}
        filterable
        sortable
        exportable
        dark={user?.darkMode}
      />
    </div>
  );
}
```

---

## 2. EMPTY STATES & SKELETONS

### 💀 Loading Skeleton
```javascript
// src/components/TableSkeleton.jsx
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ))}
    </div>
  );
}
```

### 🎨 Empty State
```javascript
// src/components/EmptyState.jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="p-12 text-center rounded-lg bg-gray-50 dark:bg-gray-800">
      <Icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      {action && action}
    </div>
  );
}
```

---

## 🎯 Success Metrics
✅ Tabelas renderizam < 500ms (1000+ linhas)  
✅ Paginação suave (zero lag)  
✅ Filtro responde em < 100ms  
✅ Dark mode perfeito  
✅ Acessível (WCAG AA)

---

**Próxima Skill:** SKILL E - Notifications & Feedback
