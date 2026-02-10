import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Componente visual de passos de formulário
 * @param {number} currentStep - Passo atual (0-indexed)
 * @param {array} steps - Array com nomes dos passos
 * @param {string} title - Título do passo atual
 * @param {string} description - Descrição do passo atual
 */
export default function FormStepper({ currentStep = 0, steps = [], title, description }) {
  return (
    <div className="space-y-6 mb-8">
      {/* Barra de progresso */}
      <div className="bg-gray-800 rounded-lg p-4">
        {/* Indicador numérico */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Passo {currentStep + 1} de {steps.length}
          </span>
          <div className="w-full bg-gray-700 rounded-full h-2 mx-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>

        {/* Lista de passos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight
                  className={`w-4 h-4 mx-1 ${
                    index < currentStep ? 'text-blue-500' : 'text-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Título e descrição */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
        {description && (
          <p className="text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
}
