import React, { useState, useEffect } from 'react';
import { PeriodoFilter, MetricasPeriodo, TemaDetalhado } from '../types';
import {
  BarChart3,
  CheckSquare,
  BookOpen,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ListChecks,
  ChevronRight
} from 'lucide-react';

interface VisaoGeralViewProps {
  sheetUrl: string;
}

type VisaoSubTab = 'metricas' | 'lista-mestra';

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({ sheetUrl }) => {
  const [activeSubTab, setActiveSubTab] = useState<VisaoSubTab>('metricas');
  const [periodo, setPeriodo] = useState<PeriodoFilter>('semana');
  const [metricas, setMetricas] = useState<MetricasPeriodo | null>(null);
  const [temas, setTemas] = useState<TemaDetalhado[]>([]);
  const [temaSelecionado, setTemaSelecionado] = useState<TemaDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchMetricas = async () => {
    if (!sheetUrl) {
      setError('Configure a URL da planilha primeiro');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${sheetUrl}?action=getMetricas&periodo=${periodo}`);
      const result = await response.json();

      if (result.status === 'error') {
        setError(result.message || 'Erro ao carregar métricas');
      } else {
        setMetricas(result.data);
      }
    } catch (err) {
      setError('Erro ao conectar com a planilha');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemas = async () => {
    if (!sheetUrl) return;

    try {
      setLoading(true);
      const response = await fetch(`${sheetUrl}?action=getListaMestraTemas`);
      const result = await response.json();

      if (result.status === 'error') {
        setError(result.message || 'Erro ao carregar temas');
      } else {
        setTemas(result.data);
      }
    } catch (err) {
      setError('Erro ao conectar com a planilha');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'metricas') {
      fetchMetricas();
    } else {
      fetchTemas();
    }
  }, [sheetUrl, periodo, activeSubTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-red-900">Erro</h3>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  const getPeriodoLabel = (p: PeriodoFilter) => {
    const labels = {
      dia: 'Hoje',
      semana: 'Esta Semana',
      mes: 'Este Mês',
      trimestre: 'Este Trimestre'
    };
    return labels[p];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        <button
          onClick={() => activeSubTab === 'metricas' ? fetchMetricas() : fetchTemas()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveSubTab('metricas')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSubTab === 'metricas'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Métricas
        </button>
        <button
          onClick={() => setActiveSubTab('lista-mestra')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSubTab === 'lista-mestra'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Lista Mestra
        </button>
      </div>

      {/* Conteúdo baseado na sub-tab */}
      {activeSubTab === 'metricas' ? (
        <>
          {/* Filtro de Período */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Período</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['dia', 'semana', 'mes', 'trimestre'] as PeriodoFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    periodo === p
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getPeriodoLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Métricas */}
          {metricas && (
            <div className="grid grid-cols-2 gap-3">
              {/* Questões Realizadas */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-600 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Questões</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-900">{metricas.questoesRealizadas}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">realizadas</p>
              </div>

              {/* Acertos */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-600 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-green-900 uppercase tracking-wide">Acertos</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-900">{metricas.acertos}</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {metricas.questoesRealizadas > 0
                    ? `${((metricas.acertos / metricas.questoesRealizadas) * 100).toFixed(1)}% de acerto`
                    : 'sem questões'}
                </p>
              </div>

              {/* Temas Estudados (Primeira Vez) */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-600 rounded-lg">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Novos</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-900">{metricas.temasEstudados}</span>
                </div>
                <p className="text-xs text-purple-700 mt-1">temas estudados (1ª vez)</p>
              </div>

              {/* Temas Revisados */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-600 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">Revisados</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-900">{metricas.temasRevisados}</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">temas revisados</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Lista Mestra de Temas */}
          {!temaSelecionado ? (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide px-2">
                Selecione um tema para ver detalhes
              </h3>
              {temas.map((tema, index) => (
                <div
                  key={index}
                  onClick={() => setTemaSelecionado(tema)}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tema.tema}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tema.quantidadeRevisoes} revisões • {tema.totalQuestoes} questões
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Botão Voltar */}
              <button
                onClick={() => setTemaSelecionado(null)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                ← Voltar para lista
              </button>

              {/* Detalhes do Tema */}
              <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{temaSelecionado.tema}</h3>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">Primeiro Estudo</p>
                    <p className="text-sm font-bold text-blue-900 mt-1">{temaSelecionado.dataPrimeiroEstudo}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">Questões</p>
                    <p className="text-sm font-bold text-green-900 mt-1">
                      {temaSelecionado.totalAcertos} / {temaSelecionado.totalQuestoes}
                    </p>
                  </div>
                </div>

                {/* Revisões */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">
                    Revisões ({temaSelecionado.quantidadeRevisoes})
                  </h4>
                  <div className="space-y-2">
                    {temaSelecionado.revisoes.map((revisao, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Revisão {idx + 1}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{revisao.data}</p>
                        </div>
                        {revisao.remarcada && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            Remarcada
                            {revisao.dataOriginal && (
                              <span className="ml-1 text-[10px]">({revisao.dataOriginal})</span>
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
