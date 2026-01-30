// ==========================================
// TEMAS COMPOSTOS - Gerenciamento
// Permite unir múltiplos temas em um tema composto
// ==========================================

import { TemaEstudo, TemaCompostoInfo, CorRelevancia, CronogramaState } from '../types';

// Criar tema composto a partir de múltiplos temas
export function criarTemaComposto(
  temas: TemaEstudo[],
  cronograma: CronogramaState
): { temaComposto: TemaEstudo; cronogramaAtualizado: CronogramaState } {
  if (temas.length < 2) {
    throw new Error('É necessário pelo menos 2 temas para criar um tema composto');
  }

  // Ordenar temas pela ordem selecionada (primeiro tema define a cor e revisões)
  const primeiroTema = temas[0];
  const temasOriginaisIds = temas.map(t => t.id);
  const temasOriginaisNomes = temas.map(t => t.nome);

  // Criar nome composto
  const nomeComposto = temasOriginaisNomes.join(' + ');

  // Criar ID único para o tema composto
  const idComposto = `composto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Criar tema composto baseado no primeiro tema
  const temaComposto: TemaEstudo = {
    id: idComposto,
    nome: nomeComposto,
    cor: primeiroTema.cor,
    semanaOriginal: primeiroTema.semanaOriginal,
    semanaAtual: primeiroTema.semanaAtual,
    estudado: primeiroTema.estudado,
    primeiraVisualizacao: primeiroTema.primeiraVisualizacao,
    apenasAula: primeiroTema.apenasAula,
    aulaERevisao: primeiroTema.aulaERevisao,
    apenasRevisao: primeiroTema.apenasRevisao,
    datasEstudos: [...primeiroTema.datasEstudos],
    revisoesTotal: primeiroTema.revisoesTotal, // Mantém revisões do primeiro tema
    revisoesConcluidas: primeiroTema.revisoesConcluidas,
    datasRevisoes: [...primeiroTema.datasRevisoes],
    questoesFeitas: 0, // Será acumulado
    questoesCorretas: 0,
    questoesErradas: 0,
    grauDificuldade: primeiroTema.grauDificuldade,
    logMigracoes: [...primeiroTema.logMigracoes],
    isComposto: true,
    temasOriginais: temasOriginaisIds
  };

  // Acumular questões de todos os temas
  temas.forEach(tema => {
    temaComposto.questoesFeitas += tema.questoesFeitas;
    temaComposto.questoesCorretas += tema.questoesCorretas;
    temaComposto.questoesErradas += tema.questoesErradas;
  });

  // Criar info do tema composto para persistência
  const infoComposto: TemaCompostoInfo = {
    id: idComposto,
    nome: nomeComposto,
    temasOriginaisIds,
    temasOriginaisNomes,
    cor: primeiroTema.cor,
    dataCriacao: new Date().toISOString()
  };

  // Atualizar cronograma: remover temas originais e adicionar tema composto
  const cronogramaAtualizado = removerTemasEAdicionarComposto(
    cronograma,
    temasOriginaisIds,
    temaComposto,
    infoComposto
  );

  return { temaComposto, cronogramaAtualizado };
}

// Remover temas originais do cronograma e adicionar tema composto
function removerTemasEAdicionarComposto(
  cronograma: CronogramaState,
  idsParaRemover: string[],
  temaComposto: TemaEstudo,
  infoComposto: TemaCompostoInfo
): CronogramaState {
  const semanasAtualizadas = cronograma.semanas.map(semana => {
    // Remover temas originais
    const temasFiltrados = semana.temas.filter(t => !idsParaRemover.includes(t.id));

    // Adicionar tema composto na semana do primeiro tema original
    if (semana.numero === temaComposto.semanaAtual) {
      return {
        ...semana,
        temas: [...temasFiltrados, temaComposto]
      };
    }

    return {
      ...semana,
      temas: temasFiltrados
    };
  });

  // Adicionar info do tema composto à lista
  const temasCompostos = cronograma.temasCompostos || [];

  return {
    ...cronograma,
    semanas: semanasAtualizadas,
    temasCompostos: [...temasCompostos, infoComposto],
    ultimaAtualizacao: new Date().toISOString()
  };
}

// Verificar se um tema pode ser adicionado a um grupo (não é composto e não está já incluído)
export function temaDisponivelParaComposicao(tema: TemaEstudo, temasJaSelecionados: TemaEstudo[]): boolean {
  // Não permitir temas compostos dentro de temas compostos
  if (tema.isComposto) {
    return false;
  }

  // Verificar se o tema já está selecionado
  const jaEstaIncluido = temasJaSelecionados.some(t => t.id === tema.id);

  return !jaEstaIncluido;
}

// Salvar temas compostos no localStorage
export function salvarTemasCompostos(temasCompostos: TemaCompostoInfo[]): void {
  try {
    localStorage.setItem('temas_compostos', JSON.stringify(temasCompostos));
  } catch (error) {
    console.error('Erro ao salvar temas compostos no localStorage:', error);
  }
}

// Carregar temas compostos do localStorage
export function carregarTemasCompostos(): TemaCompostoInfo[] {
  try {
    const data = localStorage.getItem('temas_compostos');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar temas compostos do localStorage:', error);
    return [];
  }
}

// Salvar temas compostos no Google Sheets
export async function salvarTemasCompostosNoSheets(
  sheetUrl: string,
  temasCompostos: TemaCompostoInfo[]
): Promise<boolean> {
  if (!sheetUrl) return false;

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'saveTemasCompostos');
    formData.append('data', JSON.stringify(temasCompostos));

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
      console.error('Erro ao salvar temas compostos:', result.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar temas compostos no Google Sheets:', error);
    return false;
  }
}

// Carregar temas compostos do Google Sheets
export async function carregarTemasCompostosDoSheets(
  sheetUrl: string
): Promise<TemaCompostoInfo[]> {
  if (!sheetUrl) return [];

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'getTemasCompostos');

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
      console.error('Erro ao carregar temas compostos:', result.message);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error('Erro ao carregar temas compostos do Google Sheets:', error);
    return [];
  }
}

// Decompor tema composto (separar novamente nos temas originais)
export function decomporTemaComposto(
  temaComposto: TemaEstudo,
  cronograma: CronogramaState,
  temasOriginaisDoCSV: Map<string, TemaEstudo>
): CronogramaState {
  if (!temaComposto.isComposto || !temaComposto.temasOriginais) {
    throw new Error('Tema não é composto');
  }

  // Recuperar temas originais do CSV
  const temasOriginaisRecuperados: TemaEstudo[] = [];

  temaComposto.temasOriginais.forEach(idOriginal => {
    const temaOriginal = temasOriginaisDoCSV.get(idOriginal);
    if (temaOriginal) {
      temasOriginaisRecuperados.push(temaOriginal);
    }
  });

  if (temasOriginaisRecuperados.length === 0) {
    throw new Error('Não foi possível recuperar os temas originais');
  }

  // Remover tema composto e adicionar temas originais de volta
  const semanasAtualizadas = cronograma.semanas.map(semana => {
    // Remover tema composto
    const temasSemComposto = semana.temas.filter(t => t.id !== temaComposto.id);

    // Adicionar temas originais de volta nas suas semanas originais
    const temasParaAdicionar = temasOriginaisRecuperados.filter(
      t => t.semanaOriginal === semana.numero
    );

    return {
      ...semana,
      temas: [...temasSemComposto, ...temasParaAdicionar]
    };
  });

  // Remover info do tema composto da lista
  const temasCompostos = cronograma.temasCompostos?.filter(
    tc => tc.id !== temaComposto.id
  ) || [];

  return {
    ...cronograma,
    semanas: semanasAtualizadas,
    temasCompostos,
    ultimaAtualizacao: new Date().toISOString()
  };
}
