import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  FileText,
  PieChart
} from 'lucide-react';

interface DashboardViewProps {
  sheetUrl: string;
}

interface TopicStats {
  tema: string;
  totalQuestoes: number;
  totalAcertos: number;
  percentual: number;
  cor: string;
}

interface AreaStats {
  area: string;
  totalQuestoes: number;
  totalAcertos: number;
  percentual: number;
}

interface DailyActivity {
  date: string;
  revisoes: number;
  simulados: number;
}

interface DashboardData {
  topicStats: TopicStats[];
  areaStats: AreaStats[];
  dailyActivity: DailyActivity[];
  totalRevisoes: number;
  totalSimulados: number;
  totalQuestoesRevisoes: number;
  totalAcertosRevisoes: number;
  totalQuestoesSimulados: number;
  totalAcertosSimulados: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ sheetUrl }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'revisoes' | 'simulados'>('revisoes');

  const fetchData = async () => {
    if (!sheetUrl) {
      setError('Configure a URL da planilha primeiro');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = new URL(sheetUrl);
      url.searchParams.set('action', 'getDashboardData');

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.status === 'success') {
        setData(result.data);
      } else {
        setError(result.message || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      setError('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sheetUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <strong className="text-red-900">Erro</strong>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const BarChartComponent = ({ data: chartData, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) => {
    return (
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700 truncate">{item.label}</span>
              <span className="font-bold text-gray-900">{item.value}</span>
            </div>
            <div className="w-full h-6 bg-gray-100 rounded-lg overflow-hidden relative">
              <div
                className={`h-full ${item.color} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              >
                {item.value > 0 && (
                  <span className="text-xs font-bold text-white drop-shadow">
                    {((item.value / maxValue) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const DailyActivityChart = ({ activities }: { activities: DailyActivity[] }) => {
    const maxValue = Math.max(...activities.map(a => a.revisoes + a.simulados), 1);

    return (
      <div className="flex items-end justify-between gap-1 h-32">
        {activities.slice(-14).map((activity, index) => {
          const totalHeight = ((activity.revisoes + activity.simulados) / maxValue) * 100;
          const revisoesHeight = (activity.revisoes / (activity.revisoes + activity.simulados || 1)) * totalHeight;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col-reverse items-center gap-0.5 h-24">
                {activity.revisoes > 0 && (
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${revisoesHeight}%` }}
                    title={`${activity.revisoes} revisões`}
                  ></div>
                )}
                {activity.simulados > 0 && (
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                    style={{ height: `${totalHeight - revisoesHeight}%` }}
                    title={`${activity.simulados} simulados`}
                  ></div>
                )}
              </div>
              <span className="text-[9px] text-gray-500 font-medium">{activity.date.split('/')[0]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Análise completa do seu desempenho</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-blue-900">REVISÕES</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{data.totalRevisoes}</p>
          <p className="text-xs text-blue-700 mt-1">
            {data.totalQuestoesRevisoes} questões
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-purple-900">SIMULADOS</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{data.totalSimulados}</p>
          <p className="text-xs text-purple-700 mt-1">
            {data.totalQuestoesSimulados} questões
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('revisoes')}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all border-b-2 ${
            activeSubTab === 'revisoes'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Revisões
        </button>
        <button
          onClick={() => setActiveSubTab('simulados')}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all border-b-2 ${
            activeSubTab === 'simulados'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Simulados
        </button>
      </div>

      {/* Conteúdo das Sub-tabs */}
      {activeSubTab === 'revisoes' && (
        <div className="space-y-4">
          {/* Performance Geral */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800">PERFORMANCE GERAL</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Total de Questões</span>
                  <span className="text-sm font-bold text-gray-900">{data.totalQuestoesRevisoes}</span>
                </div>
                <ProgressBar value={data.totalQuestoesRevisoes} max={data.totalQuestoesRevisoes} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Acertos</span>
                  <span className="text-sm font-bold text-green-900">
                    {data.totalAcertosRevisoes} ({data.totalQuestoesRevisoes > 0 ? ((data.totalAcertosRevisoes / data.totalQuestoesRevisoes) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <ProgressBar value={data.totalAcertosRevisoes} max={data.totalQuestoesRevisoes} color="bg-green-500" />
              </div>
            </div>
          </div>

          {/* Desempenho por Tema */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800">DESEMPENHO POR TEMA</h3>
            </div>
            {data.topicStats.length > 0 ? (
              <BarChartComponent
                data={data.topicStats.map(t => ({
                  label: t.tema,
                  value: t.totalAcertos,
                  color: t.cor === 'Verde' ? 'bg-green-500' : t.cor === 'Amarelo' ? 'bg-yellow-500' : 'bg-red-500'
                }))}
                maxValue={Math.max(...data.topicStats.map(t => t.totalAcertos), 1)}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum tema com questões ainda</p>
            )}
          </div>

          {/* Questões por Tema */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800">QUESTÕES POR TEMA</h3>
            </div>
            {data.topicStats.length > 0 ? (
              <BarChartComponent
                data={data.topicStats.map(t => ({
                  label: t.tema,
                  value: t.totalQuestoes,
                  color: t.cor === 'Verde' ? 'bg-green-400' : t.cor === 'Amarelo' ? 'bg-yellow-400' : 'bg-red-400'
                }))}
                maxValue={Math.max(...data.topicStats.map(t => t.totalQuestoes), 1)}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum tema registrado ainda</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'simulados' && (
        <div className="space-y-4">
          {/* Performance Geral Simulados */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800">PERFORMANCE GERAL</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Total de Questões</span>
                  <span className="text-sm font-bold text-gray-900">{data.totalQuestoesSimulados}</span>
                </div>
                <ProgressBar value={data.totalQuestoesSimulados} max={data.totalQuestoesSimulados} color="bg-purple-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Acertos</span>
                  <span className="text-sm font-bold text-green-900">
                    {data.totalAcertosSimulados} ({data.totalQuestoesSimulados > 0 ? ((data.totalAcertosSimulados / data.totalQuestoesSimulados) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <ProgressBar value={data.totalAcertosSimulados} max={data.totalQuestoesSimulados} color="bg-green-500" />
              </div>
            </div>
          </div>

          {/* Desempenho por Área */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800">DESEMPENHO POR ÁREA</h3>
            </div>
            {data.areaStats.length > 0 ? (
              <BarChartComponent
                data={data.areaStats.map(a => ({
                  label: a.area,
                  value: a.totalAcertos,
                  color: 'bg-purple-500'
                }))}
                maxValue={Math.max(...data.areaStats.map(a => a.totalAcertos), 1)}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum simulado registrado ainda</p>
            )}
          </div>

          {/* Questões por Área */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800">QUESTÕES POR ÁREA</h3>
            </div>
            {data.areaStats.length > 0 ? (
              <BarChartComponent
                data={data.areaStats.map(a => ({
                  label: a.area,
                  value: a.totalQuestoes,
                  color: 'bg-purple-400'
                }))}
                maxValue={Math.max(...data.areaStats.map(a => a.totalQuestoes), 1)}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum simulado registrado ainda</p>
            )}
          </div>
        </div>
      )}

      {/* Atividade Diária */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-800">ATIVIDADE DOS ÚLTIMOS 14 DIAS</h3>
        </div>
        {data.dailyActivity.length > 0 ? (
          <>
            <DailyActivityChart activities={data.dailyActivity} />
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Revisões</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-xs text-gray-600">Simulados</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade registrada ainda</p>
        )}
      </div>
    </div>
  );
};
