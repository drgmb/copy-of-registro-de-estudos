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
