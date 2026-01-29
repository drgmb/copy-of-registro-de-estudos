import React, { useState, useEffect } from 'react';
import { DiaryData, DiaryReview } from '../types';
import { CronogramaView } from './CronogramaView';
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
  CalendarX,
  Filter,
  Flame,
  Zap,
  Check,
  CalendarDays
} from 'lucide-react';

interface HojeViewProps {
  sheetUrl: string;
  onReviewClick: (tema: string) => void;
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'todos';
type StatusFilter = 'todos' | 'pendentes' | 'completas' | 'atrasadas';
type HojeSubTab = 'revisoes' | 'cronograma';

const COLOR_MAP: { [key: string]: { bg: string; border: string; text: string; priority: number } } = {
  'Vermelho': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900', priority: 1 },
  'Amarelo': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900', priority: 2 },
  'Verde': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900', priority: 3 },
  'Roxo': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', priority: 2 },
  'default': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900', priority: 2 }
};

export const HojeView: React.FC<HojeViewProps> = ({ sheetUrl, onReviewClick }) => {
  const [activeSubTab, setActiveSubTab] = useState<HojeSubTab>('revisoes');
  const [data, setData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('hoje');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

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
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
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

  // Filtrar revisões baseado no período
  const getFilteredReviews = (): DiaryReview[] => {
    let reviews: DiaryReview[] = [];

    switch (periodFilter) {
      case 'hoje':
        reviews = [...data.today.reviews];
        break;
      case 'semana':
        reviews = [...data.today.reviews, ...data.upcoming.filter(r => r.daysDiff <= 7)];
        break;
      case 'mes':
        reviews = [...data.today.reviews, ...data.upcoming.filter(r => r.daysDiff <= 30)];
        break;
      case 'todos':
        reviews = [...data.overdue, ...data.today.reviews, ...data.upcoming];
        break;
    }

    // Aplicar filtro de status
    switch (statusFilter) {
      case 'pendentes':
        reviews = reviews.filter(r => !data.today.completed.some(c => c.tema === r.tema));
        break;
      case 'completas':
        reviews = reviews.filter(r => data.today.completed.some(c => c.tema === r.tema));
        break;
      case 'atrasadas':
        reviews = reviews.filter(r => r.daysDiff < 0);
        break;
    }

    // Ordenar por prioridade (dias atrasados/faltando e cor)
    return reviews.sort((a, b) => {
      // Primeiro: atrasadas vêm primeiro
      if (a.daysDiff < 0 && b.daysDiff >= 0) return -1;
      if (a.daysDiff >= 0 && b.daysDiff < 0) return 1;

      // Depois: ordenar por dias (mais urgentes primeiro)
      if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;

      return 0;
    });
  };

  const filteredReviews = getFilteredReviews();
  const progressPercentage = data.today.total > 0
    ? (data.today.completedCount / data.today.total) * 100
    : 0;

  const getPriorityIcon = (daysDiff: number) => {
    if (daysDiff < 0) return <Flame className="w-4 h-4 text-red-600" />;
    if (daysDiff === 0) return <Zap className="w-4 h-4 text-orange-500" />;
    if (daysDiff <= 2) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getColorForTopic = (tema: string) => {
    // Aqui você pode implementar lógica para buscar a cor do tema
    // Por enquanto, vou usar uma lógica simples baseada no hash do tema
    const hash = tema.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['Vermelho', 'Amarelo', 'Verde', 'Roxo'];
    return colors[hash % colors.length];
  };

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

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveSubTab('revisoes')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSubTab === 'revisoes'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Revisões
        </button>
        <button
          onClick={() => setActiveSubTab('cronograma')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSubTab === 'cronograma'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Cronograma
        </button>
      </div>

      {/* Conteúdo baseado na sub-tab ativa */}
      {activeSubTab === 'revisoes' ? (
        <>
          {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hoje */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-600 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-green-900 uppercase tracking-wide">Hoje</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-900">{data.today.completedCount}</span>
            <span className="text-sm text-green-700">/ {data.today.total}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            {data.today.pendingCount} pendente{data.today.pendingCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Este Mês */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Este Mês</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900">{data.statistics.completedThisMonth}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">revisões completadas</p>
        </div>

        {/* Atrasadas */}
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-600 rounded-lg">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-red-900 uppercase tracking-wide">Atrasadas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-900">{data.statistics.overdueCount}</span>
          </div>
          <p className="text-xs text-red-700 mt-1">precisam atenção</p>
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
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-200 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-800">FILTROS</h3>
        </div>

        {/* Filtro de Período */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Período</label>
          <div className="flex gap-2">
            {[
              { value: 'hoje', label: 'Hoje' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mês' },
              { value: 'todos', label: 'Todos' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setPeriodFilter(option.value as PeriodFilter)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  periodFilter === option.value
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <div className="flex gap-2">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'pendentes', label: 'Pendentes' },
              { value: 'completas', label: 'Completas' },
              { value: 'atrasadas', label: 'Atrasadas' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as StatusFilter)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Revisões Filtradas */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Revisões ({filteredReviews.length})
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            {periodFilter === 'hoje' ? 'Hoje' :
             periodFilter === 'semana' ? 'Esta Semana' :
             periodFilter === 'mes' ? 'Este Mês' : 'Todas'}
          </span>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma revisão encontrada com os filtros aplicados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReviews.map((review, index) => {
              const isCompleted = data.today.completed.some(c => c.tema === review.tema);
              const color = getColorForTopic(review.tema);
              const colorStyle = COLOR_MAP[color] || COLOR_MAP['default'];

              return (
                <div
                  key={index}
                  onClick={() => !isCompleted && onReviewClick(review.tema)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-green-300'
                      : `${colorStyle.bg} ${colorStyle.border} cursor-pointer hover:shadow-md hover:scale-[1.02]`
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
                      isCompleted ? 'text-green-900 line-through' : colorStyle.text
                    }`}>
                      {review.tema}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{review.acao}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{review.dataAgendada}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(review.daysDiff)}
                    {!isCompleted && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        review.daysDiff < 0 ? 'bg-red-100 text-red-700' :
                        review.daysDiff === 0 ? 'bg-orange-100 text-orange-700' :
                        review.daysDiff <= 2 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {review.daysDiff < 0
                          ? `${Math.abs(review.daysDiff)}d atrás`
                          : review.daysDiff === 0
                          ? 'Hoje'
                          : `${review.daysDiff}d`}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        Concluída
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      ) : (
        <CronogramaView sheetUrl={sheetUrl} />
      )}
    </div>
  );
};
