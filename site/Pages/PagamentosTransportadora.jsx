import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function PagamentosTransportadora() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="Pagamentos"
        description="Gerencie seus recebimentos e faturas"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Histórico de Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Nenhum recebimento registrado ainda</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
