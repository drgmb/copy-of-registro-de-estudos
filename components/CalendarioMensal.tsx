import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DiaCalendario {
  data: Date;
  diaDoMes: number;
  mesAtual: boolean;
  ehHoje: boolean;
  semana: number; // Semana do cronograma (1-30)
  temTemas: boolean;
  temRevisoes: boolean;
}

interface CalendarioMensalProps {
  mesAtual: Date; // Data que representa o mês a ser exibido (fixo: Janeiro 2026)
  onDiaClick: (data: Date) => void;
  diasComAtividades?: { [dataISO: string]: { temas: number; revisoes: number } };
  dataInicioCronograma: Date; // Data de início do cronograma (semana 1: 25/01/2026)
  onMesAnterior?: () => void; // Navegar para o mês anterior
  onMesProximo?: () => void; // Navegar para o mês próximo
  onVoltarParaHoje?: () => void; // Voltar para o mês atual
}

export const CalendarioMensal: React.FC<CalendarioMensalProps> = ({
  mesAtual,
  onDiaClick,
  diasComAtividades = {},
  dataInicioCronograma,
  onMesAnterior,
  onMesProximo,
  onVoltarParaHoje,
}) => {
  const hoje = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Calcular número da semana do cronograma (1-30)
  // S1 = 25 a 31 de Janeiro 2026
  const calcularSemanaCronograma = (data: Date): number => {
    // Data de início da Semana 1: 25 de Janeiro de 2026
    const inicioS1 = new Date(2026, 0, 25); // Mês 0 = Janeiro
    inicioS1.setHours(0, 0, 0, 0);

    const diffMs = data.getTime() - inicioS1.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semana = Math.floor(diffDias / 7) + 1;

    // Se for antes de 25/01, não tem semana definida
    if (diffDias < 0) return 0;

    return Math.max(1, Math.min(30, semana)); // Clamp entre 1 e 30
  };

  const diasCalendario = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDia = new Date(ano, mes + 1, 0);

    // Dia da semana do primeiro dia (0=Domingo, 1=Segunda, etc.)
    const diaSemanaInicio = primeiroDia.getDay();

    // Dias do mês anterior para completar a primeira semana
    const diasMesAnterior: DiaCalendario[] = [];
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const data = new Date(ano, mes, -i);
      const dataISO = data.toISOString().split('T')[0];
      const atividades = diasComAtividades[dataISO];

      diasMesAnterior.push({
        data,
        diaDoMes: data.getDate(),
        mesAtual: false,
        ehHoje: data.getTime() === hoje.getTime(),
        semana: calcularSemanaCronograma(data),
        temTemas: atividades?.temas > 0 || false,
        temRevisoes: atividades?.revisoes > 0 || false,
      });
    }

    // Dias do mês atual
    const diasMesAtual: DiaCalendario[] = [];
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      const dataISO = data.toISOString().split('T')[0];
      const atividades = diasComAtividades[dataISO];

      diasMesAtual.push({
        data,
        diaDoMes: dia,
        mesAtual: true,
        ehHoje: data.getTime() === hoje.getTime(),
        semana: calcularSemanaCronograma(data),
        temTemas: atividades?.temas > 0 || false,
        temRevisoes: atividades?.revisoes > 0 || false,
      });
    }

    // Dias do próximo mês para completar a última semana
    const totalDias = diasMesAnterior.length + diasMesAtual.length;
    const diasFaltantes = totalDias % 7 === 0 ? 0 : 7 - (totalDias % 7);
    const diasProximoMes: DiaCalendario[] = [];
    for (let dia = 1; dia <= diasFaltantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      const dataISO = data.toISOString().split('T')[0];
      const atividades = diasComAtividades[dataISO];

      diasProximoMes.push({
        data,
        diaDoMes: dia,
        mesAtual: false,
        ehHoje: data.getTime() === hoje.getTime(),
        semana: calcularSemanaCronograma(data),
        temTemas: atividades?.temas > 0 || false,
        temRevisoes: atividades?.revisoes > 0 || false,
      });
    }

    return [...diasMesAnterior, ...diasMesAtual, ...diasProximoMes];
  }, [mesAtual, diasComAtividades, hoje, dataInicioCronograma]);

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Verificar se pode navegar
  const podeVoltarMes = mesAtual.getMonth() > 0; // Não pode voltar antes de Janeiro
  const podeAvancarMes = mesAtual.getMonth() < 11; // Não pode avançar depois de Dezembro

  // Verificar se está no mês atual
  const agora = new Date();
  const estahNoMesAtual =
    agora.getFullYear() === 2026 &&
    mesAtual.getMonth() === agora.getMonth();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header com navegação */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Botão Mês Anterior */}
          <button
            onClick={onMesAnterior}
            disabled={!podeVoltarMes || !onMesAnterior}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full transition-all
              ${podeVoltarMes && onMesAnterior
                ? 'hover:bg-indigo-400 text-white cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
              }
            `}
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Título do Mês */}
          <div className="flex-1 text-center text-white">
            <h2 className="text-lg font-bold">
              {nomesMeses[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </h2>
            <p className="text-xs text-indigo-100 mt-1">Semanas 1 a 30 do Cronograma</p>
          </div>

          {/* Botão Mês Próximo */}
          <button
            onClick={onMesProximo}
            disabled={!podeAvancarMes || !onMesProximo}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full transition-all
              ${podeAvancarMes && onMesProximo
                ? 'hover:bg-indigo-400 text-white cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
              }
            `}
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Botão "Voltar para Hoje" - apenas se não estiver no mês atual */}
        {!estahNoMesAtual && onVoltarParaHoje && (
          <div className="mt-3 text-center">
            <button
              onClick={onVoltarParaHoje}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-400 hover:bg-indigo-300 text-white text-xs font-medium rounded-full transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Voltar para Hoje
            </button>
          </div>
        )}
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {diasDaSemana.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wide"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {diasCalendario.map((dia, index) => {
          const isPast = dia.data < hoje;
          const isClickable = !isPast || dia.ehHoje;

          return (
            <button
              key={index}
              onClick={() => isClickable && onDiaClick(dia.data)}
              disabled={!isClickable}
              className={`
                relative bg-white p-2 min-h-[60px] sm:min-h-[80px] flex flex-col items-start
                transition-all duration-150
                ${isClickable ? 'hover:bg-indigo-50 cursor-pointer' : 'cursor-not-allowed'}
                ${dia.ehHoje ? 'ring-2 ring-indigo-500 ring-inset' : ''}
                ${!dia.mesAtual ? 'bg-gray-50/50' : ''}
                ${isPast && !dia.ehHoje ? 'opacity-40' : ''}
              `}
            >
              {/* Número do dia */}
              <span
                className={`
                  text-sm font-semibold mb-1
                  ${dia.ehHoje
                    ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                    : dia.mesAtual
                    ? 'text-gray-800'
                    : 'text-gray-400'}
                `}
              >
                {dia.diaDoMes}
              </span>

              {/* Badge de semana do cronograma */}
              {dia.semana > 0 && (
                <span className="text-[9px] text-gray-400 font-medium mb-1">
                  S{dia.semana}
                </span>
              )}

              {/* Indicadores de atividades */}
              <div className="flex gap-0.5 mt-auto">
                {dia.temTemas && (
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-purple-500"
                    title="Tem temas programados"
                  />
                )}
                {dia.temRevisoes && (
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-orange-500"
                    title="Tem revisões programadas"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600" />
          <span className="text-gray-600">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600">Temas programados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600">Revisões programadas</span>
        </div>
      </div>
    </div>
  );
};
