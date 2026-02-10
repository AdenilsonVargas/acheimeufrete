import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AlertaLimitacoesSemBackend() {
  return (
    <Alert className="bg-amber-50 border-amber-300">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 text-sm">
        <strong>ℹ️ Limitações Atuais do Sistema de Atrasos:</strong>
        <ul className="mt-2 space-y-1 text-xs">
          <li>• A contagem de dias é atualizada apenas quando você acessa o sistema</li>
          <li>• Notificações de atraso não são enviadas automaticamente</li>
          <li>• O bloqueio por atraso precisa ser verificado manualmente por um admin</li>
          <li>• Multas são calculadas mas não aplicadas automaticamente</li>
          <li>• Para funcionalidades automáticas completas, é necessário o plano Builder com Backend Functions</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}