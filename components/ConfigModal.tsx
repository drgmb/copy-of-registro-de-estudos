import React, { useState } from 'react';
import { X, Save, HelpCircle, Copy, Check, AlertTriangle, Settings } from 'lucide-react';
import { GOOGLE_SCRIPT_TUTORIAL_URL } from '../constants';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
  const [url, setUrl] = useState(currentUrl);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(url);
    onClose();
  };

  // Google Apps Script Code
  const scriptCode = `// ==========================================
// SISTEMA DE REVISÕES ESPAÇADAS - VERSÃO COMPLETA
// Implementa todas as especificações do prompt
// ==========================================

// ==========================================
// CONFIGURAÇÃO DE INTERVALOS E CORES
// ==========================================
const RELEVANCIA = {
  'Verde':    { intervalos: [14, 28, 56, 120] },
  'Amarelo':  { intervalos: [14, 28, 56, 120] },
  'Roxo':     { intervalos: [14, 28, 56, 120] },
  'Vermelho': { intervalos: [7, 28, 48] }
};
const DEFAULT_COLOR = 'Amarelo';
const LIMIT_PER_DAY = 20; // Máximo de revisões por dia
const DEADLINE_DATE = new Date(new Date().getFullYear(), 9, 15); // 15 de Outubro
const MIN_INTERVAL = 14; // Intervalo mínimo entre revisões

// ==========================================
// SISTEMA DE LOG DE MUDANÇAS
// ==========================================
let changeLog = [];

// ==========================================
// FUNÇÃO CORS - doGet (Aceita requisições OPTIONS e GET requests)
// ==========================================
function doGet(e) {
  const action = e.parameter.action || '';

  if (action === 'getDiaryData') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const diaryData = getDiaryDataForToday(ss);

      return ContentService.createTextOutput(JSON.stringify({
        'status': 'success',
        'data': diaryData
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'message': err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 'status': 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// OBTER DADOS DO DIÁRIO PARA VISUALIZAÇÃO
// ==========================================
function getDiaryDataForToday(ss) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  if (!diarySheet) {
    return { error: 'Aba DIÁRIO não encontrada' };
  }

  const diaryData = diarySheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  let todayReviews = [];
  let completedToday = [];
  let completedThisMonth = 0;
  let totalCompleted = 0;
  let upcomingReviews = [];
  let overdueReviews = [];
  let allReviews = [];

  // Processar dados (pular cabeçalho)
  for (let i = 1; i < diaryData.length; i++) {
    const row = diaryData[i];
    const id = row[0];
    const tema = row[1];
    const acao = row[2];
    const dataAgendada = new Date(row[3]);
    const status = row[4];

    if (!status) continue; // Ignorar revisões desativadas

    dataAgendada.setHours(0, 0, 0, 0);

    const reviewObj = {
      id: id,
      tema: tema,
      acao: acao,
      dataAgendada: formatDate(dataAgendada),
      status: status,
      isToday: dataAgendada.getTime() === today.getTime(),
      isOverdue: dataAgendada < today,
      isUpcoming: dataAgendada > today,
      daysDiff: Math.floor((dataAgendada - today) / (1000 * 60 * 60 * 24))
    };

    allReviews.push(reviewObj);

    // Revisões de hoje
    if (reviewObj.isToday) {
      todayReviews.push(reviewObj);

      // Verificar se já foi completada (buscar em DATA ENTRY)
      const isCompleted = checkIfCompleted(ss, tema, today);
      if (isCompleted) {
        completedToday.push(reviewObj);
      }
    }

    // Revisões atrasadas
    if (reviewObj.isOverdue && acao === "Revisão") {
      overdueReviews.push(reviewObj);
    }

    // Próximas revisões (próximos 7 dias)
    if (reviewObj.isUpcoming && reviewObj.daysDiff <= 7) {
      upcomingReviews.push(reviewObj);
    }

    // Contar completadas no mês
    if (acao !== "Primeiro Contato") {
      const reviewMonth = dataAgendada.getMonth();
      const reviewYear = dataAgendada.getFullYear();

      if (reviewMonth === thisMonth && reviewYear === thisYear && dataAgendada <= today) {
        completedThisMonth++;
      }

      // Total de revisões completadas (passadas)
      if (dataAgendada <= today) {
        totalCompleted++;
      }
    }
  }

  // Ordenar revisões
  upcomingReviews.sort((a, b) => a.daysDiff - b.daysDiff);
  overdueReviews.sort((a, b) => a.daysDiff - b.daysDiff);

  return {
    today: {
      date: formatDate(today),
      reviews: todayReviews,
      completed: completedToday,
      total: todayReviews.length,
      completedCount: completedToday.length,
      pendingCount: todayReviews.length - completedToday.length
    },
    statistics: {
      completedToday: completedToday.length,
      completedThisMonth: completedThisMonth,
      totalCompleted: totalCompleted,
      overdueCount: overdueReviews.length,
      upcomingCount: upcomingReviews.length
    },
    overdue: overdueReviews.slice(0, 10), // Limitar a 10
    upcoming: upcomingReviews.slice(0, 10), // Limitar a 10
    allActiveReviews: allReviews.filter(r => r.acao === "Revisão").length
  };
}

// Verificar se uma revisão foi completada
function checkIfCompleted(ss, tema, date) {
  const entrySheet = ss.getSheetByName("DATA ENTRY");
  if (!entrySheet) return false;

  const entryData = entrySheet.getDataRange().getValues();
  const dateStr = formatDate(date);

  for (let i = 1; i < entryData.length; i++) {
    const entryTema = entryData[i][1];
    const entryDetails = entryData[i][2];
    const entryDate = entryData[i][8];

    if (entryTema === tema && entryDetails === "Revisão" && entryDate === dateStr) {
      return true;
    }
  }

  return false;
}

// ==========================================
// FUNÇÃO PRINCIPAL - doPost
// ==========================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);

    const type = e.parameter.type || 'study';

    if (type === 'simulado') {
      // Processar dados de simulado
      const simuladoData = {
        id: e.parameter.id || '',
        description: e.parameter.description || '',
        totalQuestionsGeneral: parseInt(e.parameter.totalQuestionsGeneral) || 0,
        clinicaQuestions: parseInt(e.parameter.clinicaQuestions) || 0,
        clinicaCorrect: parseInt(e.parameter.clinicaCorrect) || 0,
        cirurgiaQuestions: parseInt(e.parameter.cirurgiaQuestions) || 0,
        cirurgiaCorrect: parseInt(e.parameter.cirurgiaCorrect) || 0,
        preventivaQuestions: parseInt(e.parameter.preventivaQuestions) || 0,
        preventivaCorrect: parseInt(e.parameter.preventivaCorrect) || 0,
        pediatriaQuestions: parseInt(e.parameter.pediatriaQuestions) || 0,
        pediatriaCorrect: parseInt(e.parameter.pediatriaCorrect) || 0,
        ginecologiaQuestions: parseInt(e.parameter.ginecologiaQuestions) || 0,
        ginecologiaCorrect: parseInt(e.parameter.ginecologiaCorrect) || 0,
        date: e.parameter.date || ''
      };

      const simuladosSheet = ss.getSheetByName("SIMULADOS");
      simuladosSheet.appendRow([
        simuladoData.id,
        simuladoData.description,
        simuladoData.totalQuestionsGeneral,
        simuladoData.clinicaQuestions,
        simuladoData.clinicaCorrect,
        simuladoData.cirurgiaQuestions,
        simuladoData.cirurgiaCorrect,
        simuladoData.preventivaQuestions,
        simuladoData.preventivaCorrect,
        simuladoData.pediatriaQuestions,
        simuladoData.pediatriaCorrect,
        simuladoData.ginecologiaQuestions,
        simuladoData.ginecologiaCorrect,
        new Date() // Timestamp
      ]);

      return ContentService.createTextOutput(JSON.stringify({ 'status': 'success' }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      // Processar dados de estudo (original)
      changeLog = []; // Inicializar log de mudanças

      const data = {
        topicId: e.parameter.topicId || '',
        topic: e.parameter.topic || '',
        details: e.parameter.details || '',
        difficulty: e.parameter.difficulty || '',
        isClass: e.parameter.isClass === 'true',
        isQuestions: e.parameter.isQuestions === 'true',
        totalQuestions: parseInt(e.parameter.totalQuestions) || 0,
        correctQuestions: parseInt(e.parameter.correctQuestions) || 0,
        date: e.parameter.date || ''
      };

      // VALIDAR DUPLICATA ANTES DE SALVAR
      if (isDuplicateFirstEntry(ss, data)) {
        return ContentService.createTextOutput(JSON.stringify({
          'status': 'error',
          'code': 'DUPLICATE_FIRST_ENTRY',
          'message': 'Este tema já possui uma "Primeira Entrada". Para registrar novamente, selecione "Revisão" nos detalhes.'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const entrySheet = ss.getSheetByName("DATA ENTRY");

      // 1. REGISTRAR NO DATA ENTRY
      entrySheet.appendRow([
        data.topicId,
        data.topic,
        data.details,
        data.difficulty,
        data.isClass,
        data.isQuestions,
        data.totalQuestions,
        data.correctQuestions,
        data.date,
        new Date() // Timestamp
      ]);

      // 2. PROCESSAR LÓGICA DE REVISÃO
      processEntry(ss, data);

      return ContentService.createTextOutput(JSON.stringify({
        'status': 'success',
        'changeLog': changeLog
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'code': 'SERVER_ERROR',
      'message': err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// CONFIGURAÇÃO DAS PLANILHAS
// ==========================================
function setupSheets(ss) {
  if (!ss.getSheetByName("DATA ENTRY")) {
    ss.insertSheet("DATA ENTRY").appendRow(["ID", "TEMA", "DETALHES", "DIFICULDADE", "AULA", "QUESTOES", "TOTAL", "ACERTOS", "DATA_REF", "TIMESTAMP"]);
  }
  if (!ss.getSheetByName("DIÁRIO")) {
    ss.insertSheet("DIÁRIO").appendRow(["ID", "TEMA", "ACAO", "DATA_AGENDADA", "STATUS"]);
  }
  if (!ss.getSheetByName("TEMAS")) {
    const sheet = ss.insertSheet("TEMAS");
    sheet.appendRow(["ID", "TEMA", "COR"]);
    sheet.appendRow(["ExemploID", "ExemploTema", "Vermelho"]);
  }
  if (!ss.getSheetByName("SIMULADOS")) {
    ss.insertSheet("SIMULADOS").appendRow([
      "ID",
      "DESCRIÇÃO",
      "TOTAL_GERAL",
      "CLINICA_QUESTOES",
      "CLINICA_ACERTOS",
      "CIRURGIA_QUESTOES",
      "CIRURGIA_ACERTOS",
      "PREVENTIVA_QUESTOES",
      "PREVENTIVA_ACERTOS",
      "PEDIATRIA_QUESTOES",
      "PEDIATRIA_ACERTOS",
      "GINECO_QUESTOES",
      "GINECO_ACERTOS",
      "TIMESTAMP"
    ]);
  }
}

// ==========================================
// IDENTIFICAÇÃO DE TIPO DE ENTRADA
// ==========================================
function isFirstEntry(ss, topicId, topicName) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  for (let i = 1; i < diaryData.length; i++) {
    if ((topicId && diaryData[i][0] == topicId) || diaryData[i][1] == topicName) {
      return false;
    }
  }
  return true;
}

function countCompletedReviews(ss, data) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Revisão" && diaryData[i][4] === true) {
        count++;
      }
    }
  }
  return count;
}

function isDuplicateFirstEntry(ss, data) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  // Se não é "Primeiro Contato", permitir
  if (data.details !== "Primeiro Contato") {
    return false;
  }

  // Buscar se tema já existe no DIÁRIO
  for (let i = 1; i < diaryData.length; i++) {
    const matchesId = data.topicId && diaryData[i][0] == data.topicId;
    const matchesName = diaryData[i][1] == data.topic;

    if (matchesId || matchesName) {
      return true; // Tema já registrado - É DUPLICATA
    }
  }

  return false; // Não é duplicata
}

// ==========================================
// AJUSTE DE INTERVALOS POR PERCENTUAL
// ==========================================
function calculateAdjustedIntervals(baseIntervals, percentage) {
  if (percentage === null || baseIntervals.length < 3) {
    return baseIntervals;
  }

  const intervals = [...baseIntervals];

  if (percentage < 50) {
    // Fórmula: x = (Rev3 - Rev2), y = x × 0.7
    const x = intervals[2] - intervals[1];
    const y = Math.floor(x * 0.7);
    intervals[1] = intervals[0] + y;

    const newX = intervals[2] - intervals[1];
    intervals[2] = intervals[1] + Math.ceil(newX * 0.7);

    if (intervals.length > 3) {
      intervals[3] = Math.ceil(intervals[2] * 2.14);
    }
  } else if (percentage >= 70) {
    // Fórmula: x = (Rev3 - Rev2), y = x × 1.5
    const x = intervals[2] - intervals[1];
    const y = Math.ceil(x * 1.5);
    intervals[1] = intervals[0] + y;

    const newX = intervals[2] - intervals[1];
    intervals[2] = intervals[1] + Math.ceil(newX * 1.5);

    if (intervals.length > 3) {
      intervals[3] = Math.ceil(intervals[2] * 2.14);
    }
  }

  return intervals;
}

// ==========================================
// CARREGAMENTO DE CONTAGEM DE DATAS
// ==========================================
function loadDateCounts(ss) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();
  const dateCounts = {};

  for (let i = 1; i < diaryData.length; i++) {
    if (diaryData[i][4] === true) {
      let d = diaryData[i][3];
      if (d instanceof Date) {
        let key = d.toDateString();
        dateCounts[key] = (dateCounts[key] || 0) + 1;
      }
    }
  }

  return dateCounts;
}

// ==========================================
// AGENDAMENTO DE REVISÕES
// ==========================================
function scheduleReviews(ss, data, entryDate, intervalos, dateCounts) {
  const diarySheet = ss.getSheetByName("DIÁRIO");

  intervalos.forEach((daysToAdd, index) => {
    let targetDate = new Date(entryDate);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    let originalDate = new Date(targetDate);
    let wasAdjusted = false;

    // Balanceamento de carga
    let attempts = 0;
    while (attempts < 7) {
      let key = targetDate.toDateString();
      let currentLoad = dateCounts[key] || 0;

      if (currentLoad < LIMIT_PER_DAY) {
        dateCounts[key] = currentLoad + 1;
        break;
      }
      targetDate.setDate(targetDate.getDate() + 1);
      attempts++;
      wasAdjusted = true;
    }

    if (targetDate <= DEADLINE_DATE) {
      diarySheet.appendRow([
        data.topicId,
        data.topic,
        "Revisão",
        targetDate,
        true
      ]);

      let logEntry = {
        type: 'REVIEW_SCHEDULED',
        action: 'Revisão Agendada',
        reviewNumber: index + 1,
        date: formatDate(targetDate),
        daysFromEntry: daysToAdd
      };

      if (wasAdjusted) {
        logEntry.note = 'Data ajustada por balanceamento de carga (de ' + formatDate(originalDate) + ')';
      }

      changeLog.push(logEntry);
    } else {
      changeLog.push({
        type: 'REVIEW_SKIPPED',
        action: 'Revisão Não Agendada',
        reviewNumber: index + 1,
        reason: 'Data excede o prazo limite (' + formatDate(DEADLINE_DATE) + ')',
        wouldBeDate: formatDate(targetDate)
      });
    }
  });
}

// ==========================================
// REVISÃO EXTRA (REGRA DE JULHO)
// ==========================================
function applyExtraReviewRule(ss, data, firstDate, intervalos) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const year = firstDate.getFullYear();
  const julyEnd = new Date(year, 6, 31);
  const septemberStart = new Date(year, 8, 1);

  let lastReviewDate = new Date(firstDate);
  intervalos.forEach(days => {
    lastReviewDate = new Date(firstDate);
    lastReviewDate.setDate(firstDate.getDate() + days);
  });

  if (lastReviewDate <= julyEnd) {
    const daysBetween = Math.floor((DEADLINE_DATE - septemberStart) / (1000 * 60 * 60 * 24));
    const randomDays = Math.floor(Math.random() * daysBetween);
    const extraReviewDate = new Date(septemberStart);
    extraReviewDate.setDate(extraReviewDate.getDate() + randomDays);

    diarySheet.appendRow([
      data.topicId,
      data.topic,
      "Revisão",
      extraReviewDate,
      true
    ]);

    changeLog.push({
      type: 'EXTRA_REVIEW_ADDED',
      action: 'Revisão Extra Adicionada',
      date: formatDate(extraReviewDate),
      reason: 'Regra de Julho (última revisão foi em ' + formatDate(lastReviewDate) + ')'
    });
  }
}

// ==========================================
// PROCESSAMENTO DE PRIMEIRA ENTRADA
// ==========================================
function processFirstEntry(ss, data, entryDate, intervalos) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const dateCounts = loadDateCounts(ss);

  // 1. Adicionar "Primeiro Contato"
  diarySheet.appendRow([
    data.topicId,
    data.topic,
    "Primeiro Contato",
    entryDate,
    true
  ]);

  changeLog.push({
    type: 'FIRST_CONTACT_ADDED',
    action: 'Primeiro Contato Registrado',
    date: formatDate(entryDate),
    topic: data.topic
  });

  // 2. Calcular percentual e ajustar intervalos
  let adjustedIntervals = intervalos;
  let adjustmentInfo = null;
  if (data.isQuestions && data.totalQuestions > 0) {
    const perc = (data.correctQuestions / data.totalQuestions) * 100;
    adjustedIntervals = calculateAdjustedIntervals(intervalos, perc);
    adjustmentInfo = {
      percentage: perc.toFixed(1),
      original: intervalos,
      adjusted: adjustedIntervals
    };

    if (JSON.stringify(intervalos) !== JSON.stringify(adjustedIntervals)) {
      changeLog.push({
        type: 'INTERVALS_ADJUSTED',
        action: 'Intervalos Ajustados por Desempenho',
        percentage: perc.toFixed(1) + '%',
        originalIntervals: intervalos.join(', ') + ' dias',
        adjustedIntervals: adjustedIntervals.join(', ') + ' dias'
      });
    }
  }

  // 3. Agendar revisões
  scheduleReviews(ss, data, entryDate, adjustedIntervals, dateCounts);

  // 4. Aplicar regra de revisão extra
  applyExtraReviewRule(ss, data, entryDate, adjustedIntervals);
}

// Função auxiliar para formatar data
function formatDate(date) {
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

// ==========================================
// AJUSTE DE REVISÕES FUTURAS (z dias)
// ==========================================
function adjustFutureReviews(ss, data, zDays) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();
  let adjustedCount = 0;

  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Revisão" && diaryData[i][4] === true) {
        const currentDate = new Date(diaryData[i][3]);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + zDays);

        const range = diarySheet.getRange(i + 1, 4);
        range.setValue(newDate);

        changeLog.push({
          type: 'REVIEW_DATE_ADJUSTED',
          action: 'Data de Revisão Ajustada',
          oldDate: formatDate(currentDate),
          newDate: formatDate(newDate),
          adjustment: (zDays > 0 ? '+' : '') + zDays + ' dia(s)'
        });

        adjustedCount++;
      }
    }
  }

  if (adjustedCount > 0) {
    changeLog.push({
      type: 'FUTURE_REVIEWS_ADJUSTED',
      action: 'Revisões Futuras Ajustadas',
      count: adjustedCount,
      adjustment: (zDays > 0 ? '+' : '') + zDays + ' dia(s)',
      reason: 'Compensação por diferença na data de conclusão'
    });
  }
}

// ==========================================
// RECALCULAR REVISÕES REMANESCENTES
// ==========================================
function recalculateRemainingReviews(ss, data, entryDate, perc) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  const themeSheet = ss.getSheetByName("TEMAS");
  let cor = DEFAULT_COLOR;
  const themeData = themeSheet.getDataRange().getValues();

  for (let i = 1; i < themeData.length; i++) {
    if ((data.topicId && themeData[i][0] == data.topicId) || themeData[i][1] == data.topic) {
      cor = themeData[i][2];
      break;
    }
  }

  const config = RELEVANCIA[cor] || RELEVANCIA[DEFAULT_COLOR];
  const baseIntervals = config.intervalos;
  const adjustedIntervals = calculateAdjustedIntervals(baseIntervals, perc);

  // Buscar primeira entrada
  let firstContactDate = null;
  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Primeiro Contato") {
        firstContactDate = new Date(diaryData[i][3]);
        break;
      }
    }
  }

  if (!firstContactDate) return;

  // Desativar revisões futuras antigas
  let canceledCount = 0;
  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Revisão" && diaryData[i][4] === true) {
        const revDate = new Date(diaryData[i][3]);
        if (revDate > entryDate) {
          const range = diarySheet.getRange(i + 1, 5);
          range.setValue(false);

          changeLog.push({
            type: 'REVIEW_CANCELED',
            action: 'Revisão Futura Cancelada',
            date: formatDate(revDate),
            reason: 'Recalculando com base no desempenho da 2ª revisão'
          });

          canceledCount++;
        }
      }
    }
  }

  if (canceledCount > 0) {
    changeLog.push({
      type: 'REVIEWS_RECALCULATED',
      action: 'Revisões Recalculadas',
      canceledCount: canceledCount,
      percentage: perc.toFixed(1) + '%',
      newIntervals: adjustedIntervals.slice(2).join(', ') + ' dias'
    });
  }

  // Reagendar revisões remanescentes
  const dateCounts = loadDateCounts(ss);
  const remainingIntervals = adjustedIntervals.slice(2); // Pular Rev1 e Rev2
  scheduleReviews(ss, data, firstContactDate, remainingIntervals, dateCounts);
}

// ==========================================
// PROCESSAMENTO DE REVISÃO
// ==========================================
function processReview(ss, data, entryDate) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  // 1. Buscar revisão programada mais próxima
  let scheduledDate = null;
  let rowIndex = -1;

  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Revisão" && diaryData[i][4] === true) {
        const revDate = new Date(diaryData[i][3]);
        if (!scheduledDate || Math.abs(revDate - entryDate) < Math.abs(scheduledDate - entryDate)) {
          scheduledDate = revDate;
          rowIndex = i + 1;
        }
      }
    }
  }

  // 2. Calcular diferença z = Y - X
  let z = 0;
  if (scheduledDate) {
    z = Math.floor((entryDate - scheduledDate) / (1000 * 60 * 60 * 24));

    // 3. Desativar revisão antiga
    const range = diarySheet.getRange(rowIndex, 5);
    range.setValue(false);

    let timing = 'no prazo';
    if (z > 0) timing = z + ' dia(s) atrasado';
    else if (z < 0) timing = Math.abs(z) + ' dia(s) adiantado';

    changeLog.push({
      type: 'REVIEW_COMPLETED',
      action: 'Revisão Programada Concluída',
      scheduledDate: formatDate(scheduledDate),
      completedDate: formatDate(entryDate),
      timing: timing,
      daysDifference: z
    });
  }

  // 4. Adicionar nova linha
  diarySheet.appendRow([
    data.topicId,
    data.topic,
    "Revisão",
    entryDate,
    true
  ]);

  changeLog.push({
    type: 'REVIEW_REGISTERED',
    action: 'Revisão Registrada no Diário',
    date: formatDate(entryDate)
  });

  // 5. Ajustar próximas revisões
  if (z !== 0) {
    adjustFutureReviews(ss, data, z);
  }

  // 6. Aplicar ajuste de percentual na segunda revisão
  const reviewCount = countCompletedReviews(ss, data);
  if (reviewCount === 2 && data.isQuestions && data.totalQuestions > 0) {
    const perc = (data.correctQuestions / data.totalQuestions) * 100;
    changeLog.push({
      type: 'SECOND_REVIEW_PERFORMANCE',
      action: 'Desempenho na Segunda Revisão',
      percentage: perc.toFixed(1) + '%',
      note: 'Recalculando revisões remanescentes'
    });
    recalculateRemainingReviews(ss, data, entryDate, perc);
  }
}

// ==========================================
// TRATAMENTO DE EXTRAPOLAÇÕES
// ==========================================
function handleDeadlineExtrapolations(ss, data) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  const reviews = [];
  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Revisão" && diaryData[i][4] === true) {
        reviews.push({
          index: i + 1,
          date: new Date(diaryData[i][3])
        });
      }
    }
  }

  reviews.sort((a, b) => a.date - b.date);

  // Buscar data do primeiro contato
  let firstContactDate = null;
  for (let i = 1; i < diaryData.length; i++) {
    if ((data.topicId && diaryData[i][0] == data.topicId) || diaryData[i][1] == data.topic) {
      if (diaryData[i][2] === "Primeiro Contato") {
        firstContactDate = new Date(diaryData[i][3]);
        break;
      }
    }
  }

  for (let i = reviews.length - 1; i >= 0; i--) {
    if (reviews[i].date > DEADLINE_DATE) {
      const prevDate = i > 0 ? reviews[i - 1].date : firstContactDate;
      const daysDiff = Math.floor((DEADLINE_DATE - prevDate) / (1000 * 60 * 60 * 24));
      const oldDate = new Date(reviews[i].date);

      if (daysDiff >= MIN_INTERVAL) {
        const newDate = new Date(DEADLINE_DATE);
        newDate.setDate(newDate.getDate() - MIN_INTERVAL);
        const range = diarySheet.getRange(reviews[i].index, 4);
        range.setValue(newDate);
        reviews[i].date = newDate;

        changeLog.push({
          type: 'REVIEW_MOVED_DEADLINE',
          action: 'Revisão Movida por Prazo Limite',
          oldDate: formatDate(oldDate),
          newDate: formatDate(newDate),
          reason: 'Data original excedia o prazo de ' + formatDate(DEADLINE_DATE)
        });
      } else {
        const range = diarySheet.getRange(reviews[i].index, 5);
        range.setValue(false);
        reviews.splice(i, 1);

        changeLog.push({
          type: 'REVIEW_CANCELED_DEADLINE',
          action: 'Revisão Cancelada por Prazo Limite',
          date: formatDate(oldDate),
          reason: 'Não há tempo suficiente antes do prazo (' + formatDate(DEADLINE_DATE) + ')'
        });
      }
    }
  }
}

// ==========================================
// PROCESSAMENTO PRINCIPAL
// ==========================================
function processEntry(ss, data) {
  const parts = data.date.split('/');
  const entryDate = new Date(parts[2], parts[1] - 1, parts[0]);

  const isFirst = isFirstEntry(ss, data.topicId, data.topic);

  if (isFirst) {
    const themeSheet = ss.getSheetByName("TEMAS");
    let cor = DEFAULT_COLOR;
    const themeData = themeSheet.getDataRange().getValues();

    for (let i = 1; i < themeData.length; i++) {
      if ((data.topicId && themeData[i][0] == data.topicId) || themeData[i][1] == data.topic) {
        cor = themeData[i][2];
        break;
      }
    }

    const config = RELEVANCIA[cor] || RELEVANCIA[DEFAULT_COLOR];
    const intervalos = config.intervalos;

    processFirstEntry(ss, data, entryDate, intervalos);
  } else {
    processReview(ss, data, entryDate);
  }

  handleDeadlineExtrapolations(ss, data);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <Settings className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-800">Configuração</h2>
               <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Conexão Google Sheets</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* URL Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">
              URL do Web App (Google Script)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono text-gray-600"
              />
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3" />
              Precisa da URL? Siga os passos abaixo.
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Tutorial Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Script de Instalação
              </h3>
              <button 
                onClick={handleCopy}
                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-medium
                  ${copied 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>

            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-inner border border-gray-700">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                 <span className="ml-2 text-[10px] text-gray-400 font-mono">Code.gs</span>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-60 custom-scrollbar leading-relaxed">
                {scriptCode}
              </pre>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Como instalar:
              </h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside marker:font-bold">
                <li>Crie uma nova planilha no <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-medium hover:text-blue-600">Google Sheets</a>.</li>
                <li>Vá em <strong>Extensões &gt; Apps Script</strong>.</li>
                <li>Cole o código acima no editor (substitua tudo).</li>
                <li>Clique em <strong>Implantar &gt; Nova implantação</strong>.</li>
                <li>Em "Tipo", selecione <strong>App da Web</strong>.</li>
                <li>Em "Quem pode acessar", escolha <strong>Qualquer pessoa</strong>.</li>
                <li>Copie a URL gerada e cole no campo acima.</li>
              </ol>
            </div>
            
             <div className="text-center pt-2">
              <a 
                href={GOOGLE_SCRIPT_TUTORIAL_URL} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-gray-400 hover:text-blue-600 underline transition-colors"
              >
                Ler documentação oficial do Google
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};