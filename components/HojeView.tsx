import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle as AlertCircleIcon,
  TrendingUp,
  Calendar as CalendarIcon,
  BookOpen,
  RefreshCw,
  FileText,
  Loader2,
  Filter,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  AtividadeDia,
  EstadoAbaHoje,
  TipoAtividade,
  CorRelevancia
} from '../types';
import {
  processarAtividadesDia,
  carregarDiario,
  carregarDataEntry,
  formatarData,
  obterMensagemMotivacional
} from '../utils/hojeUtils';
import { COLOR_STYLES } from '../temasCentralizados';

interface HojeViewProps {
  sheetUrl: string;
  onNavigateToCronograma?: (temaNome: string) => void;
  onNavigateToRegistro?: (atividade: AtividadeDia) => void;
}

export const HojeView: React.FC<HojeViewProps> = ({
  sheetUrl,
  onNavigateToCronograma,
  onNavigateToRegistro
}) => {
  const [estado, setEstado] = useState<EstadoAbaHoje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoAtividade | null>(null);
  const [filtroCor, setFiltroCor] = useState<CorRelevancia | null>(null);

  // Estado de colapso das seções (apenas "Pendentes" aberto por padrão)
  const [secaoAberta, setSecaoAberta] = useState<{
    concluidos: boolean;
    pendentes: boolean;
    atrasados: boolean;
    foraPrograma: boolean;
    temasVistosHoje: boolean;
  }>({
    concluidos: false,
    pendentes: true, // Apenas pendentes aberto por padrão
    atrasados: false,
    foraPrograma: false,
    temasVistosHoje: false
  });

  const toggleSecao = (secao: keyof typeof secaoAberta) => {
    setSecaoAberta(prev => ({
      ...prev,
      [secao]: !prev[secao]
    }));
  };

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      if (!sheetUrl) {
        setError('Configure a URL da planilha primeiro');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [diario, dataEntry] = await Promise.all([
          carregarDiario(sheetUrl),
          carregarDataEntry(sheetUrl)
        ]);

        const estadoProcessado = processarAtividadesDia(diario, dataEntry);
        setEstado(estadoProcessado);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar atividades do dia');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [sheetUrl]);

  // Aplicar filtros
  const estadoFiltrado = useMemo(() => {
    if (!estado) return null;

    const aplicarFiltros = (atividades: AtividadeDia[]) =>
      atividades.filter((a) => {
        if (filtroTipo && a.tipo !== filtroTipo) return false;
        if (filtroCor && a.temaCor !== filtroCor) return false;
        return true;
      });

    return {
      ...estado,
      concluidos: aplicarFiltros(estado.concluidos),
      pendentes: aplicarFiltros(estado.pendentes),
      atrasados: aplicarFiltros(estado.atrasados),
      foraPrograma: aplicarFiltros(estado.foraPrograma),
      temasVistosHoje: aplicarFiltros(estado.temasVistosHoje)
    };
  }, [estado, filtroTipo, filtroCor]);

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroTipo(null);
    setFiltroCor(null);
  };

  const temFiltrosAtivos = filtroTipo || filtroCor;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium">Carregando atividades do dia...</p>
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

  if (!estado || !estadoFiltrado) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const mensagem = obterMensagemMotivacional(
    estado.stats.taxaConclusao,
    estado.atrasados.length > 0
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Header com Estatísticas */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-blue-900">
              HOJE - {formatarData(estado.dataAtual, 'completo')}
            </h2>
            <p className="text-sm text-blue-700">{mensagem}</p>
          </div>
        </div>

        {/* Cards de Resumo - Separados por Tipo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Primeiro Contato */}
          <div className="bg-purple-50/90 p-4 rounded-lg border-2 border-purple-200">
            <BookOpen className="w-5 h-5 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-purple-700 font-bold mb-1">📚 Primeiro Contato</p>
            <p className="text-xl font-bold text-purple-900">
              {estado.stats.primeiraVez.concluidas}/{estado.stats.primeiraVez.programadas}
            </p>
            <p className="text-xs text-purple-600">
              {estado.stats.primeiraVez.programadas > 0
                ? Math.round((estado.stats.primeiraVez.concluidas / estado.stats.primeiraVez.programadas) * 100)
                : 0}%
            </p>
          </div>

          {/* Revisões */}
          <div className="bg-orange-50/90 p-4 rounded-lg border-2 border-orange-200">
            <RefreshCw className="w-5 h-5 text-orange-600 mx-auto mb-2" />
            <p className="text-xs text-orange-700 font-bold mb-1">🔄 Revisões</p>
            <p className="text-xl font-bold text-orange-900">
              {estado.stats.revisoes.concluidas}/{estado.stats.revisoes.programadas}
            </p>
            <p className="text-xs text-orange-600">
              {estado.stats.revisoes.programadas > 0
                ? Math.round((estado.stats.revisoes.concluidas / estado.stats.revisoes.programadas) * 100)
                : 0}%
            </p>
          </div>

          {/* Atrasados - Separados */}
          <div className="bg-red-50/90 p-4 rounded-lg border-2 border-red-200">
            <AlertCircleIcon className="w-5 h-5 text-red-600 mx-auto mb-2" />
            <p className="text-xs text-red-700 font-bold mb-1">🔴 Atrasados</p>
            <div className="flex justify-center gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-red-900">
                  {estadoFiltrado.atrasados.filter(a => a.tipo === 'PRIMEIRA_VEZ').length}
                </p>
                <p className="text-[10px] text-red-600">1ª vez</p>
              </div>
              <div className="text-red-400">|</div>
              <div className="text-center">
                <p className="text-sm font-bold text-red-900">
                  {estadoFiltrado.atrasados.filter(a => a.tipo === 'REVISAO').length}
                </p>
                <p className="text-[10px] text-red-600">Revisões</p>
              </div>
            </div>
          </div>

          {/* Total Geral */}
          <div className="bg-blue-50/90 p-4 rounded-lg border-2 border-blue-200">
            <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-blue-700 font-bold mb-1">📊 Total Geral</p>
            <p className="text-xl font-bold text-blue-900">
              {estado.stats.totalRealizadas}/{estado.stats.totalProgramadas}
            </p>
            <p className="text-xs text-blue-600">{estado.stats.taxaConclusao.toFixed(0)}%</p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(estado.stats.taxaConclusao, 100)}%` }}
          ></div>
        </div>

        {/* Contadores Detalhados */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {/* Primeiro Contato Detalhado */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">PRIMEIRO CONTATO</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">Programados:</span>
                <strong className="text-purple-900">{estado.stats.primeiraVez.programadas}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">Concluídos:</span>
                <strong className="text-green-700">{estado.stats.primeiraVez.concluidas}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">Pendentes:</span>
                <strong className="text-blue-700">
                  {estadoFiltrado.pendentes.filter(p => p.tipo === 'PRIMEIRA_VEZ').length}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">Atrasados:</span>
                <strong className="text-red-700">
                  {estadoFiltrado.atrasados.filter(a => a.tipo === 'PRIMEIRA_VEZ').length}
                </strong>
              </div>
            </div>
          </div>

          {/* Revisões Detalhado */}
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900">REVISÕES</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">Programadas:</span>
                <strong className="text-orange-900">{estado.stats.revisoes.programadas}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">Concluídas:</span>
                <strong className="text-green-700">{estado.stats.revisoes.concluidas}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">Pendentes:</span>
                <strong className="text-blue-700">
                  {estadoFiltrado.pendentes.filter(p => p.tipo === 'REVISAO').length}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-700">Atrasadas:</span>
                <strong className="text-red-700">
                  {estadoFiltrado.atrasados.filter(a => a.tipo === 'REVISAO').length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-200 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">Filtros</h3>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Filtro por Tipo */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroTipo(filtroTipo === 'PRIMEIRA_VEZ' ? null : 'PRIMEIRA_VEZ')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              filtroTipo === 'PRIMEIRA_VEZ'
                ? 'bg-purple-50 border-purple-400 text-purple-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📚 Primeira vez
          </button>
          <button
            onClick={() => setFiltroTipo(filtroTipo === 'REVISAO' ? null : 'REVISAO')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              filtroTipo === 'REVISAO'
                ? 'bg-orange-50 border-orange-400 text-orange-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔄 Revisões
          </button>
        </div>

        {/* Filtro por Cor */}
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
      </div>

      {/* Seções de Atividades */}
      <div className="space-y-4">
        {/* Pendentes - Sempre aberto por padrão */}
        <SecaoAtividades
          titulo="⏳ PENDENTES HOJE"
          atividades={estadoFiltrado.pendentes}
          tipo="pendente"
          onDetalhes={onNavigateToCronograma}
          onRegistrar={onNavigateToRegistro}
          isOpen={secaoAberta.pendentes}
          onToggle={() => toggleSecao('pendentes')}
        />

        {/* Temas Vistos Hoje */}
        {estadoFiltrado.temasVistosHoje.length > 0 && (
          <SecaoAtividades
            titulo="📚 TEMAS VISTOS HOJE (Primeiro Contato)"
            atividades={estadoFiltrado.temasVistosHoje}
            tipo="temasVistosHoje"
            onDetalhes={onNavigateToCronograma}
            onRegistrar={onNavigateToRegistro}
            isOpen={secaoAberta.temasVistosHoje}
            onToggle={() => toggleSecao('temasVistosHoje')}
          />
        )}

        {/* Concluídos */}
        <SecaoAtividades
          titulo="✅ CONCLUÍDOS HOJE"
          atividades={estadoFiltrado.concluidos}
          tipo="concluido"
          onDetalhes={onNavigateToCronograma}
          onRegistrar={onNavigateToRegistro}
          isOpen={secaoAberta.concluidos}
          onToggle={() => toggleSecao('concluidos')}
        />

        {/* Atrasados - Sempre mostrar */}
        <SecaoAtividades
          titulo="🔴 ATRASADOS"
          atividades={estadoFiltrado.atrasados}
          tipo="atrasado"
          onDetalhes={onNavigateToCronograma}
          onRegistrar={onNavigateToRegistro}
          isOpen={secaoAberta.atrasados}
          onToggle={() => toggleSecao('atrasados')}
        />

        {/* Fora do Programado - Apenas Revisões */}
        {estadoFiltrado.foraPrograma.length > 0 && (
          <SecaoAtividades
            titulo="⚠️ FORA DO PROGRAMADO (Revisões Não Agendadas)"
            atividades={estadoFiltrado.foraPrograma}
            tipo="fora"
            onDetalhes={onNavigateToCronograma}
            onRegistrar={onNavigateToRegistro}
            isOpen={secaoAberta.foraPrograma}
            onToggle={() => toggleSecao('foraPrograma')}
          />
        )}
      </div>
    </div>
  );
};

// Componente de Seção
interface SecaoAtividadesProps {
  titulo: string;
  atividades: AtividadeDia[];
  tipo: 'concluido' | 'pendente' | 'atrasado' | 'fora' | 'temasVistosHoje';
  onDetalhes?: (temaNome: string) => void;
  onRegistrar?: (atividade: AtividadeDia) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SecaoAtividades: React.FC<SecaoAtividadesProps> = ({
  titulo,
  atividades,
  tipo,
  onDetalhes,
  onRegistrar,
  isOpen,
  onToggle
}) => {
  // Separar por tipo de atividade
  const primeiraVez = atividades.filter(a => a.tipo === 'PRIMEIRA_VEZ');
  const revisoes = atividades.filter(a => a.tipo === 'REVISAO');

  const isEmpty = atividades.length === 0;

  return (
    <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
      {/* Header clicável para expandir/colapsar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
      >
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          {titulo} ({atividades.length})
        </h3>
        <div className="flex items-center gap-2">
          {isEmpty && (
            <span className="text-xs text-green-600 font-medium">
              {tipo === 'concluido' && '🎉'}
              {tipo === 'pendente' && '✅ Tudo concluído!'}
              {tipo === 'atrasado' && '✅ Em dia!'}
              {tipo === 'fora' && '✅ Tudo ok!'}
              {tipo === 'temasVistosHoje' && ''}
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Conteúdo colapsável */}
      {isOpen && !isEmpty && (
        <div className="mt-4">

        {/* Breakdown por tipo */}
        <div className="space-y-4">
          {primeiraVez.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                📚 Primeira vez ({primeiraVez.length})
              </h4>
              <div className="space-y-2">
                {primeiraVez.map(atividade => (
                  <AtividadeCard
                    key={atividade.id}
                    atividade={atividade}
                    onDetalhes={onDetalhes}
                    onRegistrar={onRegistrar}
                  />
                ))}
              </div>
            </div>
          )}

          {revisoes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                🔄 Revisões ({revisoes.length})
              </h4>
              <div className="space-y-2">
                {revisoes.map(atividade => (
                  <AtividadeCard
                    key={atividade.id}
                    atividade={atividade}
                    onDetalhes={onDetalhes}
                    onRegistrar={onRegistrar}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

// Componente de Card de Atividade
interface AtividadeCardProps {
  atividade: AtividadeDia;
  onDetalhes?: (temaNome: string) => void;
  onRegistrar?: (atividade: AtividadeDia) => void;
}

const AtividadeCard: React.FC<AtividadeCardProps> = ({
  atividade,
  onDetalhes,
  onRegistrar
}) => {
  const style = COLOR_STYLES[atividade.temaCor];

  // Badge de status
  const renderBadgeStatus = () => {
    if (atividade.status === 'CONCLUIDO') {
      return <span className="text-xs font-bold text-green-600">✅ Concluído</span>;
    }
    if (atividade.status === 'PENDENTE') {
      return <span className="text-xs font-bold text-blue-600">⏳ Pendente</span>;
    }
    if (atividade.status === 'ATRASADO') {
      return (
        <span className="text-xs font-bold text-red-600">
          🔴 Atrasado há {atividade.diasDeAtraso} dia{atividade.diasDeAtraso! > 1 ? 's' : ''}
        </span>
      );
    }
    if (atividade.foraPrograma) {
      if (atividade.foraPrograma.tipo === 'ANTECIPADO') {
        return <span className="text-xs font-bold text-cyan-600">⚡ Antecipado</span>;
      }
      if (atividade.foraPrograma.tipo === 'ATRASADO_CONCLUIDO') {
        return <span className="text-xs font-bold text-yellow-600">⏱️ Recuperado</span>;
      }
      return <span className="text-xs font-bold text-purple-600">➕ Extra</span>;
    }
    return null;
  };

  // Info contextual
  const renderInfoContextual = () => {
    if (atividade.status === 'ATRASADO') {
      return (
        <p className="text-xs text-red-700">
          Era para: {formatarData(atividade.dataProgramada, 'completo')}
        </p>
      );
    }
    if (atividade.foraPrograma) {
      if (atividade.foraPrograma.tipo === 'ANTECIPADO' && atividade.foraPrograma.dataOriginal) {
        return (
          <p className="text-xs text-cyan-700">
            Antecipado em {atividade.foraPrograma.diasDiferenca} dia{atividade.foraPrograma.diasDiferenca > 1 ? 's' : ''} (era para {formatarData(atividade.foraPrograma.dataOriginal, 'completo')})
          </p>
        );
      }
      if (atividade.foraPrograma.tipo === 'ATRASADO_CONCLUIDO' && atividade.foraPrograma.dataOriginal) {
        return (
          <p className="text-xs text-yellow-700">
            Concluído com {atividade.foraPrograma.diasDiferenca} dia{atividade.foraPrograma.diasDiferenca > 1 ? 's' : ''} de atraso (era para {formatarData(atividade.foraPrograma.dataOriginal, 'completo')})
          </p>
        );
      }
      if (atividade.foraPrograma.tipo === 'EXTRA') {
        return <p className="text-xs text-purple-700">Estudo extra - não estava programado</p>;
      }
    }
    if (atividade.horaRealizada) {
      return <p className="text-xs text-gray-600">Realizado às {atividade.horaRealizada}</p>;
    }
    return null;
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${style.border} bg-gray-50 hover:bg-gray-100 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Nome do tema */}
          <h5 className={`text-sm font-bold ${style.text} mb-1`}>{atividade.temaNome}</h5>

          {/* Badge de tipo */}
          <div className="flex items-center gap-2 mb-1">
            {atividade.tipo === 'PRIMEIRA_VEZ' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                📚 1ª vez
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                🔄 Revisão {atividade.numeroRevisao ? `#${atividade.numeroRevisao}` : ''}
              </span>
            )}
            {renderBadgeStatus()}
          </div>

          {/* Info contextual */}
          {renderInfoContextual()}

          {/* Performance */}
          {atividade.questoesFeitas && atividade.questoesFeitas > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Performance</span>
                <span className={`text-xs font-bold ${
                  atividade.percentualAcerto! >= 70 ? 'text-green-600' :
                  atividade.percentualAcerto! >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {atividade.questoesCorretas}/{atividade.questoesFeitas} - {atividade.percentualAcerto}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    atividade.percentualAcerto! >= 70 ? 'bg-green-500' :
                    atividade.percentualAcerto! >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${atividade.percentualAcerto}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-1">
          {onDetalhes && (
            <button
              onClick={() => onDetalhes(atividade.temaNome)}
              className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              title="Ver detalhes no cronograma"
            >
              Detalhes
            </button>
          )}
          {onRegistrar && atividade.status !== 'CONCLUIDO' && (
            <button
              onClick={() => onRegistrar(atividade)}
              className="px-2 py-1 text-[10px] font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              title="Registrar atividade"
            >
              Registrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
