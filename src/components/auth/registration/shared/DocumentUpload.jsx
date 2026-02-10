import React, { useState } from 'react';
import { Upload, FileText, Trash2, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { validateDocument, getValidDocumentTypes } from '@/utils/validators';

/**
 * Componente de upload de múltiplos documentos
 */
export default function DocumentUpload({
  documents = [],
  onDocumentsChange,
  requiredDocuments = [],
  allowMultiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
}) {
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  const allDocTypes = getValidDocumentTypes();

  // Calcular quais documentos já foram adicionados
  const addedTypes = documents.map(d => d.tipo);
  const missingTypes = requiredDocuments.filter(t => !addedTypes.includes(t));
  const hasMissingDocs = missingTypes.length > 0;

  const handleFileSelect = (e, documentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validation = validateDocument(file, documentType);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [documentType]: validation.error }));
      return;
    }

    // Simular upload (em produção, fazer upload de verdade pro S3 ou similar)
    setUploadingDoc(documentType);
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    setErrors(prev => { const newErrors = { ...prev }; delete newErrors[documentType]; return newErrors; });

    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[documentType] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setUploadingDoc(null);
          return prev;
        }
        return { ...prev, [documentType]: current + Math.random() * 30 };
      });
    }, 300);

    // Simular conclusão do upload
    setTimeout(() => {
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));

      // Criar URL local (em produção, seria URL do S3)
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDoc = {
          id: `doc_${Date.now()}`,
          tipo: documentType,
          file: file,
          nome: file.name,
          tamanho: file.size,
          url: e.target?.result,
          status: 'pendente_analise',
          uploadedAt: new Date(),
        };

        // Remover doc anterior do mesmo tipo se não permitir múltiplos
        let updatedDocs = documents;
        if (!allowMultiple) {
          updatedDocs = documents.filter(d => d.tipo !== documentType);
        }

        updatedDocs = [...updatedDocs, newDoc];

        if (onDocumentsChange) {
          onDocumentsChange(updatedDocs);
        }

        setUploadProgress(prev => { const newProgress = { ...prev }; delete newProgress[documentType]; return newProgress; });
      };
      reader.readAsDataURL(file);
    }, 2000);
  };

  const handleRemoveDocument = (docId) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocs);
    }
  };

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.nome;
    link.click();
  };

  // Agrupar documentos por tipo
  const documentsByType = {};
  documents.forEach(doc => {
    if (!documentsByType[doc.tipo]) {
      documentsByType[doc.tipo] = [];
    }
    documentsByType[doc.tipo].push(doc);
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Documentos Obrigatórios</h3>

        {/* Alerta de documentos faltando */}
        {hasMissingDocs && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-2">Documentos faltando:</p>
              <ul className="list-disc list-inside space-y-1">
                {missingTypes.map(type => (
                  <li key={type}>{allDocTypes[type]?.name || type}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Alerta de sucesso se todos os docs */}
        {!hasMissingDocs && requiredDocuments.length > 0 && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-200">Todos os documentos obrigatórios foram enviados</p>
          </div>
        )}

        {/* Grade de documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requiredDocuments.map(docType => {
            const uploadeds = documentsByType[docType] || [];
            const isUploading = uploadingDoc === docType;
            const progress = uploadProgress[docType] || 0;
            const docTypeInfo = allDocTypes[docType];
            const hasError = errors[docType];

            return (
              <div key={docType} className={`border-2 rounded-lg p-4 transition-all ${
                hasError
                  ? 'border-red-500 bg-red-900/20'
                  : uploadeds.length > 0
                  ? 'border-green-600 bg-green-900/20'
                  : 'border-gray-700 bg-gray-900/30'
              }`}>
                {/* Tipo de documento */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-white">{docTypeInfo?.name || docType}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {docTypeInfo?.mimeTypes.map(m => m.split('/')[1]).join(', ')} • Máx 10MB
                    </p>
                  </div>
                  {uploadeds.length > 0 && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Documentos enviados */}
                {uploadeds.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {uploadeds.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-black/30 rounded p-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-300 truncate">{doc.nome}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.tamanho / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1 hover:bg-red-600 rounded transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload */}
                <div>
                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Enviando...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded border-2 border-dashed border-gray-600 cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-300">
                        {uploadeds.length > 0 ? 'Alterar' : 'Enviar'}
                      </span>
                      <input
                        type="file"
                        onChange={(e) => handleFileSelect(e, docType)}
                        accept={allDocTypes[docType]?.mimeTypes.join(',')}
                        className="hidden"
                      />
                    </label>
                  )}
                  {hasError && (
                    <p className="text-xs text-red-400 mt-2 flex gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {hasError}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentos opcionais */}
      {Object.keys(allDocTypes).length > requiredDocuments.length && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Documentos Adicionais</h3>
          <p className="text-sm text-gray-400 mb-4">
            Você pode adicionar outros documentos que ajudem na análise do seu cadastro
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(allDocTypes).map(([type, info]) => {
              if (requiredDocuments.includes(type)) return null;

              const uploadeds = documentsByType[type] || [];
              const isUploading = uploadingDoc === type;
              const progress = uploadProgress[type] || 0;

              return (
                <div key={type} className="border-2 border-gray-700 bg-gray-900/30 rounded-lg p-4 hover:border-gray-600 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{info.name}</h4>
                      {uploadeds.length > 0 && (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-2" />
                      )}
                    </div>
                  </div>

                  {uploadeds.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {uploadeds.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-black/30 rounded p-1.5 text-xs">
                          <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          <button
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-0.5 hover:bg-red-600 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isUploading ? (
                    <div className="text-xs text-gray-400 mb-2">
                      Enviando... {Math.round(progress)}%
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 cursor-pointer transition-all text-xs">
                      <Upload className="w-3 h-3" />
                      <span>Adicionar</span>
                      <input
                        type="file"
                        onChange={(e) => handleFileSelect(e, type)}
                        accept={info.mimeTypes.join(',')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
