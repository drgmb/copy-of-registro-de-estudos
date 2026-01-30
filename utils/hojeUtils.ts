import {
  AtividadeDia,
  EstadoAbaHoje,
  EstatisticasDia,
  RegistroDiario,
  StudySession,
  TipoAtividade,
  StatusAtividade,
  CorRelevancia
} from '../types';
import { TEMAS_CORES } from '../temasCentralizados';

// Gerar UUID simples
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Calcular diferença em dias entre duas datas
export function calcularDiasAtraso(dataProgramada: Date, dataHoje: Date): number {
  const diff = dataHoje.getTime() - dataProgramada.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dias; // Positivo = atrasado, Negativo = antecipado
}

// Normalizar data para comparação (zerar horas)
function normalizarData(data: Date): Date {
  const normalizada = new Date(data);
  normalizada.setHours(0, 0, 0, 0);
  return normalizada;
}

// Converter data DD/MM/YYYY para formato ISO (YYYY-MM-DD)
function converterDDMMYYYYparaISO(dataDDMMYYYY: string): string {
  // Aceitar tanto DD/MM/YYYY quanto YYYY-MM-DD (já em ISO)
  if (dataDDMMYYYY.includes('-') && dataDDMMYYYY.length === 10) {
    // Já está em formato ISO
    return dataDDMMYYYY;
  }

  // Converter DD/MM/YYYY para YYYY-MM-DD
  const partes = dataDDMMYYYY.split('/');
  if (partes.length !== 3) {
    console.warn('Formato de data inválido:', dataDDMMYYYY);
    return dataDDMMYYYY; // Retornar como está
  }

  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

// Verificar se duas datas são do mesmo dia (ignora timezone)
function mesmaData(data1: Date, data2: Date): boolean {
  const d1 = normalizarData(data1);
  const d2 = normalizarData(data2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Criar data a partir de string ISO ignorando timezone (usa apenas YYYY-MM-DD)
function criarDataLocal(isoString: string): Date {
  // Extrair apenas a parte da data (YYYY-MM-DD)
  const dataApenas = isoString.split('T')[0];
  const [ano, mes, dia] = dataApenas.split('-').map(Number);

  // Criar data no timezone local (sem conversão UTC)
  const data = new Date(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);

  return data;
}

// Mapear ação do diário para TipoAtividade
function mapearTipoAtividade(acao: string): TipoAtividade {
  const acaoLower = acao.toLowerCase();
  if (acaoLower.includes('primeira') || acaoLower.includes('1')) {
    return 'PRIMEIRA_VEZ';
  }
  return 'REVISAO';
}

// Extrair número da revisão se aplicável
function extrairNumeroRevisao(acao: string): number | undefined {
  const match = acao.match(/(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

// Obter cor do tema
function obterCorTema(nomeTema: string): CorRelevancia {
  return TEMAS_CORES[nomeTema] || 'VERDE';
}

// Criar AtividadeDia a partir de dados do diário e data entry
function criarAtividade(
  diario: RegistroDiario | null,
  dataEntry: StudySession | null,
  status: StatusAtividade,
  foraPrograma?: {
    tipo: 'ANTECIPADO' | 'ATRASADO_CONCLUIDO' | 'EXTRA';
    diasDiferenca: number;
    dataOriginal?: Date;
  }
): AtividadeDia {
  const temaNome = diario?.tema || dataEntry?.topic || '';
  const dataProgramada = diario ? criarDataLocal(diario.data) : new Date();
  const dataRealizada = dataEntry ? criarDataLocal(dataEntry.date) : undefined;

  const tipo = diario
    ? mapearTipoAtividade(diario.acao)
    : dataEntry
    ? (dataEntry.isClass ? 'PRIMEIRA_VEZ' : 'REVISAO')
    : 'PRIMEIRA_VEZ';

  const numeroRevisao = diario ? extrairNumeroRevisao(diario.acao) : undefined;

  const questoesFeitas = dataEntry?.totalQuestions || 0;
  const questoesCorretas = dataEntry?.correctQuestions || 0;
  const percentualAcerto =
    questoesFeitas > 0 ? Math.round((questoesCorretas / questoesFeitas) * 100) : 0;

  const horaRealizada = dataEntry
    ? new Date(dataEntry.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : undefined;

  const diasDeAtraso = diario
    ? calcularDiasAtraso(new Date(diario.data), new Date())
    : undefined;

  return {
    id: generateUUID(),
    temaId: generateUUID(), // TODO: Integrar com ID real do cronograma se disponível
    temaNome,
    temaCor: obterCorTema(temaNome),
    tipo,
    numeroRevisao,
    status,
    dataProgramada,
    dataRealizada,
    horaRealizada,
    diasDeAtraso,
    questoesFeitas: questoesFeitas > 0 ? questoesFeitas : undefined,
    questoesCorretas: questoesCorretas > 0 ? questoesCorretas : undefined,
    percentualAcerto: questoesFeitas > 0 ? percentualAcerto : undefined,
    foraPrograma,
    origem: {
      diario: !!diario,
      dataEntry: !!dataEntry
    }
  };
}

// Processar atividades do dia
export function processarAtividadesDia(
  diarioCompleto: RegistroDiario[],
  dataEntryCompleto: StudySession[]
): EstadoAbaHoje {
  const hoje = normalizarData(new Date());

  console.log('🔍 [DEBUG HOJE] Data atual (hoje):', hoje.toISOString().split('T')[0]);
  console.log('🔍 [DEBUG HOJE] Total registros DIÁRIO:', diarioCompleto.length);
  console.log('🔍 [DEBUG HOJE] Total registros DATA ENTRY:', dataEntryCompleto.length);

  // 1. Filtrar atividades programadas para hoje no DIÁRIO
  const programadosHoje = diarioCompleto.filter((reg) => {
    const dataReg = criarDataLocal(reg.data);
    const isHoje = mesmaData(dataReg, hoje);

    if (isHoje) {
      console.log('  📅 Programado para hoje:', reg.tema, '-', reg.acao, '-', reg.data);
    }

    return isHoje;
  });

  console.log('📋 Total programados para hoje:', programadosHoje.length);

  // 2. Filtrar atividades realizadas hoje no DATA ENTRY
  const realizadosHoje = dataEntryCompleto.filter((reg) => {
    const dataReg = criarDataLocal(reg.date);
    const isHoje = mesmaData(dataReg, hoje);

    if (isHoje) {
      console.log('  ✅ Realizado hoje:', reg.topic, '-', (reg.isClass ? 'Primeira vez' : 'Revisão'), '-', reg.date);
    }

    return isHoje;
  });

  console.log('✅ Total realizados hoje:', realizadosHoje.length);

  // 3. Filtrar atividades atrasadas (DIÁRIO < hoje E não em DATA ENTRY)
  const atrasados = diarioCompleto.filter((reg) => {
    const dataReg = criarDataLocal(reg.data);

    // Deve ser anterior a hoje
    if (dataReg >= hoje) return false;

    // Verificar se NÃO foi concluída
    const foiConcluida = dataEntryCompleto.some(
      (de) =>
        de.topic === reg.tema &&
        mapearTipoAtividade(reg.acao) ===
          (de.isClass ? 'PRIMEIRA_VEZ' : 'REVISAO')
    );

    if (!foiConcluida) {
      console.log('  🔴 Atrasado:', reg.tema, '-', reg.acao, '-', reg.data);
    }

    return !foiConcluida;
  });

  console.log('🔴 Total atrasados:', atrasados.length);

  // Arrays de resultado
  const concluidos: AtividadeDia[] = [];
  const pendentes: AtividadeDia[] = [];
  const foraPrograma: AtividadeDia[] = []; // Apenas revisões não programadas
  const temasVistosHoje: AtividadeDia[] = []; // Primeiro Contato feito hoje

  // 4. Processar programados de hoje
  for (const prog of programadosHoje) {
    const tipo = mapearTipoAtividade(prog.acao);
    const realizado = realizadosHoje.find(
      (r) => r.topic === prog.tema && (r.isClass ? 'PRIMEIRA_VEZ' : 'REVISAO') === tipo
    );

    if (realizado) {
      concluidos.push(criarAtividade(prog, realizado, 'CONCLUIDO'));
    } else {
      pendentes.push(criarAtividade(prog, null, 'PENDENTE'));
    }
  }

  // 5. Processar realizados que não estavam programados para hoje
  for (const real of realizadosHoje) {
    const tipo = real.isClass ? 'PRIMEIRA_VEZ' : 'REVISAO';
    const programadoHoje = programadosHoje.find(
      (p) => p.tema === real.topic && mapearTipoAtividade(p.acao) === tipo
    );

    if (!programadoHoje) {
      // Verificar se estava programado para outra data
      const programadoOutraData = diarioCompleto.find(
        (d) => d.tema === real.topic && mapearTipoAtividade(d.acao) === tipo
      );

      if (programadoOutraData) {
        const dataProg = criarDataLocal(programadoOutraData.data);
        const diasDif = calcularDiasAtraso(dataProg, hoje);

        // Revisões antecipadas/atrasadas vão para "Fora do Programado"
        if (tipo === 'REVISAO') {
          if (diasDif < 0) {
            // Antecipado
            foraPrograma.push(
              criarAtividade(programadoOutraData, real, 'FORA_PROGRAMADO', {
                tipo: 'ANTECIPADO',
                diasDiferenca: Math.abs(diasDif),
                dataOriginal: dataProg
              })
            );
          } else {
            // Atrasado mas concluído
            foraPrograma.push(
              criarAtividade(programadoOutraData, real, 'FORA_PROGRAMADO', {
                tipo: 'ATRASADO_CONCLUIDO',
                diasDiferenca: diasDif,
                dataOriginal: dataProg
              })
            );
          }
        } else {
          // Primeira vez antecipada/atrasada vai para "Temas Vistos Hoje"
          temasVistosHoje.push(
            criarAtividade(programadoOutraData, real, 'CONCLUIDO')
          );
        }
      } else {
        // Não estava programado
        if (tipo === 'PRIMEIRA_VEZ') {
          // Primeiro Contato não programado vai para "Temas Vistos Hoje"
          temasVistosHoje.push(
            criarAtividade(null, real, 'CONCLUIDO', {
              tipo: 'EXTRA',
              diasDiferenca: 0
            })
          );
        } else {
          // Revisão não programada vai para "Fora do Programado"
          foraPrograma.push(
            criarAtividade(null, real, 'FORA_PROGRAMADO', {
              tipo: 'EXTRA',
              diasDiferenca: 0
            })
          );
        }
      }
    }
  }

  // 6. Processar atrasados
  const atividadesAtrasadas: AtividadeDia[] = atrasados.map((atr) =>
    criarAtividade(atr, null, 'ATRASADO')
  );

  // 7. Calcular estatísticas
  const stats = calcularEstatisticas(
    concluidos,
    pendentes,
    programadosHoje.length
  );

  return {
    dataAtual: hoje,
    concluidos,
    pendentes,
    atrasados: atividadesAtrasadas,
    foraPrograma,
    temasVistosHoje,
    stats
  };
}

// Calcular estatísticas do dia
function calcularEstatisticas(
  concluidos: AtividadeDia[],
  pendentes: AtividadeDia[],
  totalProgramadas: number
): EstatisticasDia {
  const totalRealizadas = concluidos.length;
  const taxaConclusao =
    totalProgramadas > 0 ? (totalRealizadas / totalProgramadas) * 100 : 0;

  // Calcular performance média
  const concluidosComQuestoes = concluidos.filter((c) => c.questoesFeitas);
  const performanceMedia =
    concluidosComQuestoes.length > 0
      ? concluidosComQuestoes.reduce(
          (acc, c) => acc + (c.percentualAcerto || 0),
          0
        ) / concluidosComQuestoes.length
      : 0;

  // Breakdown por tipo
  const primeiraVezProgramadas = pendentes.filter(
    (p) => p.tipo === 'PRIMEIRA_VEZ'
  ).length + concluidos.filter((c) => c.tipo === 'PRIMEIRA_VEZ').length;

  const primeiraVezConcluidas = concluidos.filter(
    (c) => c.tipo === 'PRIMEIRA_VEZ'
  ).length;

  const revisoesProgramadas = pendentes.filter(
    (p) => p.tipo === 'REVISAO'
  ).length + concluidos.filter((c) => c.tipo === 'REVISAO').length;

  const revisoesConcluidas = concluidos.filter(
    (c) => c.tipo === 'REVISAO'
  ).length;

  return {
    totalProgramadas,
    totalRealizadas,
    taxaConclusao,
    performanceMedia,
    primeiraVez: {
      programadas: primeiraVezProgramadas,
      concluidas: primeiraVezConcluidas
    },
    revisoes: {
      programadas: revisoesProgramadas,
      concluidas: revisoesConcluidas
    }
  };
}

// Buscar dados do DIÁRIO do Google Sheets
export async function carregarDiario(sheetUrl: string): Promise<RegistroDiario[]> {
  if (!sheetUrl) return [];

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getDiario');

    const response = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
      body: formData
    });

    const result = await response.json();

    if (result.status === 'error') {
      console.error('Erro ao carregar diário:', result.message);
      return [];
    }

    const data: RegistroDiario[] = result.data || [];

    // Converter datas de DD/MM/YYYY para ISO (YYYY-MM-DD)
    return data.map(registro => ({
      ...registro,
      data: converterDDMMYYYYparaISO(registro.data)
    }));
  } catch (error) {
    console.error('Erro ao carregar diário:', error);
    return [];
  }
}

// Buscar dados do DATA ENTRY do Google Sheets
export async function carregarDataEntry(
  sheetUrl: string
): Promise<StudySession[]> {
  if (!sheetUrl) return [];

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getAllStudySessions');

    const response = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
      body: formData
    });

    const result = await response.json();

    if (result.status === 'error') {
      console.error('Erro ao carregar data entry:', result.message);
      return [];
    }

    const data: StudySession[] = result.data || [];

    // Converter datas de DD/MM/YYYY para ISO (YYYY-MM-DD)
    return data.map(session => ({
      ...session,
      date: converterDDMMYYYYparaISO(session.date)
    }));
  } catch (error) {
    console.error('Erro ao carregar data entry:', error);
    return [];
  }
}

// Formatar data para exibição
export function formatarData(data: Date, formato: 'completo' | 'curto' = 'completo'): string {
  if (formato === 'curto') {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formatar hora
export function formatarHora(hora: string): string {
  return hora;
}

// Obter mensagem motivacional baseada na taxa de conclusão
export function obterMensagemMotivacional(taxaConclusao: number, temAtrasados: boolean): string {
  if (taxaConclusao === 100) {
    return '🎉 Parabéns! Você completou todas as atividades de hoje!';
  }
  if (taxaConclusao >= 70) {
    return '💪 Ótimo progresso! Continue assim!';
  }
  if (taxaConclusao >= 50) {
    return '⏰ Bom trabalho! Ainda há algumas atividades pendentes.';
  }
  if (temAtrasados) {
    return '⚠️ Você tem atividades atrasadas. Priorize-as!';
  }
  return '📚 Vamos começar! Você consegue!';
}
