import React from 'react';
import { ChangeLogEntry } from '../types';
import {
  CheckCircle2,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  Info
} from 'lucide-react';

interface ChangeLogDisplayProps {
  changeLog: ChangeLogEntry[];
}

export const ChangeLogDisplay: React.FC<ChangeLogDisplayProps> = ({ changeLog }) => {
  if (!changeLog || changeLog.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'FIRST_CONTACT_ADDED':
        return <Plus className="w-5 h-5 text-green-600" />;
      case 'REVIEW_SCHEDULED':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'REVIEW_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'REVIEW_REGISTERED':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'REVIEW_CANCELED':
      case 'REVIEW_CANCELED_DEADLINE':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'REVIEW_DATE_ADJUSTED':
      case 'REVIEW_MOVED_DEADLINE':
        return <ArrowRight className="w-5 h-5 text-orange-600" />;
      case 'INTERVALS_ADJUSTED':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'EXTRA_REVIEW_ADDED':
        return <Plus className="w-5 h-5 text-indigo-600" />;
      case 'FUTURE_REVIEWS_ADJUSTED':
        return <RefreshCw className="w-5 h-5 text-orange-600" />;
      case 'REVIEWS_RECALCULATED':
        return <RefreshCw className="w-5 h-5 text-purple-600" />;
      case 'SECOND_REVIEW_PERFORMANCE':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'REVIEW_SKIPPED':
        return <Minus className="w-5 h-5 text-gray-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'FIRST_CONTACT_ADDED':
      case 'REVIEW_COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'REVIEW_SCHEDULED':
      case 'REVIEW_REGISTERED':
      case 'SECOND_REVIEW_PERFORMANCE':
        return 'bg-blue-50 border-blue-200';
      case 'REVIEW_CANCELED':
      case 'REVIEW_CANCELED_DEADLINE':
        return 'bg-red-50 border-red-200';
      case 'REVIEW_DATE_ADJUSTED':
      case 'REVIEW_MOVED_DEADLINE':
      case 'FUTURE_REVIEWS_ADJUSTED':
        return 'bg-orange-50 border-orange-200';
      case 'INTERVALS_ADJUSTED':
      case 'REVIEWS_RECALCULATED':
        return 'bg-purple-50 border-purple-200';
      case 'EXTRA_REVIEW_ADDED':
        return 'bg-indigo-50 border-indigo-200';
      case 'REVIEW_SKIPPED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const renderEntry = (entry: ChangeLogEntry, index: number) => {
    return (
      <div
        key={index}
        className={`p-3 rounded-lg border ${getBackgroundColor(entry.type)} transition-all hover:shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon(entry.type)}</div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 mb-1">{entry.action}</h4>

            <div className="space-y-1 text-xs text-gray-700">
              {/* Date Information */}
              {entry.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>Data: <strong>{entry.date}</strong></span>
                </div>
              )}

              {/* Scheduled vs Completed */}
              {entry.scheduledDate && entry.completedDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Programada: {entry.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Concluída: {entry.completedDate}</span>
                  </div>
                  {entry.timing && (
                    <div className="ml-5 text-[11px]">
                      <span className={`font-medium ${
                        entry.daysDifference && entry.daysDifference > 0
                          ? 'text-orange-700'
                          : entry.daysDifference && entry.daysDifference < 0
                          ? 'text-blue-700'
                          : 'text-green-700'
                      }`}>
                        {entry.timing}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Date Changes */}
              {entry.oldDate && entry.newDate && (
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
                  <span>
                    De <strong>{entry.oldDate}</strong> → <strong>{entry.newDate}</strong>
                  </span>
                </div>
              )}

              {/* Adjustment Information */}
              {entry.adjustment && (
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                  <span>Ajuste: <strong>{entry.adjustment}</strong></span>
                </div>
              )}

              {/* Review Number */}
              {entry.reviewNumber && (
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-gray-500" />
                  <span>Revisão #{entry.reviewNumber}</span>
                  {entry.daysFromEntry && (
                    <span className="text-gray-500">({entry.daysFromEntry} dias do início)</span>
                  )}
                </div>
              )}

              {/* Percentage */}
              {entry.percentage && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                  <span>Aproveitamento: <strong>{entry.percentage}</strong></span>
                </div>
              )}

              {/* Intervals */}
              {entry.originalIntervals && entry.adjustedIntervals && (
                <div className="space-y-0.5 ml-5 text-[11px]">
                  <div className="text-gray-600">Original: {entry.originalIntervals}</div>
                  <div className="text-purple-700 font-medium">Ajustado: {entry.adjustedIntervals}</div>
                </div>
              )}

              {/* Counts */}
              {entry.count !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span><strong>{entry.count}</strong> revisão(ões) afetada(s)</span>
                </div>
              )}

              {entry.canceledCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span><strong>{entry.canceledCount}</strong> revisão(ões) cancelada(s)</span>
                </div>
              )}

              {/* New Intervals */}
              {entry.newIntervals && (
                <div className="flex items-center gap-1.5">
                  <span>Novos intervalos: <strong>{entry.newIntervals}</strong></span>
                </div>
              )}

              {/* Reason */}
              {entry.reason && (
                <div className="flex items-start gap-1.5 mt-1 pt-1 border-t border-gray-200/50">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 italic">{entry.reason}</span>
                </div>
              )}

              {/* Note */}
              {entry.note && (
                <div className="flex items-start gap-1.5 mt-1 pt-1 border-t border-gray-200/50">
                  <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 italic">{entry.note}</span>
                </div>
              )}

              {/* Would Be Date (for skipped reviews) */}
              {entry.wouldBeDate && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">Seria em: {entry.wouldBeDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <RefreshCw className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Alterações no Diário
        </h3>
        <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {changeLog.length} {changeLog.length === 1 ? 'operação' : 'operações'}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {changeLog.map((entry, index) => renderEntry(entry, index))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-[11px] text-gray-500 italic">
          Este log mostra todas as alterações realizadas na aba DIÁRIO da planilha durante esta operação.
        </p>
      </div>
    </div>
  );
};
