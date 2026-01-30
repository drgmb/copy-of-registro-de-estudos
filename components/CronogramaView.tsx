import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  TrendingUp,
  Filter,
  Search,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  CronogramaState,
  TemaEstudo,
  SemanaEstudo,
  CorRelevancia
} from '../types';
import {
  inicializarCronograma,
  calcularEstatisticas,
  carregarCronogramaSync,
  salvarProgressoTema
} from '../utils/cronogramaUtils';
import { TemaDetalhesModal } from './TemaDetalhesModal';
import { COLOR_STYLES } from '../temasCentralizados';

interface CronogramaViewProps {
  sheetUrl: string;
}

export const CronogramaView: React.FC<CronogramaViewProps> = ({ sheetUrl }) => {
  const [cronograma, setCronograma] = useState<CronogramaState | null>(null);
  const [temaModal, setTemaModal] = useState<TemaEstudo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [recarregarFlag, setRecarregarFlag] = useState(0);
  const [mostrarDebug, setMostrarDebug] = useState(true); // Debug visível por padrão

  // Filtros
  const [filtroCor, setFiltroCor] = useState<CorRelevancia | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'estudado' | 'pendente' | null>(null);
  const [filtroSemana, setFiltroSemana] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  // Carregar cronograma sincronizado do Google Sheets
  useEffect(() => {
    const carregarDados = async () => {
      if (!sheetUrl) {
        setError('Configure a URL da planilha primeiro');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Carregar cronograma sincronizado (base + progresso)
        const cronogramaSync = await carregarCronogramaSync(sheetUrl);

        if (cronogramaSync) {
          setCronograma(cronogramaSync);
        } else {
          // Se não há dados na planilha, usar inicialização local como fallback
          const cronogramaLocal = inicializarCronograma();
          setCronograma(cronogramaLocal);
          setError('Aba CRONOGRAMA não encontrada. Usando dados locais.');
        }
      } catch (err) {
        setError('Erro ao carregar cronograma');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [sheetUrl, recarregarFlag]);

  // Função para recarregar manualmente
  const recarregarCronograma = () => {
    setRecarregarFlag(prev => prev + 1);
  };

  // Atualizar cronograma e sincronizar com Google Sheets
  const atualizarCronograma = async (novoState: CronogramaState) => {
    setCronograma(novoState);
    // Não precisa salvar tudo - cada tema individual será salvo quando modificado
  };

  // Salvar progresso de um tema específico
  const salvarTema = async (tema: TemaEstudo) => {
    if (sheetUrl) {
      await salvarProgressoTema(sheetUrl, tema);
    }
  };

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    if (!cronograma) return null;
    return calcularEstatisticas(cronograma.semanas);
  }, [cronograma]);

  // Filtrar semanas e temas
  const semanasFiltradas = useMemo(() => {
    if (!cronograma) return [];

    let semanas = cronograma.semanas;

    // Filtro por semana específica
    if (filtroSemana !== null) {
      semanas = semanas.filter(s => s.numero === filtroSemana);
    }

    // Filtrar temas dentro de cada semana
    return semanas.map(semana => ({
      ...semana,
      temas: semana.temas.filter(tema => {
        // Filtro de cor
        if (filtroCor && tema.cor !== filtroCor) return false;

        // Filtro de status
        if (filtroStatus === 'estudado' && !tema.estudado) return false;
        if (filtroStatus === 'pendente' && tema.estudado) return false;

        // Filtro de busca
        if (busca && !tema.nome.toLowerCase().includes(busca.toLowerCase())) return false;

        return true;
      })
    })).filter(semana => semana.temas.length > 0); // Remover semanas vazias após filtro
  }, [cronograma, filtroCor, filtroStatus, filtroSemana, busca]);

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroCor(null);
    setFiltroStatus(null);
    setFiltroSemana(null);
    setBusca('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-red-900">Erro</h3>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (!cronograma) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const temFiltrosAtivos = filtroCor || filtroStatus || filtroSemana || busca;

  return (
    <div className="space-y-4 pb-6">
      {/* Estatísticas Gerais */}
      {estatisticas && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">
              Progresso Geral do Cronograma
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-xs text-purple-700 font-medium mb-1">Total de Temas</p>
              <p className="text-2xl font-bold text-purple-900">{estatisticas.totalTemas}</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-xs text-purple-700 font-medium mb-1">Estudados</p>
              <p className="text-2xl font-bold text-green-700">{estatisticas.temasEstudados}</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-xs text-purple-700 font-medium mb-1">Progresso</p>
              <p className="text-2xl font-bold text-blue-700">
                {estatisticas.percentualConclusao.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <p className="text-xs text-purple-700 font-medium mb-1">Migrados</p>
              <p className="text-2xl font-bold text-orange-700">{estatisticas.temasFora}</p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(estatisticas.percentualConclusao, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Painel de Debug */}
      {mostrarDebug && cronograma && (
        <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-700" />
              <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">
                🔍 Painel de Debug
              </h3>
            </div>
            <button
              onClick={() => setMostrarDebug(false)}
              className="text-yellow-700 hover:text-yellow-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 bg-white rounded">
              <strong>Total de Semanas:</strong> {cronograma.semanas.length}
            </div>
            <div className="p-2 bg-white rounded">
              <strong>Temas Carregados:</strong> {cronograma.semanas.reduce((acc, s) => acc + s.temas.length, 0)}
            </div>
            <div className="p-2 bg-white rounded">
              <strong>Temas Estudados:</strong> {cronograma.semanas.reduce((acc, s) => acc + s.temas.filter(t => t.estudado).length, 0)}
            </div>
            <div className="p-2 bg-white rounded">
              <strong>Temas Migrados:</strong> {cronograma.semanas.reduce((acc, s) => acc + s.temas.filter(t => t.semanaAtual !== t.semanaOriginal).length, 0)}
            </div>
            <div className="p-2 bg-white rounded">
              <strong>Última Atualização:</strong> {new Date(cronograma.ultimaAtualizacao).toLocaleString('pt-BR')}
            </div>
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-900 mb-1"><strong>💡 Verifique o Console (F12)</strong></p>
              <p className="text-blue-700">Logs detalhados de processamento aparecem no console do navegador</p>
            </div>
          </div>
        </div>
      )}

      {!mostrarDebug && (
        <button
          onClick={() => setMostrarDebug(true)}
          className="w-full p-2 text-xs text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded border border-yellow-200 font-medium"
        >
          🔍 Mostrar Painel de Debug
        </button>
      )}

      {/* Filtros e Atualizar */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-200 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">Filtros</h3>
          <button
            onClick={recarregarCronograma}
            disabled={loading}
            className="ml-auto text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            title="Recarregar cronograma com dados mais recentes do DATA ENTRY e DIÁRIO"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tema..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>

        {/* Filtros de Cor */}
        <div className="flex flex-wrap gap-2">
          {(['VERDE', 'AMARELO', 'VERMELHO', 'ROXO'] as CorRelevancia[]).map(cor => (
            <button
              key={cor}
              onClick={() => setFiltroCor(filtroCor === cor ? null : cor)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                filtroCor === cor
                  ? `${COLOR_STYLES[cor].bg} ${COLOR_STYLES[cor].border} ${COLOR_STYLES[cor].text}`
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {COLOR_STYLES[cor].label}
            </button>
          ))}
        </div>

        {/* Filtros de Status */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroStatus(filtroStatus === 'estudado' ? null : 'estudado')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              filtroStatus === 'estudado'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Estudados
          </button>
          <button
            onClick={() => setFiltroStatus(filtroStatus === 'pendente' ? null : 'pendente')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              filtroStatus === 'pendente'
                ? 'bg-orange-50 border-orange-400 text-orange-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ○ Pendentes
          </button>
        </div>
      </div>

      {/* Semanas */}
      <div className="space-y-3">
        {semanasFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-gray-200">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Nenhum tema encontrado com os filtros selecionados</p>
            <button
              onClick={limparFiltros}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          semanasFiltradas.map((semana) => (
            <SemanaCard
              key={semana.numero}
              semana={semana}
              onTemaClick={setTemaModal}
            />
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {temaModal && (
        <TemaDetalhesModal
          tema={temaModal}
          cronograma={cronograma}
          sheetUrl={sheetUrl}
          onClose={() => setTemaModal(null)}
          onUpdate={atualizarCronograma}
          onSalvarProgresso={salvarTema}
        />
      )}
    </div>
  );
};

// Componente Card de Semana
interface SemanaCardProps {
  semana: SemanaEstudo;
  onTemaClick: (tema: TemaEstudo) => void;
}

const SemanaCard: React.FC<SemanaCardProps> = ({ semana, onTemaClick }) => {
  const estudados = semana.temas.filter(t => t.estudado).length;
  const total = semana.temas.length;
  const progresso = total > 0 ? (estudados / total) * 100 : 0;

  // Formatar datas
  const dataInicio = new Date(semana.dataInicio).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const dataTermino = new Date(semana.dataTermino).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
      {/* Header da Semana */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-gray-900">Semana {semana.numero}</h3>
            <p className="text-xs text-gray-500">{dataInicio} - {dataTermino}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            {estudados}/{total}
          </span>
          <span className="text-xs font-bold text-blue-600">
            {progresso.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${progresso}%` }}
        ></div>
      </div>

      {/* Grid de Temas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {semana.temas.map((tema) => (
          <TemaCard key={tema.id} tema={tema} onClick={() => onTemaClick(tema)} />
        ))}
      </div>
    </div>
  );
};

// Componente Card de Tema
interface TemaCardProps {
  tema: TemaEstudo;
  onClick: () => void;
}

const TemaCard: React.FC<TemaCardProps> = ({ tema, onClick }) => {
  const style = COLOR_STYLES[tema.cor];
  const foiMigrado = tema.semanaOriginal !== tema.semanaAtual;

  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 text-left transition-all hover:scale-105 hover:shadow-lg
        ${style.bg} ${style.border} ${style.text}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${style.dot} mt-1.5 flex-shrink-0`}></div>
        {tema.estudado ? (
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      <p className="text-xs font-medium leading-tight mb-2 line-clamp-2">
        {tema.nome}
      </p>

      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className={`px-2 py-0.5 rounded-full ${style.bg} border ${style.border}`}>
          {style.label}
        </span>
        {foiMigrado && (
          <span className="text-orange-600">⚠️</span>
        )}
      </div>
    </button>
  );
};
