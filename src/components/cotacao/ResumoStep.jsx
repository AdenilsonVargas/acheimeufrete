import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const steps = [
  { id: 1, label: 'Criar Cotação', icon: AlertCircle },
  { id: 2, label: 'Receber Propostas', icon: Clock },
  { id: 3, label: 'Revisar Propostas', icon: AlertCircle },
  { id: 4, label: 'Aceitar Proposta', icon: CheckCircle2 },
  { id: 5, label: 'Finalizar', icon: CheckCircle2 },
];

export default function ResumoStep({ currentStep, cotacao, onBack, onNext, isLastStep = false }) {
  const percentage = (currentStep / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-300">Progresso</h3>
          <span className="text-sm text-gray-400">{currentStep} de {steps.length}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-600 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const Icon = step.icon;

          return (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                isActive 
                  ? 'bg-orange-600/20 border border-orange-500' 
                  : isCompleted
                  ? 'bg-green-600/10 border border-green-700'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isActive 
                  ? 'bg-orange-600 text-white' 
                  : isCompleted
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-gray-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`font-medium ${
                isActive || isCompleted ? 'text-white' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cotação Summary */}
      {cotacao && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-2">
          <h4 className="font-semibold text-white text-sm mb-3">Resumo da Cotação</h4>
          {cotacao.rota && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rota:</span>
              <span className="text-white">{cotacao.rota}</span>
            </div>
          )}
          {cotacao.peso && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Peso:</span>
              <span className="text-white">{cotacao.peso}kg</span>
            </div>
          )}
          {cotacao.valor && (
            <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
              <span className="text-gray-400">Valor Estimado:</span>
              <span className="text-orange-400 font-semibold">R$ {parseFloat(cotacao.valor).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={currentStep === 1}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition font-medium"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          className={`flex-1 px-4 py-2 rounded transition font-medium text-white ${
            isLastStep 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}
