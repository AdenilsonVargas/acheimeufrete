import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Guard que bloqueia acesso de transportadores que não geraram código diário
 * Redireciona automaticamente para página de geração de código
 */
export default function TransportadoraCodigoGuard({ children, user, currentPageName }) {
  // Se não é transportador, libera acesso imediatamente
  if (!user || user.tipo !== 'transportador') {
    return <>{children}</>;
  }

  // Se está na página de código diário, libera (senão loop infinito)
  if (currentPageName === 'CodigoDiarioTransportadora') {
    return <>{children}</>;
  }

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil-transportadora-guard', user.perfilAtivoId],
    queryFn: async () => {
      const perfilData = await base44.entities.PerfilTransportadora.get(user.perfilAtivoId);
      return perfilData;
    },
    enabled: !!user && user.tipo === 'transportadora'
  });

  function codigoValido(perfil) {
    if (!perfil || !perfil.codigoDiario || !perfil.dataCodigoDiario) {
      return false;
    }

    const hoje = new Date().toISOString().split('T')[0];
    return perfil.dataCodigoDiario === hoje;
  }

  // Loading
  if (isLoading || !perfil) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Se código válido, libera acesso
  if (codigoValido(perfil)) {
    return <>{children}</>;
  }

  // Código inválido - bloqueia
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-6">
      <div className="max-w-2xl w-full">
        <Alert className="bg-orange-900/20 border-orange-500/50 mb-6">
          <Shield className="h-6 w-6 text-orange-500" />
          <AlertDescription className="ml-2 text-orange-200">
            <h3 className="font-bold text-lg mb-2 text-orange-100">
              🔒 Acesso Bloqueado - Código Diário Necessário
            </h3>
            <p className="mb-4">
              Por questões de segurança, você precisa gerar o <strong>código de coleta diário</strong> antes de acessar o sistema.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-orange-500/30 mb-4">
              <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                <Key className="w-5 h-5" />
                O que é o código de coleta?
              </h4>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                <li>Código único gerado diariamente para confirmar coletas</li>
                <li>Protege você e o embarcador contra fraudes</li>
                <li>Deve ser informado ao embarcador no momento da coleta</li>
                <li>Confirma que o produto está com você (transportador)</li>
              </ul>
            </div>
            <Button
              onClick={() => window.location.href = createPageUrl('CodigoDiarioTransportadora')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              <Key className="w-5 h-5 mr-2" />
              Gerar Código Diário Agora
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
                onClick={handleRedirecionarCodigo}
                disabled={redirecionando}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {redirecionando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Gerar Código de Coleta Agora
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Código válido, libera acesso
  return <>{children}</>;
}
