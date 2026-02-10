import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 rounded-lg border border-red-700 p-8 text-center">
          <div className="bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Usuário Não Registrado</h1>
          
          <p className="text-gray-400 mb-6">
            Sua conta não foi completamente registrada no sistema. Por favor, complete seu cadastro para continuar.
          </p>

          <div className="bg-red-900/10 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-300">
              <strong>Por que vejo isso?</strong> Você não finalizou o processo de registro ou seus dados não foram totalmente verificados.
            </p>
          </div>

          <Link
            to="/completar-cadastro"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-semibold group"
          >
            Completar Cadastro
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
