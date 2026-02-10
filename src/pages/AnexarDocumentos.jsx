import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Paperclip, Upload, FileCheck } from 'lucide-react';

export default function AnexarDocumentos() {
  const { user } = useAuthStore();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [tipo, setTipo] = useState('rg');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.credencial.filter({ usuarioId: user?.id, limit: 50 });
        setDocumentos(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleUpload = async () => {
    if (!arquivo) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipo', tipo);
      formData.append('usuarioId', user?.id);

      await api.files.uploadCredencial(formData);
      setDocumentos([...documentos, { tipo, dataUpload: new Date(), status: 'pendente_validacao' }]);
      setArquivo(null);
      alert('Documento enviado com sucesso!');
    } catch (err) {
      console.error('Erro ao fazer upload', err);
      alert('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const tiposDocumento = [
    { value: 'rg', label: 'RG' },
    { value: 'cpf', label: 'CPF' },
    { value: 'cnh', label: 'CNH' },
    { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
    { value: 'documento_veiculo', label: 'Documento do Veículo' },
    { value: 'seguro_veiculo', label: 'Seguro do Veículo' }
  ];

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Paperclip className="w-8 h-8 text-blue-600" /> Anexar Documentos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-4">Documentos Anexados</h2>
            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : documentos.length === 0 ? (
              <p className="text-slate-300">Nenhum documento anexado ainda</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                    <div className="flex items-center gap-2">
                      <FileCheck className={`w-5 h-5 ${d.status === 'validado' ? 'text-green-400' : 'text-orange-400'}`} />
                      <div>
                        <p className="text-white font-semibold capitalize">{d.tipo.replace('_', ' ')}</p>
                        <p className="text-slate-400 text-sm">{new Date(d.dataUpload).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${d.status === 'validado' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                      {d.status === 'validado' ? '✓ Validado' : 'Aguardando'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Enviar
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Tipo de Documento</label>
                <select 
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="input-field w-full"
                >
                  {tiposDocumento.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Arquivo (PDF, JPG ou PNG)</label>
                <input 
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setArquivo(e.target.files?.[0])}
                  className="input-field w-full text-sm"
                />
                {arquivo && <p className="text-slate-400 text-sm mt-1">{arquivo.name}</p>}
              </div>

              <button 
                onClick={handleUpload}
                disabled={!arquivo || uploading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>

            <p className="text-slate-400 text-xs mt-4 pt-4 border-t border-slate-700">
              Máximo 10MB por arquivo. Envie cópias claras e legíveis.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
