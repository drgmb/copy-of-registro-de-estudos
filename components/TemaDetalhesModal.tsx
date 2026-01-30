import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Calendar,
  BookOpen,
  BarChart3,
  Star,
  ArrowRightLeft
} from 'lucide-react';
import { TemaEstudo, CronogramaState } from '../types';
import { COLOR_STYLES } from '../temasCentralizados';
import { migrarTema, atualizarTema, calcularPercentualAcerto } from '../utils/cronogramaUtils';

interface TemaDetalhesModalProps {
  tema: TemaEstudo;
  cronograma: CronogramaState;
  sheetUrl: string;
  onClose: () => void;
  onUpdate: (novoCronograma: CronogramaState) => Promise<void>;
  onSalvarProgresso: (tema: TemaEstudo) => Promise<void>;
}

export const TemaDetalhesModal: React.FC<TemaDetalhesModalProps> = ({
  tema,
  cronograma,
  onClose,
  onUpdate,
  onSalvarProgresso
}) => {
  const style = COLOR_STYLES[tema.cor];
  const percentualAcerto = calcularPercentualAcerto(
    tema.questoesCorretas,
    tema.questoesFeitas
  );

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
                <p className="text-lg font-bold text-gray-900">Semana {tema.semanaAtual}</p>
              </div>
            </div>
            {tema.semanaOriginal !== tema.semanaAtual && (
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
              {/* Status - Read Only */}
              <div className={`w-full p-3 rounded-lg border-2 ${
                tema.estudado
                  ? 'bg-green-50 border-green-400'
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${tema.estudado ? 'text-green-700' : 'text-gray-600'}`}>
                    {tema.estudado ? '✓ Tema Estudado' : 'Não estudado'}
                  </span>
                  {tema.primeiraVisualizacao && (
                    <span className="text-xs text-gray-600">
                      Primeira vez: {formatarData(tema.primeiraVisualizacao)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tipo de Estudo - Read Only */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-bold text-gray-700">Tipo de Estudo:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      tema.apenasAula ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                    }`}>
                      {tema.apenasAula && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">Apenas Aula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      tema.aulaERevisao ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                    }`}>
                      {tema.aulaERevisao && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">Aula + Revisão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      tema.apenasRevisao ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                    }`}>
                      {tema.apenasRevisao && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">Apenas Revisão</span>
                  </div>
                </div>
              </div>

              {/* Histórico de Estudos */}
              {tema.datasEstudos.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-bold text-blue-900 mb-2">Histórico de Estudos:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {tema.datasEstudos.map((data, idx) => (
                      <div key={idx} className="text-xs text-blue-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {formatarData(data)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <p className="text-2xl font-bold text-blue-900">{tema.revisoesTotal}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-700 mb-1">Concluídas</p>
                <p className="text-2xl font-bold text-green-900">{tema.revisoesConcluidas}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-orange-700 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.max(0, tema.revisoesTotal - tema.revisoesConcluidas)}
                </p>
              </div>
            </div>

            {tema.datasRevisoes.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-bold text-gray-700 mb-2">Histórico de Revisões:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {tema.datasRevisoes.map((data, idx) => (
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
                <p className="text-2xl font-bold text-gray-900">{tema.questoesFeitas}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-700 mb-1">Corretas</p>
                <p className="text-2xl font-bold text-green-900">{tema.questoesCorretas}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-700 mb-1">Erradas</p>
                <p className="text-2xl font-bold text-red-900">{tema.questoesErradas}</p>
              </div>
            </div>

            {/* Percentual de Acerto */}
            {tema.questoesFeitas > 0 && (
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
            )}
          </div>

          {/* Grau de Dificuldade - Read Only */}
          {tema.grauDificuldade && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Star className="w-4 h-4" />
                Grau de Dificuldade
              </h3>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((grau) => (
                    <Star
                      key={grau}
                      className={`w-6 h-6 ${
                        grau <= tema.grauDificuldade! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-yellow-900 text-center font-medium">
                  Dificuldade: {tema.grauDificuldade} de 5
                </p>
                <p className="text-xs text-yellow-700 text-center mt-1">
                  (da aba DATA ENTRY)
                </p>
              </div>
            </div>
          )}

          {/* Histórico de Migrações */}
          {tema.logMigracoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Histórico de Migrações
              </h3>
              <div className="space-y-2">
                {tema.logMigracoes.map((log, idx) => (
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

        </div>

        {/* Footer - Ações */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Fechar
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Dados calculados automaticamente de DATA ENTRY e DIÁRIO
          </p>
        </div>
      </div>
    </div>
  );
};
