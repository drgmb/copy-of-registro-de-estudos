// ==========================================
// PROCESSAR PROGRESSO DO CRONOGRAMA
// Calcula progresso automaticamente de DATA ENTRY e DIÁRIO
// ==========================================

import { StudySession, RegistroDiario } from '../types';
import { NOME_PARA_ID } from '../temasCentralizados';

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

// Processar DATA ENTRY e DIÁRIO para calcular progresso de cada tema
export function calcularProgressoDeRegistros(
  dataEntry: StudySession[],
  diario: RegistroDiario[]
): Map<string, ProgressoTema> {
  const progressoPorTema = new Map<string, ProgressoTema>();

  // 1. Processar DATA ENTRY (registros reais de estudo)
  dataEntry.forEach(session => {
    const idTema = NOME_PARA_ID[session.topic];
    if (!idTema) return; // Tema não encontrado no mapa

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
      const dificuldade = parseInt(session.difficulty);
      if (!isNaN(dificuldade) && dificuldade >= 1 && dificuldade <= 5) {
        if (progresso.grauDificuldade === null || dificuldade > progresso.grauDificuldade) {
          progresso.grauDificuldade = dificuldade;
        }
      }
    }
  });

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
  progressoPorTema.forEach((progresso, idTema) => {
    if (progresso.datasEstudos.length === 0) return;

    // Pegar semana original do tema
    const { TEMAS_POR_ID } = require('../temasCentralizados');
    const temaBase = TEMAS_POR_ID[idTema];
    if (!temaBase) return;

    const semanaOriginal = temaBase.semanaOriginal;

    // Calcular qual semana cada data de estudo cai
    // Assumindo que semana 1 começa hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let semanaMaisRecente = semanaOriginal;

    progresso.datasEstudos.forEach(dataISO => {
      const dataEstudo = new Date(dataISO);
      dataEstudo.setHours(0, 0, 0, 0);

      // Calcular diferença em dias
      const diffDias = Math.floor((dataEstudo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular em qual semana a data cai (cada semana = 7 dias)
      const semanaData = Math.floor(diffDias / 7) + 1;

      // Se a data está numa semana válida (1-30)
      if (semanaData >= 1 && semanaData <= 30) {
        // Usar a semana mais recente
        if (semanaData > semanaMaisRecente) {
          semanaMaisRecente = semanaData;
        }
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
