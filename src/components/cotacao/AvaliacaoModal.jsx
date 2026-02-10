import React from 'react';
import { Star, MessageCircle, Eye } from 'lucide-react';

export default function AvaliacaoModal({ 
  isOpen, 
  onClose, 
  cotacao,
  onSubmit,
  isLoading = false
}) {
  const [form, setForm] = React.useState({
    rating: 5,
    comentario: '',
    recomenda: true
  });

  const handleSubmit = async () => {
    await onSubmit({
      cotacaoId: cotacao?.id,
      ...form
    });
    setForm({ rating: 5, comentario: '', recomenda: true });
    onClose();
  };

  if (!isOpen || !cotacao) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Avaliar Serviço</h2>
          <p className="text-sm text-gray-400">Cotação #{cotacao.id?.toString().slice(-6)}</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Avaliação (estrelas)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({...form, rating: star})}
                  className="p-1 transition"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= form.rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comentário (opcional)</label>
            <textarea
              value={form.comentario}
              onChange={(e) => setForm({...form, comentario: e.target.value})}
              placeholder="Descreva sua experiência..."
              className="input-field h-24 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recomenda"
              checked={form.recomenda}
              onChange={(e) => setForm({...form, recomenda: e.target.checked})}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="recomenda" className="text-sm text-gray-300 cursor-pointer">
              Eu recomendo este transportador
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}
