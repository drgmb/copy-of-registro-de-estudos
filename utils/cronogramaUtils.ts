import { TemaEstudo, SemanaEstudo, CronogramaState, CorRelevancia } from '../types';
import { TEMAS_CORES } from '../temasCentralizados';

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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
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

// ==========================================
// NOVO SISTEMA DE CRONOGRAMA SINCRONIZADO
// ==========================================

// Carregar dados base do cronograma (645 temas)
export async function carregarCronogramaBase(sheetUrl: string): Promise<any[]> {
  if (!sheetUrl) return [];

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getCronogramaBase');

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
      console.error('Erro ao carregar cronograma base:', result.message);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error('Erro ao carregar cronograma base:', error);
    return [];
  }
}

// Carregar progresso dos temas
export async function carregarCronogramaProgressoAPI(sheetUrl: string): Promise<any[]> {
  if (!sheetUrl) return [];

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getCronogramaProgresso');

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
      console.error('Erro ao carregar progresso:', result.message);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
    return [];
  }
}

// Combinar dados base + progresso para criar cronograma completo
export function combinarCronograma(
  temasBase: any[],
  progressos: any[]
): CronogramaState {
  // Criar mapa de progressos por ID
  const progressoMap = new Map<string, any>();
  progressos.forEach(p => {
    progressoMap.set(p.idTema, p);
  });

  // Distribuir temas em 30 semanas
  const dataInicial = new Date();
  dataInicial.setHours(0, 0, 0, 0);
  const datasSemanas = calcularDatasSemanas(dataInicial);

  // Agrupar por semana
  const temasPorSemana: Map<number, TemaEstudo[]> = new Map();

  temasBase.forEach(temaBase => {
    const progresso = progressoMap.get(temaBase.id);

    // Determinar semana atual (usa progresso se existir, senão usa semanaOriginal)
    const semanaAtual = progresso?.semanaAtual || temaBase.semanaOriginal;

    // Criar TemaEstudo completo
    const tema: TemaEstudo = {
      id: temaBase.id,
      nome: temaBase.nome,
      cor: temaBase.cor as CorRelevancia,
      semanaOriginal: temaBase.semanaOriginal,
      semanaAtual: semanaAtual,
      estudado: progresso?.estudado || false,
      primeiraVisualizacao: progresso?.primeiraVez || null,
      apenasAula: progresso?.tipoEstudo === 'AULA',
      aulaERevisao: progresso?.tipoEstudo === 'AULA_E_REVISAO',
      apenasRevisao: progresso?.tipoEstudo === 'REVISAO',
      datasEstudos: progresso?.datasEstudos || [],
      revisoesTotal: progresso?.revisoesTotal || 0,
      revisoesConcluidas: progresso?.revisoesConcluidas || 0,
      datasRevisoes: progresso?.datasRevisoes || [],
      questoesFeitas: progresso?.questoesFeitas || 0,
      questoesCorretas: progresso?.questoesCorretas || 0,
      questoesErradas: progresso?.questoesErradas || 0,
      grauDificuldade: progresso?.grauDificuldade || null,
      logMigracoes: progresso?.migracoes ? JSON.parse(progresso.migracoes) : []
    };

    // Adicionar ao mapa por semana
    if (!temasPorSemana.has(semanaAtual)) {
      temasPorSemana.set(semanaAtual, []);
    }
    temasPorSemana.get(semanaAtual)!.push(tema);
  });

  // Criar array de semanas
  const semanas: SemanaEstudo[] = [];
  for (let i = 1; i <= TOTAL_SEMANAS; i++) {
    semanas.push({
      numero: i,
      dataInicio: datasSemanas[i - 1].inicio,
      dataTermino: datasSemanas[i - 1].termino,
      temas: temasPorSemana.get(i) || []
    });
  }

  return {
    semanas,
    dataInicialCronograma: dataInicial.toISOString(),
    ultimaAtualizacao: new Date().toISOString()
  };
}

// Salvar progresso de um tema específico
export async function salvarProgressoTema(
  sheetUrl: string,
  tema: TemaEstudo
): Promise<boolean> {
  if (!sheetUrl) return false;

  try {
    // Determinar tipo de estudo
    let tipoEstudo = '';
    if (tema.apenasAula) tipoEstudo = 'AULA';
    else if (tema.aulaERevisao) tipoEstudo = 'AULA_E_REVISAO';
    else if (tema.apenasRevisao) tipoEstudo = 'REVISAO';

    const progresso = {
      idTema: tema.id,
      semanaAtual: tema.semanaAtual,
      estudado: tema.estudado,
      primeiraVez: tema.primeiraVisualizacao,
      tipoEstudo,
      datasEstudos: tema.datasEstudos,
      revisoesTotal: tema.revisoesTotal,
      revisoesConcluidas: tema.revisoesConcluidas,
      datasRevisoes: tema.datasRevisoes,
      questoesFeitas: tema.questoesFeitas,
      questoesCorretas: tema.questoesCorretas,
      questoesErradas: tema.questoesErradas,
      grauDificuldade: tema.grauDificuldade,
      migracoes: JSON.stringify(tema.logMigracoes)
    };

    const formData = new URLSearchParams();
    formData.append('action', 'salvarProgresso');
    formData.append('progresso', JSON.stringify(progresso));

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
      console.error('Erro ao salvar progresso:', result.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    return false;
  }
}

// Carregar cronograma completo sincronizado
export async function carregarCronogramaSync(sheetUrl: string): Promise<CronogramaState | null> {
  if (!sheetUrl) return null;

  try {
    // Importação dinâmica para evitar dependências circulares
    const { carregarDiario, carregarDataEntry } = await import('./hojeUtils');
    const { calcularProgressoDeRegistros, mesclarProgressos } = await import('./processarProgressoCronograma');
    const { TEMAS_BASE } = await import('../temasCentralizados');

    // Usar dados base do CSV (mais rápido que buscar da planilha)
    // Converter TEMAS_BASE para o formato esperado
    const temasBase = TEMAS_BASE.map(tema => ({
      id: tema.id,
      nome: tema.nome,
      cor: tema.cor,
      semanaOriginal: tema.semanaOriginal
    }));

    // Carregar apenas dados dinâmicos da planilha
    const [dataEntry, diario, progressosSalvos] = await Promise.all([
      carregarDataEntry(sheetUrl),
      carregarDiario(sheetUrl),
      carregarCronogramaProgressoAPI(sheetUrl)
    ]);

    if (temasBase.length === 0) {
      console.warn('Nenhum tema encontrado no CSV');
      return null;
    }

    // Calcular progresso automaticamente de DATA ENTRY e DIÁRIO
    const progressoCalculado = calcularProgressoDeRegistros(dataEntry, diario);

    // Mesclar com progresso salvo (para migrações manuais e avaliações)
    const progressoFinal = mesclarProgressos(progressoCalculado, progressosSalvos);

    // Converter Map para array
    const progressosArray = Array.from(progressoFinal.values());

    return combinarCronograma(temasBase, progressosArray);
  } catch (error) {
    console.error('Erro ao carregar cronograma sincronizado:', error);
    return null;
  }
}
