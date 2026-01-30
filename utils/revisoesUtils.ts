// ==========================================
// SISTEMA DE REVISÕES COM AJUSTE PROPAGADO
// Ajusta todas as revisões futuras baseado em:
// 1. Resultado de questões (performance)
// 2. Antecipação/Atraso na realização
// ==========================================

import { RegistroDiario } from '../types';

// Intervalos padrão de revisão (em dias)
export const INTERVALOS_PADRAO = [1, 7, 15, 30, 60, 90];

// Definir resultado de performance em questões
export interface ResultadoQuestoes {
  total: number;
  corretas: number;
  percentualAcerto: number;
}

// Definir ajuste temporal (antecipação/atraso)
export interface AjusteTemporal {
  diasDiferenca: number; // Positivo = atrasou, Negativo = antecipou
  dataEsperada: string; // ISO date
  dataRealizada: string; // ISO date
}

// Calcular fator de ajuste baseado no percentual de acerto
export function calcularFatorAjuste(percentualAcerto: number): number {
  // Desempenho excelente (>= 90%): aumenta intervalos em 25%
  if (percentualAcerto >= 90) {
    return 1.25;
  }
  // Desempenho bom (80-89%): aumenta intervalos em 10%
  if (percentualAcerto >= 80) {
    return 1.10;
  }
  // Desempenho médio (70-79%): mantém intervalos
  if (percentualAcerto >= 70) {
    return 1.0;
  }
  // Desempenho regular (60-69%): reduz intervalos em 15%
  if (percentualAcerto >= 60) {
    return 0.85;
  }
  // Desempenho ruim (< 60%): reduz intervalos em 30%
  return 0.70;
}

// Ajustar intervalos baseado em performance
export function ajustarIntervalosPorPerformance(
  intervalosAtuais: number[],
  resultado: ResultadoQuestoes
): number[] {
  const fator = calcularFatorAjuste(resultado.percentualAcerto);

  // Aplicar fator a todos os intervalos
  return intervalosAtuais.map(intervalo => Math.round(intervalo * fator));
}

// Calcular diferença temporal (em dias) entre datas
function calcularDiferencaDias(dataEsperada: string, dataRealizada: string): number {
  const esperada = new Date(dataEsperada);
  const realizada = new Date(dataRealizada);

  esperada.setHours(0, 0, 0, 0);
  realizada.setHours(0, 0, 0, 0);

  const diffMs = realizada.getTime() - esperada.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Aplicar ajuste temporal a todas as revisões futuras
export function aplicarAjusteTemporalEmTodasRevisoes(
  revisoesProgramadas: RegistroDiario[],
  revisaoRealizadaIndex: number,
  ajuste: AjusteTemporal
): RegistroDiario[] {
  const novasRevisoes = [...revisoesProgramadas];

  // Calcular diferença real
  const diasDiferenca = calcularDiferencaDias(ajuste.dataEsperada, ajuste.dataRealizada);

  console.log(`📅 Ajuste temporal detectado: ${diasDiferenca} dias (${diasDiferenca > 0 ? 'atrasou' : 'antecipou'})`);

  // Aplicar ajuste a todas as revisões APÓS a atual
  for (let i = revisaoRealizadaIndex + 1; i < novasRevisoes.length; i++) {
    const revisao = novasRevisoes[i];
    const dataOriginal = new Date(revisao.data);

    // Adicionar/subtrair dias
    dataOriginal.setDate(dataOriginal.getDate() + diasDiferenca);

    // Atualizar data
    novasRevisoes[i] = {
      ...revisao,
      data: dataOriginal.toISOString().split('T')[0]
    };

    console.log(`  ✅ Revisão ${i + 1}: ${revisao.data} → ${novasRevisoes[i].data}`);
  }

  return novasRevisoes;
}

// Recalcular todas as revisões futuras com novos intervalos
export function recalcularRevisoesFuturasComNovosIntervalos(
  revisoesProgramadas: RegistroDiario[],
  revisaoRealizadaIndex: number,
  novosIntervalos: number[],
  dataBase: string // Data da revisão atual (realizada)
): RegistroDiario[] {
  const novasRevisoes = [...revisoesProgramadas];

  console.log(`📊 Recalculando revisões futuras com novos intervalos:`, novosIntervalos);

  let dataReferencia = new Date(dataBase);
  dataReferencia.setHours(0, 0, 0, 0);

  // Recalcular todas as revisões APÓS a atual
  for (let i = revisaoRealizadaIndex + 1; i < novasRevisoes.length; i++) {
    const indiceIntervalo = i - revisaoRealizadaIndex - 1; // -1 porque o primeiro intervalo é entre a revisão atual e a próxima

    // Se ainda tem intervalos definidos, usar; senão manter o último
    const intervalo = indiceIntervalo < novosIntervalos.length
      ? novosIntervalos[indiceIntervalo]
      : novosIntervalos[novosIntervalos.length - 1];

    // Calcular nova data
    const novaData = new Date(dataReferencia);
    novaData.setDate(novaData.getDate() + intervalo);

    const dataOriginal = novasRevisoes[i].data;
    novasRevisoes[i] = {
      ...novasRevisoes[i],
      data: novaData.toISOString().split('T')[0]
    };

    console.log(`  ✅ Revisão ${i + 1}: ${dataOriginal} → ${novasRevisoes[i].data} (+${intervalo} dias)`);

    // Atualizar data de referência para a próxima iteração
    dataReferencia = novaData;
  }

  return novasRevisoes;
}

// Processar revisão completa: ajuste temporal + ajuste por performance
export function processarRevisaoComAjustes(
  revisoesProgramadas: RegistroDiario[],
  revisaoRealizadaIndex: number,
  dataRealizacao: string,
  resultado?: ResultadoQuestoes
): {
  novasRevisoes: RegistroDiario[];
  intervalosAjustados: number[];
  log: string[];
} {
  const log: string[] = [];
  let novasRevisoes = [...revisoesProgramadas];
  let intervalosAtuais = [...INTERVALOS_PADRAO];

  // 1. Verificar ajuste temporal (antecipação/atraso)
  const revisaoAtual = revisoesProgramadas[revisaoRealizadaIndex];
  const diasDiferenca = calcularDiferencaDias(revisaoAtual.data, dataRealizacao);

  if (diasDiferenca !== 0) {
    log.push(`Ajuste temporal: ${Math.abs(diasDiferenca)} dias (${diasDiferenca > 0 ? 'atrasado' : 'antecipado'})`);

    novasRevisoes = aplicarAjusteTemporalEmTodasRevisoes(
      novasRevisoes,
      revisaoRealizadaIndex,
      {
        diasDiferenca,
        dataEsperada: revisaoAtual.data,
        dataRealizada: dataRealizacao
      }
    );
  }

  // 2. Ajustar intervalos baseado em performance (se houver resultado de questões)
  if (resultado && resultado.total > 0) {
    const percentual = resultado.percentualAcerto;
    log.push(`Performance: ${percentual.toFixed(1)}% de acerto`);

    intervalosAtuais = ajustarIntervalosPorPerformance(intervalosAtuais, resultado);
    log.push(`Intervalos ajustados: [${intervalosAtuais.join(', ')}]`);

    // Recalcular todas as revisões futuras com os novos intervalos
    novasRevisoes = recalcularRevisoesFuturasComNovosIntervalos(
      novasRevisoes,
      revisaoRealizadaIndex,
      intervalosAtuais,
      dataRealizacao
    );
  }

  return {
    novasRevisoes,
    intervalosAjustados: intervalosAtuais,
    log
  };
}

// Gerar log de mudanças para o ChangeLog
export function gerarChangeLogRevisoes(
  revisaoAntiga: RegistroDiario[],
  revisaoNova: RegistroDiario[],
  temaNome: string
): string[] {
  const mudancas: string[] = [];

  for (let i = 0; i < Math.max(revisaoAntiga.length, revisaoNova.length); i++) {
    const antiga = revisaoAntiga[i];
    const nova = revisaoNova[i];

    if (antiga && nova && antiga.data !== nova.data) {
      const diasDiff = calcularDiferencaDias(antiga.data, nova.data);
      const direcao = diasDiff > 0 ? 'adiada' : 'antecipada';

      mudancas.push(
        `Revisão ${i + 1} de "${temaNome}": ${direcao} de ${antiga.data} para ${nova.data} (${Math.abs(diasDiff)} dias)`
      );
    }
  }

  return mudancas;
}

// Criar revisões iniciais para um tema (primeira vez)
export function criarRevisoesProgramadas(
  temaNome: string,
  dataPrimeiraVez: string,
  intervalos: number[] = INTERVALOS_PADRAO
): RegistroDiario[] {
  const revisoes: RegistroDiario[] = [];
  let dataReferencia = new Date(dataPrimeiraVez);
  dataReferencia.setHours(0, 0, 0, 0);

  intervalos.forEach((intervalo, index) => {
    const dataRevisao = new Date(dataReferencia);
    dataRevisao.setDate(dataRevisao.getDate() + intervalo);

    revisoes.push({
      data: dataRevisao.toISOString().split('T')[0],
      tema: temaNome,
      acao: `Revisão ${index + 1}`,
      semana: undefined // Será calculado depois
    });

    // Atualizar data de referência para a próxima iteração
    dataReferencia = dataRevisao;
  });

  return revisoes;
}

// Buscar próxima revisão pendente de um tema
export function buscarProximaRevisaoPendente(
  revisoes: RegistroDiario[],
  dataAtual: string = new Date().toISOString().split('T')[0]
): RegistroDiario | null {
  const hoje = new Date(dataAtual);
  hoje.setHours(0, 0, 0, 0);

  // Encontrar a primeira revisão que ainda não passou
  for (const revisao of revisoes) {
    const dataRevisao = new Date(revisao.data);
    dataRevisao.setHours(0, 0, 0, 0);

    if (dataRevisao >= hoje) {
      return revisao;
    }
  }

  return null;
}

// Exportar tipos e constantes
export type { RegistroDiario, ResultadoQuestoes, AjusteTemporal };
