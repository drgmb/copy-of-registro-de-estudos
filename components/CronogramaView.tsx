import React, { useState, useEffect } from 'react';
import { CronogramaData } from '../types';
import { Calendar, CheckCircle2, Circle, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface CronogramaViewProps {
  sheetUrl: string;
}

export const CronogramaView: React.FC<CronogramaViewProps> = ({ sheetUrl }) => {
  const [data, setData] = useState<CronogramaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    if (!sheetUrl) {
      setError('Configure a URL da planilha primeiro');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${sheetUrl}?action=getCronograma`);
      const result = await response.json();

      if (result.status === 'error') {
        setError(result.message || 'Erro ao carregar cronograma');
      } else {
        setData(result.data);
      }
    } catch (err) {
      setError('Erro ao conectar com a planilha');
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
        <p className="text-gray-600 font-medium">Carregando cronograma...</p>
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

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const semanas = Object.keys(data.temasPorSemana).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-4">
      {/* Indicador de Progresso Geral */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">Progresso do Cronograma</h3>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-purple-900">
            {data.progressoGeral.percentual.toFixed(1)}%
          </span>
          <span className="text-sm text-purple-700">
            {data.progressoGeral.totalRealizado} / {data.progressoGeral.totalPrevisto}
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(data.progressoGeral.percentual, 100)}%` }}
          ></div>
        </div>

        <p className="text-xs text-purple-700 mt-2">
          Inclui primeiros contatos e todas as revisões previstas
        </p>
      </div>

      {/* Temas por Semana */}
      <div className="space-y-3">
        {semanas.map((semana) => {
          const temas = data.temasPorSemana[parseInt(semana)];
          const estudados = temas.filter(t => t.status === 'Estudado').length;
          const progressoSemana = temas.length > 0 ? (estudados / temas.length) * 100 : 0;

          return (
            <div key={semana} className="p-4 bg-white rounded-xl border-2 border-gray-200">
              {/* Header da Semana */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Semana {semana}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    {estudados}/{temas.length}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {progressoSemana.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Barra de Progresso da Semana */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${progressoSemana}%` }}
                ></div>
              </div>

              {/* Lista de Temas */}
              <div className="space-y-2">
                {temas.map((tema, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      tema.status === 'Estudado'
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {tema.status === 'Estudado' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        tema.status === 'Estudado' ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {tema.tema}
                      </p>
                      {tema.dataEstudo && (
                        <p className="text-xs text-green-700 mt-0.5">
                          Estudado em {tema.dataEstudo}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        tema.status === 'Estudado'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tema.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
