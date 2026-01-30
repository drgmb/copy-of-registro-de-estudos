// ==========================================
// PROCESSAR PROGRESSO DO CRONOGRAMA
// Calcula progresso automaticamente de DATA ENTRY e DIÁRIO
// ==========================================

import { StudySession, RegistroDiario } from '../types';
import { NOME_PARA_ID, TEMAS_POR_ID } from '../temasCentralizados';

export interface ProgressoTema {
  idTema: string;
  semanaAtual: number;
  estudado: boolean;
  primeiraVez: string | null;
  tipoEstudo: string;
  datasEstudos: string[];
  revisoesTotal: number;
  revisoesConcluidas: number;
  datasRevisoes: string[];
  questoesFeitas: number;
  questoesCorretas: number;
  questoesErradas: number;
  grauDificuldade: number | null;
  migracoes: string;
}

// Normalizar nome de tema para matching (remove espaços e lowercase)
function normalizarNomeTema(nome: string): string {
  return nome.replace(/\s+/g, '').toLowerCase();
}

// Criar mapa de busca normalizado para matching flexível
function criarMapaNormalizado(nomeParaId: Record<string, string>): {
  original: Record<string, string>;
  normalizado: Record<string, string>;
} {
  const normalizado: Record<string, string> = {};

  Object.entries(nomeParaId).forEach(([nome, id]) => {
    const nomeNorm = normalizarNomeTema(nome);
    normalizado[nomeNorm] = id;
  });

  return {
    original: nomeParaId,
    normalizado
  };
}

// Buscar tema com matching flexível (remove espaços)
function buscarTema(topicName: string, nomeParaId: Record<string, string>): string | null {
  // Tentativa 1: Match exato
  if (nomeParaId[topicName]) {
    return nomeParaId[topicName];
  }

  // Tentativa 2: Match normalizado (sem espaços, lowercase)
  const normalizado = normalizarNomeTema(topicName);

  for (const [nome, id] of Object.entries(nomeParaId)) {
    if (normalizarNomeTema(nome) === normalizado) {
      console.log(`  🔄 Match normalizado: "${topicName}" → "${nome}" (ID: ${id})`);
      return id;
    }
  }

  return null;
}

// Detectar se é um tema composto (contém " + ")
function isTemaComposto(topicName: string): boolean {
  return topicName.includes(' + ');
}

// Extrair nomes dos temas individuais de um tema composto
function extrairTemasDoComposto(topicName: string): string[] {
  return topicName.split(' + ').map(nome => nome.trim());
}

// Normalizar difficulty de texto para número
function normalizarDificuldade(difficulty: any): number | null {
  if (typeof difficulty === 'number' && difficulty >= 1 && difficulty <= 5) {
    return difficulty;
  }

  const diffStr = String(difficulty).toLowerCase();
  const mapa: Record<string, number> = {
    'muito fácil': 1,
    'muito facil': 1,
    'fácil': 2,
    'facil': 2,
    'médio': 3,
    'medio': 3,
    'difícil': 4,
    'dificil': 4,
    'muito difícil': 5,
    'muito dificil': 5
  };

  return mapa[diffStr] || null;
}

// Processar DATA ENTRY e DIÁRIO para calcular progresso de cada tema
export function calcularProgressoDeRegistros(
  dataEntry: StudySession[],
  diario: RegistroDiario[]
): Map<string, ProgressoTema> {
  const progressoPorTema = new Map<string, ProgressoTema>();

  console.log('🔍 [DEBUG] Processando DATA ENTRY:', dataEntry.length, 'registros');
  console.log('🔍 [DEBUG] Dados brutos do DATA ENTRY:', JSON.stringify(dataEntry, null, 2));
  console.log('🔍 [DEBUG] Processando DIÁRIO:', diario.length, 'registros');
  console.log('🔍 [DEBUG] NOME_PARA_ID disponível:', Object.keys(NOME_PARA_ID).slice(0, 10), '... (mostrando 10 de', Object.keys(NOME_PARA_ID).length, ')');

  // 1. Processar DATA ENTRY (registros reais de estudo)
  const temasNaoEncontrados: string[] = [];
  dataEntry.forEach((session, idx) => {
    console.log(`\n🔍 [DEBUG] Registro ${idx + 1}:`, {
      topic: session.topic,
      date: session.date,
      difficulty: session.difficulty,
      isClass: session.isClass
    });

    // Detectar se é tema composto (contém " + ")
    const isComposto = isTemaComposto(session.topic);

    let temasParaProcessar: string[] = [];

    if (isComposto) {
      // Extrair temas individuais
      temasParaProcessar = extrairTemasDoComposto(session.topic);
      console.log(`  📚 Tema composto detectado! Processando ${temasParaProcessar.length} temas:`, temasParaProcessar);
    } else {
      // Tema simples
      temasParaProcessar = [session.topic];
    }

    // Processar cada tema (individual ou do composto)
    temasParaProcessar.forEach((nomeTema, temaIdx) => {
      const idTema = buscarTema(nomeTema, NOME_PARA_ID);

      if (!idTema) {
        temasNaoEncontrados.push(nomeTema);
        console.warn(`⚠️ Tema não encontrado no mapa: "${nomeTema}" (registro ${idx + 1}, tema ${temaIdx + 1})`);

        // Procurar nomes similares para ajudar no debug
        const topicNorm = normalizarNomeTema(nomeTema);
        const nomesParecidos = Object.keys(NOME_PARA_ID)
          .filter(nome => {
            const nomeNorm = normalizarNomeTema(nome);
            return nomeNorm.includes(topicNorm.substring(0, Math.min(10, topicNorm.length)));
          })
          .slice(0, 5);

        if (nomesParecidos.length > 0) {
          console.log(`  💡 Nomes parecidos encontrados:`, nomesParecidos);
          console.log(`  🔍 Versão normalizada buscada: "${topicNorm}"`);
          console.log(`  🔍 Exemplos normalizados:`, nomesParecidos.map(n => normalizarNomeTema(n)));
        }

        return;
      }

      console.log(`✅ Tema encontrado: "${nomeTema}" -> ID: ${idTema}, Data: ${session.date}`);

      let progresso = progressoPorTema.get(idTema);

      if (!progresso) {
        progresso = {
          idTema,
          semanaAtual: 0, // Será definido pela semana original
          estudado: false,
          primeiraVez: null,
          tipoEstudo: '',
          datasEstudos: [],
          revisoesTotal: 0,
          revisoesConcluidas: 0,
          datasRevisoes: [],
          questoesFeitas: 0,
          questoesCorretas: 0,
          questoesErradas: 0,
          grauDificuldade: null,
          migracoes: '[]'
        };
        progressoPorTema.set(idTema, progresso);
      }

      // Marcar como estudado
      progresso.estudado = true;

      // Primeira vez
      if (!progresso.primeiraVez) {
        progresso.primeiraVez = session.date;
      } else {
        // Se a data atual é anterior, atualizar
        if (new Date(session.date) < new Date(progresso.primeiraVez)) {
          progresso.primeiraVez = session.date;
        }
      }

      // Adicionar data de estudo
      if (!progresso.datasEstudos.includes(session.date)) {
        progresso.datasEstudos.push(session.date);
      }

      // Determinar tipo de estudo
      if (session.isClass) {
        if (progresso.tipoEstudo === 'REVISAO') {
          progresso.tipoEstudo = 'AULA_E_REVISAO';
        } else if (progresso.tipoEstudo !== 'AULA_E_REVISAO') {
          progresso.tipoEstudo = 'AULA';
        }
      } else {
        if (progresso.tipoEstudo === 'AULA') {
          progresso.tipoEstudo = 'AULA_E_REVISAO';
        } else if (progresso.tipoEstudo !== 'AULA_E_REVISAO') {
          progresso.tipoEstudo = 'REVISAO';
        }

        // Se é revisão, adicionar às datas de revisões
        if (!progresso.datasRevisoes.includes(session.date)) {
          progresso.datasRevisoes.push(session.date);
          progresso.revisoesConcluidas++;
        }
      }

      // Questões
      if (session.totalQuestions > 0) {
        progresso.questoesFeitas += session.totalQuestions;
        progresso.questoesCorretas += session.correctQuestions;
        progresso.questoesErradas += (session.totalQuestions - session.correctQuestions);
      }

      // Grau de Dificuldade (pegar a maior dificuldade registrada)
      if (session.difficulty) {
        const dificuldade = normalizarDificuldade(session.difficulty);
        console.log(`  🎯 Dificuldade: "${session.difficulty}" → ${dificuldade}`);
        if (dificuldade !== null) {
          if (progresso.grauDificuldade === null || dificuldade > progresso.grauDificuldade) {
            progresso.grauDificuldade = dificuldade;
          }
        }
      }
    }); // Fecha forEach dos temas (temasParaProcessar)
  }); // Fecha forEach das sessões (dataEntry)

  // 2. Processar DIÁRIO (programações/revisões planejadas)
  diario.forEach(registro => {
    const idTema = NOME_PARA_ID[registro.tema];
    if (!idTema) return;

    let progresso = progressoPorTema.get(idTema);

    if (!progresso) {
      progresso = {
        idTema,
        semanaAtual: 0,
        estudado: false,
        primeiraVez: null,
        tipoEstudo: '',
        datasEstudos: [],
        revisoesTotal: 0,
        revisoesConcluidas: 0,
        datasRevisoes: [],
        questoesFeitas: 0,
        questoesCorretas: 0,
        questoesErradas: 0,
        grauDificuldade: null,
        migracoes: '[]'
      };
      progressoPorTema.set(idTema, progresso);
    }

    // Contar revisões programadas
    const acaoLower = registro.acao?.toLowerCase() || '';
    if (acaoLower.includes('revisao') || acaoLower.includes('revisão')) {
      progresso.revisoesTotal++;
    }
  });

  // 3. Calcular migração automática baseada nas datas de estudo
  // Importar TEMAS_POR_ID para pegar semanaOriginal
  console.log('🔍 [DEBUG] Calculando migração automática para', progressoPorTema.size, 'temas');

  progressoPorTema.forEach((progresso, idTema) => {
    if (progresso.datasEstudos.length === 0) return;

    // Pegar semana original do tema
    const temaBase = TEMAS_POR_ID[idTema];
    if (!temaBase) return;

    const semanaOriginal = temaBase.semanaOriginal;

    // Data de início do cronograma (Semana 1 começou no domingo mais recente)
    // Encontrar o domingo mais recente ou hoje se for domingo
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diaDaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const diasDesdeUltimoDomingo = diaDaSemana === 0 ? 0 : diaDaSemana;

    const inicioSemana1 = new Date(hoje);
    inicioSemana1.setDate(hoje.getDate() - diasDesdeUltimoDomingo);
    inicioSemana1.setHours(0, 0, 0, 0);

    console.log(`📅 Início da Semana 1: ${inicioSemana1.toISOString().split('T')[0]} (hoje: ${hoje.toISOString().split('T')[0]}, dia da semana: ${diaDaSemana})`);

    let semanaMaisRecente = semanaOriginal;

    progresso.datasEstudos.forEach(dataISO => {
      const dataEstudo = new Date(dataISO);
      const dataAntesZerarHoras = dataEstudo.toISOString().split('T')[0];
      dataEstudo.setHours(0, 0, 0, 0);
      const dataDepoisZerarHoras = dataEstudo.toISOString().split('T')[0];

      console.log(`  🕐 Data processamento:`, {
        original: dataISO,
        antesZerar: dataAntesZerarHoras,
        depoisZerar: dataDepoisZerarHoras,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      // Calcular diferença em dias desde o início da Semana 1
      const diffDias = Math.floor((dataEstudo.getTime() - inicioSemana1.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular em qual semana a data cai
      // Semana 1: dias 0-6 (domingo a sábado)
      // Semana 2: dias 7-13
      // etc.
      const semanaData = Math.floor(diffDias / 7) + 1;

      console.log(`  📍 Tema ID ${idTema} (${temaBase.nome}):`, {
        dataEstudo: dataISO,
        diffDias,
        semanaCalculada: semanaData,
        semanaOriginal,
        precisaMigrar: semanaData !== semanaOriginal
      });

      // Se a data está numa semana válida (1-30)
      if (semanaData >= 1 && semanaData <= 30) {
        // Migrar para a semana onde o tema foi estudado
        if (semanaData !== semanaOriginal) {
          semanaMaisRecente = semanaData;
          console.log(`  🔄 MIGRAÇÃO: Tema "${temaBase.nome}" da semana ${semanaOriginal} → ${semanaData}`);
        }
      } else {
        console.warn(`  ⚠️ Semana inválida calculada: ${semanaData} para data ${dataISO}`);
      }
    });

    // Se a semana mudou, criar log de migração
    if (semanaMaisRecente !== semanaOriginal) {
      const migracoes = progresso.migracoes ? JSON.parse(progresso.migracoes) : [];

      // Verificar se já não tem essa migração
      const jaMigrado = migracoes.some(
        (m: any) => m.de === semanaOriginal && m.para === semanaMaisRecente
      );

      if (!jaMigrado) {
        migracoes.push({
          de: semanaOriginal,
          para: semanaMaisRecente,
          data: new Date().toISOString()
        });
        progresso.migracoes = JSON.stringify(migracoes);
      }

      progresso.semanaAtual = semanaMaisRecente;
    } else {
      progresso.semanaAtual = semanaOriginal;
    }
  });

  // Resumo final
  console.log('📊 [RESUMO] Processamento concluído:', {
    temasComProgresso: progressoPorTema.size,
    temasNaoEncontrados: temasNaoEncontrados.length > 0 ? temasNaoEncontrados : 'Nenhum'
  });

  if (temasNaoEncontrados.length > 0) {
    console.warn('⚠️ Temas não encontrados no mapeamento:', temasNaoEncontrados);
  }

  return progressoPorTema;
}

// Mesclar progresso calculado com progresso salvo (para migrações manuais)
export function mesclarProgressos(
  progressoCalculado: Map<string, ProgressoTema>,
  progressoSalvo: any[]
): Map<string, ProgressoTema> {
  const resultado = new Map(progressoCalculado);

  // Adicionar informações de progresso salvo (migrações, semanaAtual, etc)
  progressoSalvo.forEach(salvo => {
    const calculado = resultado.get(salvo.idTema);

    if (calculado) {
      // Usar semanaAtual salva se existir (permitindo migrações manuais)
      if (salvo.semanaAtual) {
        calculado.semanaAtual = salvo.semanaAtual;
      }

      // Usar migrações salvas
      if (salvo.migracoes) {
        calculado.migracoes = salvo.migracoes;
      }

      // Usar grau de dificuldade salvo (avaliação manual)
      if (salvo.grauDificuldade) {
        calculado.grauDificuldade = salvo.grauDificuldade;
      }
    } else {
      // Tema não tem registros mas tem dados salvos (migrações, etc)
      resultado.set(salvo.idTema, salvo);
    }
  });

  return resultado;
}
