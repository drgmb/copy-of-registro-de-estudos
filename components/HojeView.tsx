import React, { useState, useEffect } from 'react';
import { DiaryData, DiaryReview } from '../types';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  RefreshCw,
  Loader2,
  CalendarCheck,
  CalendarX
} from 'lucide-react';

interface HojeViewProps {
  sheetUrl: string;
}

export const HojeView: React.FC<HojeViewProps> = ({ sheetUrl }) => {
  const [data, setData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
      url.searchParams.set('action', 'getDiaryData');

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
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando dados do diário...</p>
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

  const progressPercentage = data.today.total > 0
    ? (data.today.completedCount / data.today.total) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Header com Data */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hoje</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Calendar className="w-4 h-4" />
            {data.today.date}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hoje */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Hoje</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900">{data.today.completedCount}</span>
            <span className="text-sm text-blue-700">/ {data.today.total}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {data.today.pendingCount} pendente{data.today.pendingCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Este Mês */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-green-900 uppercase tracking-wide">Este Mês</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-900">{data.statistics.completedThisMonth}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">revisões completadas</p>
        </div>

        {/* Atrasadas */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-600 rounded-lg">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">Atrasadas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-900">{data.statistics.overdueCount}</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">precisam atenção</p>
        </div>

        {/* Total */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-600 rounded-lg">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Total</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-900">{data.statistics.totalCompleted}</span>
          </div>
          <p className="text-xs text-purple-700 mt-1">revisões feitas</p>
        </div>
      </div>

      {/* Progresso de Hoje */}
      {data.today.total > 0 && (
        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">Progresso de Hoje</h3>
            <span className="text-sm font-bold text-gray-900">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Revisões de Hoje */}
      {data.today.reviews.length > 0 && (
        <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Revisões de Hoje ({data.today.reviews.length})
            </h3>
          </div>
          <div className="space-y-2">
            {data.today.reviews.map((review, index) => {
              const isCompleted = data.today.completed.some(c => c.tema === review.tema);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                    }`}>
                      {review.tema}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {review.acao}
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Concluída
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revisões Atrasadas */}
      {data.overdue.length > 0 && (
        <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <CalendarX className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wide">
              Revisões Atrasadas ({data.overdue.length})
            </h3>
          </div>
          <div className="space-y-2">
            {data.overdue.map((review, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200"
              >
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{review.tema}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{review.acao}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-orange-700 font-medium">
                      Prevista: {review.dataAgendada}
                    </span>
                    <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                      {Math.abs(review.daysDiff)} dia{Math.abs(review.daysDiff) !== 1 ? 's' : ''} atrás
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Revisões */}
      {data.upcoming.length > 0 && (
        <div className="p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
              Próximas Revisões (7 dias)
            </h3>
          </div>
          <div className="space-y-2">
            {data.upcoming.map((review, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-200"
              >
                <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{review.tema}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{review.acao}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-indigo-700 font-medium">
                      {review.dataAgendada}
                    </span>
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                      em {review.daysDiff} dia{review.daysDiff !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo Final */}
      <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Resumo Geral</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Revisões Ativas:</span>
            <span className="font-bold text-gray-900">{data.allActiveReviews}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Próximos 7 dias:</span>
            <span className="font-bold text-gray-900">{data.statistics.upcomingCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
