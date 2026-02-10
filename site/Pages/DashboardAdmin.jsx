import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Credencial } from "@/entities/Credencial";
import { Cotacao } from "@/entities/Cotacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Building2, 
  FileText, 
  Clock,
  Shield
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DashboardLayout from "./common/DashboardLayout";

export default function DashboardAdmin() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    clientesPendentes: 0,
    transportadorasPendentes: 0,
    clientesAprovados: 0,
    transportadorasAprovadas: 0,
    totalCotacoes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const [credenciais, cotacoes] = await Promise.all([
        Credencial.list(),
        Cotacao.list()
      ]);

      // Buscar usuários para cada credencial
      const usuarios = await Promise.all(
        credenciais.map(async (cred) => {
          const users = await User.filter({ id: cred.userId });
          return users.length > 0 ? { ...cred, usuario: users[0] } : null;
        })
      );

      const usuariosFiltrados = usuarios.filter(u => u !== null);

      setStats({
        clientesPendentes: usuariosFiltrados.filter(u => u.tipo === "cliente" && u.usuario.status === "pending").length,
        transportadorasPendentes: usuariosFiltrados.filter(u => u.tipo === "transportadora" && u.usuario.status === "pending").length,
        clientesAprovados: usuariosFiltrados.filter(u => u.tipo === "cliente" && u.usuario.status === "approved").length,
        transportadorasAprovadas: usuariosFiltrados.filter(u => u.tipo === "transportadora" && u.usuario.status === "approved").length,
        totalCotacoes: cotacoes.length
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  const statCards = [
    {
      title: "Clientes Pendentes",
      value: stats.clientesPendentes,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Transportadoras Pendentes",
      value: stats.transportadorasPendentes,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Clientes Aprovados",
      value: stats.clientesAprovados,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Transportadoras Aprovadas",
      value: stats.transportadorasAprovadas,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total de Cotações",
      value: stats.totalCotacoes,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <Shield className="w-12 h-12 mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Aprovar Cadastros</h3>
            <p className="text-blue-100 mb-4 text-sm">
              Analise e aprove cadastros de clientes e transportadoras pendentes
            </p>
            <Link to={createPageUrl("AprovarCadastros")}>
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50">
                Ir para Aprovações
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
