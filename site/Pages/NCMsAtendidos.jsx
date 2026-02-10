import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/entities/User";
import { NCM } from "@/entities/NCM";
import { NCMAtendido } from "@/entities/NCMAtendido";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, Search, ToggleLeft, ToggleRight } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export default function NCMsAtendidos() {
  const [user, setUser] = useState(null);
  const [ncmsAtendidos, setNcmsAtendidos] = useState([]);
  const [ncmsDisponiveis, setNcmsDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedNCM, setSelectedNCM] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const userData = await User.me();
      setUser(userData);

      const [atendidosData, ncmsData] = await Promise.all([
        NCMAtendido.filter({ transportadoraId: userData.perfilAtivoId }),
        NCM.list()
      ]);

      setNcmsAtendidos(atendidosData || []);
      setNcmsDisponiveis(ncmsData || []);

      if (selectedNCM) {
        const fresh = ncmsData.find((n) => n.code === selectedNCM.code);
        setSelectedNCM(fresh || null);
      }
    } catch (err) {
      console.error("Erro ao carregar NCMs:", err);
      setError("Não foi possível carregar os NCMs agora.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const getNcmDetails = (code) => ncmsDisponiveis.find((n) => n.code === code);

  const handleToggle = async (ncm = selectedNCM) => {
    if (!ncm || !user) return;
    setError("");
    setActionLoading(true);

    const ativo = ncmsAtendidos.find((n) => n.ncmCode === ncm.code);

    try {
      if (ativo) {
        await NCMAtendido.delete(ativo.id);
      } else {
        await NCMAtendido.create({
          transportadoraId: user.perfilAtivoId,
          ncmCode: ncm.code,
        });
      }

      await loadData(true);
      setSelectedNCM(ncm);
    } catch (err) {
      console.error("Erro ao alternar NCM:", err);
      setError("Erro ao atualizar NCM. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const availableOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = ncmsDisponiveis.filter((ncm) =>
      !term ||
      ncm.code.includes(term) ||
      ncm.name.toLowerCase().includes(term)
    );
    return filtered.slice(0, 15);
  }, [ncmsDisponiveis, searchTerm]);

  const filteredAtendidos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ncmsAtendidos.filter((n) => {
      const details = getNcmDetails(n.ncmCode);
      if (!term) return true;
      return (
        n.ncmCode.includes(searchTerm) ||
        (details?.name || "").toLowerCase().includes(term)
      );
    });
  }, [ncmsAtendidos, searchTerm, ncmsDisponiveis]);

  const selectedIsActive = selectedNCM
    ? ncmsAtendidos.some((n) => n.ncmCode === selectedNCM.code)
    : false;

  if (loading) {
    return <LoadingSpinner message="Carregando NCMs..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <PageHeader
        title="NCMs Atendidos"
        description="Busque qualquer NCM, veja detalhes e ative/desative rapidamente"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white border rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Buscar NCM</p>
              <p className="text-xs text-gray-500">Use o código ou parte do nome para localizar</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {ncmsDisponiveis.length} NCMs cadastrados
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Ex: 48025499 ou PAPEL COUCHE"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="mt-4 border rounded-lg divide-y max-h-72 overflow-y-auto">
            {availableOptions.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhum NCM encontrado.</div>
            ) : (
              availableOptions.map((ncm) => {
                const ativo = ncmsAtendidos.some((n) => n.ncmCode === ncm.code);
                return (
                  <button
                    key={ncm.code}
                    type="button"
                    onClick={() => setSelectedNCM(ncm)}
                    className="w-full flex items-start justify-between gap-3 p-3 text-left hover:bg-blue-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-100 text-blue-800 font-mono text-[11px]">
                          {ncm.code}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{ncm.name}</p>
                      {ncm.classification && (
                        <p className="text-xs text-gray-500 line-clamp-1">{ncm.classification}</p>
                      )}
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      Selecionar
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {selectedNCM && (
          <Card className="mb-6 border-blue-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Badge className="bg-blue-100 text-blue-800 font-mono text-xs mb-1">
                      {selectedNCM.code}
                    </Badge>
                    <p className="font-semibold text-gray-900">{selectedNCM.name}</p>
                    {selectedNCM.classification && (
                      <p className="text-xs text-gray-500">{selectedNCM.classification}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={selectedIsActive ? "text-green-700 border-green-200" : "text-gray-600"}>
                    {selectedIsActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    onClick={() => handleToggle(selectedNCM)}
                    disabled={actionLoading}
                    className="min-w-[160px]"
                    variant={selectedIsActive ? "outline" : "default"}
                  >
                    {selectedIsActive ? (
                      <>
                        <ToggleLeft className="w-4 h-4 mr-2" />
                        Desativar NCM
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 mr-2" />
                        Ativar NCM
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {ncmsAtendidos.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum NCM ativo"
            description="Ative os NCMs que sua transportadora atende para receber cotações compatíveis"
            actionLabel="Buscar NCM"
            actionUrl="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAtendidos.map((ncmAtendido) => {
              const ncmDetails = getNcmDetails(ncmAtendido.ncmCode);
              return (
                <Card
                  key={ncmAtendido.id || ncmAtendido.ncmCode}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Badge className="mb-1 bg-blue-100 text-blue-800 font-mono text-xs">
                            {ncmAtendido.ncmCode}
                          </Badge>
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {ncmDetails?.name || "NCM não encontrado"}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {ncmDetails?.classification && (
                      <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        {ncmDetails.classification}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(ncmDetails || { code: ncmAtendido.ncmCode })}
                      disabled={actionLoading}
                      className="w-full text-red-600 hover:bg-red-50"
                    >
                      <ToggleLeft className="w-4 h-4 mr-1" />
                      Desativar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
