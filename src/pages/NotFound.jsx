import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-blue-950 flex flex-col">
      {/* Header globalizado em App.jsx */}

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Página não encontrada</h1>
          <p className="text-slate-300 mb-8 max-w-md">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Ir para Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
