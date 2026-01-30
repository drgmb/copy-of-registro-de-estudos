import { TemaEstudo, SemanaEstudo, CronogramaState, CorRelevancia } from '../types';
import { TEMAS_CORES } from '../temasColors';

// Constantes
const TOTAL_SEMANAS = 30;

// Gerar UUID simples
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Criar tema inicial vazio
export function criarTemaInicial(
  nome: string,
  cor: CorRelevancia,
  semana: number
): TemaEstudo {
  return {
    id: generateUUID(),
    nome,
    cor,
    semanaOriginal: semana,
    semanaAtual: semana,
    estudado: false,
    primeiraVisualizacao: null,
    apenasAula: false,
    aulaERevisao: false,
    apenasRevisao: false,
    datasEstudos: [],
    revisoesTotal: 0,
    revisoesConcluidas: 0,
    datasRevisoes: [],
    questoesFeitas: 0,
    questoesCorretas: 0,
    questoesErradas: 0,
    grauDificuldade: null,
    logMigracoes: []
  };
}

// Calcular datas das semanas (inicio = hoje)
export function calcularDatasSemanas(dataInicial: Date): { inicio: string; termino: string }[] {
  const datas: { inicio: string; termino: string }[] = [];

  for (let i = 0; i < TOTAL_SEMANAS; i++) {
    const inicio = new Date(dataInicial);
    inicio.setDate(dataInicial.getDate() + (i * 7));

    const termino = new Date(inicio);
    termino.setDate(inicio.getDate() + 6);

    datas.push({
      inicio: inicio.toISOString(),
      termino: termino.toISOString()
    });
  }

  return datas;
}

// Distribuir 645 temas em 30 semanas (~21-22 temas por semana)
export function distribuirTemasEmSemanas(): SemanaEstudo[] {
  const dataInicial = new Date();
  dataInicial.setHours(0, 0, 0, 0); // Resetar horário

  const datasSemanas = calcularDatasSemanas(dataInicial);
  const temas = Object.keys(TEMAS_CORES);
  const totalTemas = temas.length;
  const temasPorSemana = Math.ceil(totalTemas / TOTAL_SEMANAS);

  const semanas: SemanaEstudo[] = [];

  for (let i = 0; i < TOTAL_SEMANAS; i++) {
    const numeroSemana = i + 1;
    const inicio = i * temasPorSemana;
    const fim = Math.min(inicio + temasPorSemana, totalTemas);
    const temasDestaSemana = temas.slice(inicio, fim);

    const temaEstudoArray: TemaEstudo[] = temasDestaSemana.map(nomeTema => {
      const cor = TEMAS_CORES[nomeTema];
      return criarTemaInicial(nomeTema, cor, numeroSemana);
    });

    semanas.push({
      numero: numeroSemana,
      dataInicio: datasSemanas[i].inicio,
      dataTermino: datasSemanas[i].termino,
      temas: temaEstudoArray
    });
  }

  return semanas;
}

// Inicializar cronograma (primeira vez)
export function inicializarCronograma(): CronogramaState {
  const agora = new Date().toISOString();

  return {
    semanas: distribuirTemasEmSemanas(),
    dataInicialCronograma: agora,
    ultimaAtualizacao: agora
  };
}

// Migrar tema entre semanas
export function migrarTema(
  tema: TemaEstudo,
  novaSemana: number,
  semanas: SemanaEstudo[]
): { temaAtualizado: TemaEstudo; semanasAtualizadas: SemanaEstudo[] } {
  const temaAtualizado: TemaEstudo = {
    ...tema,
    semanaAtual: novaSemana,
    logMigracoes: [
      ...tema.logMigracoes,
      {
        de: tema.semanaAtual,
        para: novaSemana,
        data: new Date().toISOString()
      }
    ]
  };

  // Remover tema da semana antiga
  const semanasAtualizadas = semanas.map(semana => {
    if (semana.numero === tema.semanaAtual) {
      return {
        ...semana,
        temas: semana.temas.filter(t => t.id !== tema.id)
      };
    }
    return semana;
  });

  // Adicionar tema à nova semana
  const semanasFinais = semanasAtualizadas.map(semana => {
    if (semana.numero === novaSemana) {
      return {
        ...semana,
        temas: [...semana.temas, temaAtualizado]
      };
    }
    return semana;
  });

  return { temaAtualizado, semanasAtualizadas: semanasFinais };
}

// Calcular estatísticas gerais
export function calcularEstatisticas(semanas: SemanaEstudo[]): {
  totalTemas: number;
  temasEstudados: number;
  percentualConclusao: number;
  temasFora: number;
} {
  let totalTemas = 0;
  let temasEstudados = 0;
  let temasFora = 0;

  semanas.forEach(semana => {
    totalTemas += semana.temas.length;
    semana.temas.forEach(tema => {
      if (tema.estudado) {
        temasEstudados++;
      }
      if (tema.semanaOriginal !== tema.semanaAtual) {
        temasFora++;
      }
    });
  });

  const percentualConclusao = totalTemas > 0 ? (temasEstudados / totalTemas) * 100 : 0;

  return {
    totalTemas,
    temasEstudados,
    percentualConclusao,
    temasFora
  };
}

// Carregar cronograma do Google Sheets
export async function carregarCronograma(sheetUrl: string): Promise<CronogramaState | null> {
  if (!sheetUrl) return null;

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getCronogramaCompleto');

    const response = await fetch(sheetUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === 'error') {
      console.error('Erro ao carregar cronograma:', result.message);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Erro ao carregar cronograma:', error);
    return null;
  }
}

// Salvar cronograma no Google Sheets
export async function salvarCronograma(
  state: CronogramaState,
  sheetUrl: string
): Promise<boolean> {
  if (!sheetUrl) {
    console.warn('Sem URL configurada - dados não salvos');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'saveCronograma');
    formData.append('data', JSON.stringify(state));

    const response = await fetch(sheetUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === 'error') {
      console.error('Erro ao salvar cronograma:', result.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar cronograma:', error);
    return false;
  }
}

// Atualizar um tema específico
export function atualizarTema(
  tema: TemaEstudo,
  semanas: SemanaEstudo[]
): SemanaEstudo[] {
  return semanas.map(semana => {
    if (semana.numero === tema.semanaAtual) {
      return {
        ...semana,
        temas: semana.temas.map(t => t.id === tema.id ? tema : t)
      };
    }
    return semana;
  });
}

// Buscar tema por ID
export function buscarTemaPorId(
  id: string,
  semanas: SemanaEstudo[]
): TemaEstudo | null {
  for (const semana of semanas) {
    const tema = semana.temas.find(t => t.id === id);
    if (tema) return tema;
  }
  return null;
}

// Calcular percentual de acerto
export function calcularPercentualAcerto(corretas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((corretas / total) * 100 * 10) / 10; // 1 casa decimal
}
