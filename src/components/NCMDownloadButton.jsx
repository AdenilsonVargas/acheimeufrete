import React, { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';

/**
 * Botão para download da planilha de NCMs atualizada
 */
export default function NCMDownloadButton({ className = '' }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/ncms/download/planilha`);

      if (!response.ok) {
        throw new Error('Erro ao baixar planilha');
      }

      // Gerar blob e criar link de download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extrair nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'NCMs-MERCOSUL.xlsx';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar planilha NCM:', err);
      setError('Erro ao baixar planilha. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="text-xs text-blue-400 hover:text-blue-300 underline transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-2 rounded bg-red-900/20 border border-red-700/50">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
