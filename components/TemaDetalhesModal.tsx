import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Calendar,
  BookOpen,
  BarChart3,
  Star,
  ArrowRightLeft,
  Plus,
  Save
} from 'lucide-react';
import { TemaEstudo, CronogramaState } from '../types';
import { COLOR_STYLES } from '../temasColors';
import { migrarTema, atualizarTema, calcularPercentualAcerto } from '../utils/cronogramaUtils';

interface TemaDetalhesModalProps {
  tema: TemaEstudo;
  cronograma: CronogramaState;
  sheetUrl: string;
  onClose: () => void;
  onUpdate: (novoCronograma: CronogramaState) => Promise<void>;
}

export const TemaDetalhesModal: React.FC<TemaDetalhesModalProps> = ({
  tema,
  cronograma,
  onClose,
  onUpdate
}) => {
  const [temaEditado, setTemaEditado] = useState<TemaEstudo>(tema);
  const [mostrarMovimentacao, setMostrarMovimentacao] = useState(false);

  // Formulários
  const [novasQuestoes, setNovasQuestoes] = useState({ total: 0, corretas: 0 });

  const style = COLOR_STYLES[tema.cor];
  const percentualAcerto = calcularPercentualAcerto(
    temaEditado.questoesCorretas,
    temaEditado.questoesFeitas
  );

  // Marcar como estudado
  const handleMarcarEstudado = () => {
    const agora = new Date().toISOString();
    const atualizado: TemaEstudo = {
      ...temaEditado,
      estudado: true,
      primeiraVisualizacao: temaEditado.primeiraVisualizacao || agora,
      datasEstudos: [...temaEditado.datasEstudos, agora]
    };
    setTemaEditado(atualizado);
  };

  // Adicionar revisão
  const handleAdicionarRevisao = () => {
    const agora = new Date().toISOString();
    const atualizado: TemaEstudo = {
      ...temaEditado,
      revisoesConcluidas: temaEditado.revisoesConcluidas + 1,
      datasRevisoes: [...temaEditado.datasRevisoes, agora]
    };
    setTemaEditado(atualizado);
  };

  // Adicionar questões
  const handleAdicionarQuestoes = () => {
    if (novasQuestoes.total <= 0) return;
    if (novasQuestoes.corretas > novasQuestoes.total) {
      alert('Número de questões corretas não pode ser maior que o total!');
      return;
    }

    const erradas = novasQuestoes.total - novasQuestoes.corretas;
    const atualizado: TemaEstudo = {
      ...temaEditado,
      questoesFeitas: temaEditado.questoesFeitas + novasQuestoes.total,
      questoesCorretas: temaEditado.questoesCorretas + novasQuestoes.corretas,
      questoesErradas: temaEditado.questoesErradas + erradas
    };
    setTemaEditado(atualizado);
    setNovasQuestoes({ total: 0, corretas: 0 });
  };

  // Atualizar grau de dificuldade
  const handleAtualizarDificuldade = (grau: 1 | 2 | 3 | 4 | 5) => {
    setTemaEditado({
      ...temaEditado,
      grauDificuldade: grau
    });
  };

  // Atualizar tipo de estudo
  const handleTipoEstudo = (tipo: 'apenasAula' | 'aulaERevisao' | 'apenasRevisao', valor: boolean) => {
    setTemaEditado({
      ...temaEditado,
      [tipo]: valor
    });
  };

  // Mover tema para outra semana
  const handleMoverSemana = (novaSemana: number) => {
    const { temaAtualizado, semanasAtualizadas } = migrarTema(
      temaEditado,
      novaSemana,
      cronograma.semanas
    );

    onUpdate({
      ...cronograma,
      semanas: semanasAtualizadas
    });

    setTemaEditado(temaAtualizado);
    setMostrarMovimentacao(false);
  };

  // Salvar alterações
  const handleSalvar = () => {
    const semanasAtualizadas = atualizarTema(temaEditado, cronograma.semanas);
    onUpdate({
      ...cronograma,
      semanas: semanasAtualizadas
    });
    onClose();
  };

  // Formatar data
  const formatarData = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 ${style.bg}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${style.dot}`}></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.bg} border ${style.border} ${style.text}`}>
                  {style.label}
                </span>
              </div>
              <h2 className={`text-xl font-bold ${style.text} leading-tight`}>{tema.nome}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Semana Original</p>
                <p className="text-lg font-bold text-gray-900">Semana {tema.semanaOriginal}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Semana Atual</p>
                <p className="text-lg font-bold text-gray-900">Semana {temaEditado.semanaAtual}</p>
              </div>
            </div>
            {tema.semanaOriginal !== temaEditado.semanaAtual && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                  ⚠️ Tema migrado da semana original
                </p>
              </div>
            )}
          </div>

          {/* Status de Estudo */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Status de Estudo
            </h3>

            <div className="space-y-2">
              <button
                onClick={handleMarcarEstudado}
                disabled={temaEditado.estudado}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  temaEditado.estudado
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {temaEditado.estudado ? '✓ Tema Estudado' : 'Marcar como Estudado'}
                  </span>
                  {temaEditado.primeiraVisualizacao && (
                    <span className="text-xs text-gray-600">
                      {formatarData(temaEditado.primeiraVisualizacao)}
                    </span>
                  )}
                </div>
              </button>

              {/* Tipo de Estudo */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-bold text-gray-700">Tipo de Estudo:</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temaEditado.apenasAula}
                      onChange={(e) => handleTipoEstudo('apenasAula', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Apenas Aula</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temaEditado.aulaERevisao}
                      onChange={(e) => handleTipoEstudo('aulaERevisao', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Aula + Revisão</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temaEditado.apenasRevisao}
                      onChange={(e) => handleTipoEstudo('apenasRevisao', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Apenas Revisão</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Revisões */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Revisões
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-700 mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-900">{temaEditado.revisoesTotal}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-700 mb-1">Concluídas</p>
                <p className="text-2xl font-bold text-green-900">{temaEditado.revisoesConcluidas}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-orange-700 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.max(0, temaEditado.revisoesTotal - temaEditado.revisoesConcluidas)}
                </p>
              </div>
            </div>

            <button
              onClick={handleAdicionarRevisao}
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Revisão
            </button>

            {temaEditado.datasRevisoes.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-bold text-gray-700 mb-2">Histórico de Revisões:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {temaEditado.datasRevisoes.map((data, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {formatarData(data)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Questões */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Questões
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{temaEditado.questoesFeitas}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-700 mb-1">Corretas</p>
                <p className="text-2xl font-bold text-green-900">{temaEditado.questoesCorretas}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-700 mb-1">Erradas</p>
                <p className="text-2xl font-bold text-red-900">{temaEditado.questoesErradas}</p>
              </div>
            </div>

            {/* Percentual de Acerto */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">Percentual de Acerto</span>
                <span className="text-2xl font-bold text-blue-600">{percentualAcerto}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${percentualAcerto}%` }}
                ></div>
              </div>
            </div>

            {/* Adicionar Questões */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-bold text-gray-700">Adicionar Questões:</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={novasQuestoes.total || ''}
                  onChange={(e) => setNovasQuestoes({ ...novasQuestoes, total: parseInt(e.target.value) || 0 })}
                  placeholder="Total"
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  min="0"
                  max={novasQuestoes.total}
                  value={novasQuestoes.corretas || ''}
                  onChange={(e) => setNovasQuestoes({ ...novasQuestoes, corretas: parseInt(e.target.value) || 0 })}
                  placeholder="Corretas"
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleAdicionarQuestoes}
                  disabled={novasQuestoes.total <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Avaliação Subjetiva */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Star className="w-4 h-4" />
              Grau de Dificuldade
            </h3>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((grau) => (
                <button
                  key={grau}
                  onClick={() => handleAtualizarDificuldade(grau as 1 | 2 | 3 | 4 | 5)}
                  className={`p-3 rounded-lg transition-all ${
                    temaEditado.grauDificuldade === grau
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : 'bg-gray-100 border-2 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      temaEditado.grauDificuldade === grau ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 text-center">
              {temaEditado.grauDificuldade
                ? `Dificuldade: ${temaEditado.grauDificuldade} estrela${temaEditado.grauDificuldade > 1 ? 's' : ''}`
                : 'Não avaliado'}
            </p>
          </div>

          {/* Histórico de Migrações */}
          {temaEditado.logMigracoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Histórico de Migrações
              </h3>
              <div className="space-y-2">
                {temaEditado.logMigracoes.map((log, idx) => (
                  <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-900">
                      Movido de <strong>Semana {log.de}</strong> para <strong>Semana {log.para}</strong>
                    </p>
                    <p className="text-xs text-orange-700 mt-1">{formatarData(log.data)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mover Tema */}
          <div className="space-y-3">
            <button
              onClick={() => setMostrarMovimentacao(!mostrarMovimentacao)}
              className="w-full p-3 bg-orange-100 border-2 border-orange-300 text-orange-900 rounded-lg font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Mover para Outra Semana
            </button>

            {mostrarMovimentacao && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-bold text-gray-700">Selecione a semana de destino:</p>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((semana) => (
                    <button
                      key={semana}
                      onClick={() => handleMoverSemana(semana)}
                      disabled={semana === temaEditado.semanaAtual}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        semana === temaEditado.semanaAtual
                          ? 'bg-blue-600 text-white cursor-not-allowed'
                          : 'bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      {semana}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Ações */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
