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
// FUNÇÃO doGet - Para requisições GET (Dashboard e Diary)
// ==========================================
function doGet(e) {
  const action = e.parameter.action || '';

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'getDiaryData') {
      return ContentService.createTextOutput(JSON.stringify(getDiaryData(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getDashboardData') {
      return ContentService.createTextOutput(JSON.stringify(getDashboardData(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getCronograma') {
      return ContentService.createTextOutput(JSON.stringify(getCronograma(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getMetricas') {
      const periodo = e.parameter.periodo || 'semana';
      return ContentService.createTextOutput(JSON.stringify(getMetricas(ss, periodo)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getListaMestraTemas') {
      return ContentService.createTextOutput(JSON.stringify(getListaMestraTemas(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getCronogramaCompleto') {
      return ContentService.createTextOutput(JSON.stringify(getCronogramaCompleto(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getDiario') {
      return ContentService.createTextOutput(JSON.stringify(getDiario(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAllStudySessions') {
      return ContentService.createTextOutput(JSON.stringify(getAllStudySessions(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'status': 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL - doPost
// ==========================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Setup sheets com tratamento de erro
    try {
      setupSheets(ss);
    } catch (setupError) {
      Logger.log('Erro no setupSheets: ' + setupError.toString());
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'code': 'SETUP_ERROR',
        'message': 'Erro ao configurar planilhas: ' + setupError.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = e.parameter.action || '';
    const type = e.parameter.type || 'study';

    // Handlers para cronograma
    if (action === 'saveCronograma') {
      const dataStr = e.parameter.data || '';
      return ContentService.createTextOutput(JSON.stringify(saveCronograma(ss, dataStr)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getCronogramaCompleto') {
      return ContentService.createTextOutput(JSON.stringify(getCronogramaCompleto(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handlers para aba HOJE
    if (action === 'getDiario') {
      return ContentService.createTextOutput(JSON.stringify(getDiario(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAllStudySessions') {
      return ContentService.createTextOutput(JSON.stringify(getAllStudySessions(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

  // Nota: A aba HOJE não é mais criada automaticamente.
  // Se precisar da aba HOJE na planilha, chame setupHojeSheet() manualmente.
}

// ==========================================
// CONFIGURAÇÃO DA ABA HOJE - DESIGN MODERNO
// ==========================================
function setupHojeSheet(ss) {
  let hojeSheet = ss.getSheetByName("HOJE");

  if (!hojeSheet) {
    hojeSheet = ss.insertSheet("HOJE");
  } else {
    hojeSheet.clear();
  }

  // Configurar largura das colunas (layout mais amplo e moderno)
  hojeSheet.setColumnWidth(1, 60);   // A - Status/Checkbox
  hojeSheet.setColumnWidth(2, 350);  // B - Tema (mais espaço)
  hojeSheet.setColumnWidth(3, 100);  // C - Ação
  hojeSheet.setColumnWidth(4, 110);  // D - Data
  hojeSheet.setColumnWidth(5, 140);  // E - Informação extra
  hojeSheet.setColumnWidth(6, 100);  // F - Progress

  // Ocultar linhas de grade para visual mais limpo
  hojeSheet.setHiddenGridlines(true);

  // === CABEÇALHO HERO ===
  hojeSheet.getRange("A1:F2").merge();
  const hoje = new Date();
  const diaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][hoje.getDay()];
  hojeSheet.getRange("A1").setValue("DASHBOARD DE REVISÕES\n" + diaSemana + ", " + formatDate(hoje));
  hojeSheet.getRange("A1").setFontSize(18).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.getRange("A1").setBackground("#1a73e8").setFontColor("#FFFFFF");
  hojeSheet.getRange("A1").setWrap(true);
  hojeSheet.setRowHeight(1, 60);
  hojeSheet.setRowHeight(2, 0); // Hide merged row

  // === CARDS DE ESTATÍSTICAS (Dashboard Style) ===
  let currentRow = 3;

  // Espaçamento
  hojeSheet.setRowHeight(currentRow, 15);
  currentRow++;

  // Card 1: HOJE (simplificado)
  hojeSheet.getRange(currentRow, 1, 3, 3).merge();
  hojeSheet.getRange(currentRow, 1).setValue("HOJE");
  hojeSheet.getRange(currentRow, 1).setBackground("#e3f2fd").setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 1).setWrap(true).setFontSize(12);
  hojeSheet.getRange(currentRow, 1, 3, 3).setBorder(true, true, true, true, false, false, "#1976d2", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Adicionar valores abaixo do título
  hojeSheet.getRange(currentRow + 1, 1).setFormula("=COUNTIFS(DIÁRIO!D:D,TODAY(),DIÁRIO!E:E,TRUE)");
  hojeSheet.getRange(currentRow + 1, 1).setFontSize(24).setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow + 2, 1).setValue("revisões hoje");
  hojeSheet.getRange(currentRow + 2, 1).setFontSize(9).setHorizontalAlignment("center");

  // Card 2: ESTE MÊS (simplificado)
  hojeSheet.getRange(currentRow, 4, 3, 3).merge();
  hojeSheet.getRange(currentRow, 4).setValue("ESTE MÊS");
  hojeSheet.getRange(currentRow, 4).setBackground("#e8f5e9").setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 4).setWrap(true).setFontSize(12);
  hojeSheet.getRange(currentRow, 4, 3, 3).setBorder(true, true, true, true, false, false, "#388e3c", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Adicionar valores abaixo do título
  const mesFormula = "=COUNTIFS('DATA ENTRY'!C:C,'Revisão','DATA ENTRY'!I:I,'>='&TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),'dd/MM/yyyy'),'DATA ENTRY'!I:I,'<='&TEXT(EOMONTH(TODAY(),0),'dd/MM/yyyy'))";
  hojeSheet.getRange(currentRow + 1, 4).setFormula(mesFormula);
  hojeSheet.getRange(currentRow + 1, 4).setFontSize(24).setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow + 2, 4).setValue("revisões este mês");
  hojeSheet.getRange(currentRow + 2, 4).setFontSize(9).setHorizontalAlignment("center");

  hojeSheet.setRowHeight(currentRow, 30);
  hojeSheet.setRowHeight(currentRow + 1, 30);
  hojeSheet.setRowHeight(currentRow + 2, 30);
  currentRow += 3;

  // Espaçamento
  hojeSheet.setRowHeight(currentRow, 10);
  currentRow++;

  // Card 3: ATRASADAS (simplificado)
  hojeSheet.getRange(currentRow, 1, 3, 3).merge();
  hojeSheet.getRange(currentRow, 1).setValue("ATRASADAS");
  hojeSheet.getRange(currentRow, 1).setBackground("#ffebee").setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 1).setWrap(true).setFontSize(12);
  hojeSheet.getRange(currentRow, 1, 3, 3).setBorder(true, true, true, true, false, false, "#d32f2f", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Adicionar valores abaixo do título
  hojeSheet.getRange(currentRow + 1, 1).setFormula("=COUNTIFS(DIÁRIO!D:D,\\"<\\"&TODAY(),DIÁRIO!E:E,TRUE,DIÁRIO!C:C,\\"Revisão\\")");
  hojeSheet.getRange(currentRow + 1, 1).setFontSize(24).setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow + 2, 1).setValue("revisões atrasadas");
  hojeSheet.getRange(currentRow + 2, 1).setFontSize(9).setHorizontalAlignment("center");

  // Card 4: PRÓXIMOS 7 DIAS (simplificado)
  hojeSheet.getRange(currentRow, 4, 3, 3).merge();
  hojeSheet.getRange(currentRow, 4).setValue("PRÓXIMOS 7 DIAS");
  hojeSheet.getRange(currentRow, 4).setBackground("#fff3e0").setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 4).setWrap(true).setFontSize(12);
  hojeSheet.getRange(currentRow, 4, 3, 3).setBorder(true, true, true, true, false, false, "#f57c00", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Adicionar valores abaixo do título
  hojeSheet.getRange(currentRow + 1, 4).setFormula("=COUNTIFS(DIÁRIO!D:D,\\">\\"&TODAY(),DIÁRIO!D:D,\\"<=\\"&TODAY()+7,DIÁRIO!E:E,TRUE)");
  hojeSheet.getRange(currentRow + 1, 4).setFontSize(24).setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow + 2, 4).setValue("revisões próximas");
  hojeSheet.getRange(currentRow + 2, 4).setFontSize(9).setHorizontalAlignment("center");

  hojeSheet.setRowHeight(currentRow, 30);
  hojeSheet.setRowHeight(currentRow + 1, 30);
  hojeSheet.setRowHeight(currentRow + 2, 30);
  currentRow += 3;

  // Espaçamento
  hojeSheet.setRowHeight(currentRow, 20);
  currentRow++;

  // === REVISÕES DE HOJE (Com ajuste dinâmico) ===
  const todayHeaderRow = currentRow;
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setValue("✅ REVISÕES DE HOJE");
  hojeSheet.getRange(currentRow, 1).setBackground("#1976d2").setFontColor("#FFFFFF").setFontWeight("bold");
  hojeSheet.getRange(currentRow, 1).setFontSize(14).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.setRowHeight(currentRow, 40);
  currentRow++;

  // Mensagem condicional quando não há revisões
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setFormula('=IF(COUNTIFS(DIÁRIO!D:D,TODAY(),DIÁRIO!E:E,TRUE)=0,"Nenhuma revisão programada para hoje! Aproveite o dia livre ou estude algo novo.","")');
  hojeSheet.getRange(currentRow, 1).setBackground("#f1f3f4").setFontColor("#5f6368").setFontStyle("italic");
  hojeSheet.getRange(currentRow, 1).setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  hojeSheet.setRowHeight(currentRow, 50);
  currentRow++;

  // Cabeçalhos da tabela
  const headers = ["✓", "TEMA", "TIPO", "DATA", "CONCLUÍDA EM", "STATUS"];
  hojeSheet.getRange(currentRow, 1, 1, 6).setValues([headers]);
  hojeSheet.getRange(currentRow, 1, 1, 6).setBackground("#bbdefb").setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 1, 1, 6).setBorder(true, true, true, true, false, false, "#1976d2", SpreadsheetApp.BorderStyle.SOLID);
  hojeSheet.setRowHeight(currentRow, 35);
  currentRow++;

  // Adicionar linhas de revisões com formatação condicional
  const todayStartRow = currentRow;
  for (let i = 0; i < 15; i++) {
    const row = currentRow + i;

    // Checkbox
    hojeSheet.getRange(row, 1).insertCheckboxes();
    hojeSheet.getRange(row, 1).setBackground("#ffffff").setHorizontalAlignment("center");

    // Tema
    hojeSheet.getRange(row, 2).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!B:B,(DIÁRIO!D:D=TODAY())*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 2).setBackground("#ffffff").setFontWeight("bold");

    // Tipo
    hojeSheet.getRange(row, 3).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!C:C,(DIÁRIO!D:D=TODAY())*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 3).setBackground("#f8f9fa").setHorizontalAlignment("center").setFontSize(9);

    // Data
    hojeSheet.getRange(row, 4).setFormula("=IFERROR(TEXT(INDEX(FILTER(DIÁRIO!D:D,(DIÁRIO!D:D=TODAY())*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'dd/MM/yyyy'),'')");
    hojeSheet.getRange(row, 4).setBackground("#ffffff").setHorizontalAlignment("center");

    // Concluída em
    hojeSheet.getRange(row, 5).setFormula("=IFERROR(IF(B" + row + "='','',IF(COUNTIFS('DATA ENTRY'!B:B,B" + row + ",'DATA ENTRY'!C:C,'Revisão','DATA ENTRY'!I:I,TEXT(TODAY(),'dd/MM/yyyy'))>0,TEXT(TODAY(),'dd/MM/yyyy'),'—')),'')");
    hojeSheet.getRange(row, 5).setBackground("#f8f9fa").setHorizontalAlignment("center");

    // Status com ícones
    hojeSheet.getRange(row, 6).setFormula("=IF(B" + row + "='','',IF(E" + row + "<>'','✅','⏳'))");
    hojeSheet.getRange(row, 6).setBackground("#ffffff").setHorizontalAlignment("center").setFontSize(16);

    // Formatação condicional: linhas alternadas
    if (i % 2 === 0) {
      hojeSheet.getRange(row, 1, 1, 6).setBackground("#fafafa");
    }

    hojeSheet.setRowHeight(row, 32);
  }
  currentRow += 15;

  // Espaçamento
  hojeSheet.setRowHeight(currentRow, 20);
  currentRow++;

  // === REVISÕES ATRASADAS ===
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setValue("⚠️ REVISÕES ATRASADAS");
  hojeSheet.getRange(currentRow, 1).setBackground("#c62828").setFontColor("#FFFFFF").setFontWeight("bold");
  hojeSheet.getRange(currentRow, 1).setFontSize(14).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.setRowHeight(currentRow, 40);
  currentRow++;

  // Mensagem quando não há revisões atrasadas
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setFormula("=IF(COUNTIFS(DIÁRIO!D:D,\\"<\\"&TODAY(),DIÁRIO!E:E,TRUE,DIÁRIO!C:C,\\"Revisão\\")=0,\\"Parabéns! Nenhuma revisão atrasada.\\",\\"\\")");
  hojeSheet.getRange(currentRow, 1).setBackground("#e8f5e9").setFontColor("#2e7d32").setFontStyle("italic");
  hojeSheet.getRange(currentRow, 1).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.setRowHeight(currentRow, 40);
  currentRow++;

  // Cabeçalhos
  hojeSheet.getRange(currentRow, 1, 1, 6).setValues([["❌", "TEMA", "TIPO", "DEVERIA SER", "DIAS ATRASADA", "STATUS"]]);
  hojeSheet.getRange(currentRow, 1, 1, 6).setBackground("#ffcdd2").setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 1, 1, 6).setBorder(true, true, true, true, false, false, "#c62828", SpreadsheetApp.BorderStyle.SOLID);
  hojeSheet.setRowHeight(currentRow, 35);
  currentRow++;

  // Linhas de revisões atrasadas
  for (let i = 0; i < 10; i++) {
    const row = currentRow + i;

    hojeSheet.getRange(row, 1).setValue("⚠️").setHorizontalAlignment("center").setFontSize(14);
    hojeSheet.getRange(row, 2).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!B:B,(DIÁRIO!D:D<TODAY())*(DIÁRIO!E:E=TRUE)*(DIÁRIO!C:C='Revisão'))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 2).setFontWeight("bold");
    hojeSheet.getRange(row, 3).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!C:C,(DIÁRIO!D:D<TODAY())*(DIÁRIO!E:E=TRUE)*(DIÁRIO!C:C='Revisão'))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 3).setHorizontalAlignment("center").setFontSize(9);
    hojeSheet.getRange(row, 4).setFormula("=IFERROR(TEXT(INDEX(FILTER(DIÁRIO!D:D,(DIÁRIO!D:D<TODAY())*(DIÁRIO!E:E=TRUE)*(DIÁRIO!C:C='Revisão'))," + (i+1) + "),'dd/MM/yyyy'),'')");
    hojeSheet.getRange(row, 4).setHorizontalAlignment("center");
    hojeSheet.getRange(row, 5).setFormula("=IF(B" + row + "='','',TEXT(TODAY()-DATEVALUE(D" + row + "),'0')&' dias')");
    hojeSheet.getRange(row, 5).setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#c62828");
    hojeSheet.getRange(row, 6).setFormula("=IF(B" + row + "='','',IF(COUNTIFS('DATA ENTRY'!B:B,B" + row + ",'DATA ENTRY'!C:C,'Revisão','DATA ENTRY'!I:I,TEXT(TODAY(),'dd/MM/yyyy'))>0,'✅','❌'))");
    hojeSheet.getRange(row, 6).setHorizontalAlignment("center").setFontSize(16);

    // Fundo alternado
    hojeSheet.getRange(row, 1, 1, 6).setBackground(i % 2 === 0 ? "#ffebee" : "#ffcdd2");
    hojeSheet.setRowHeight(row, 32);
  }
  currentRow += 10;

  // Espaçamento
  hojeSheet.setRowHeight(currentRow, 20);
  currentRow++;

  // === PRÓXIMAS REVISÕES (7 DIAS) ===
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setValue("📆 PRÓXIMAS REVISÕES (7 DIAS)");
  hojeSheet.getRange(currentRow, 1).setBackground("#f57c00").setFontColor("#FFFFFF").setFontWeight("bold");
  hojeSheet.getRange(currentRow, 1).setFontSize(14).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.setRowHeight(currentRow, 40);
  currentRow++;

  // Mensagem quando não há próximas revisões
  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setFormula("=IF(COUNTIFS(DIÁRIO!D:D,\\">\\"&TODAY(),DIÁRIO!D:D,\\"<=\\"&TODAY()+7,DIÁRIO!E:E,TRUE)=0,\\"Nenhuma revisão programada para os próximos 7 dias.\\",\\"\\")");
  hojeSheet.getRange(currentRow, 1).setBackground("#fff3e0").setFontColor("#e65100").setFontStyle("italic");
  hojeSheet.getRange(currentRow, 1).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hojeSheet.setRowHeight(currentRow, 40);
  currentRow++;

  // Cabeçalhos
  hojeSheet.getRange(currentRow, 1, 1, 6).setValues([["📌", "TEMA", "TIPO", "DATA AGENDADA", "FALTAM", "PRIORIDADE"]]);
  hojeSheet.getRange(currentRow, 1, 1, 6).setBackground("#ffe0b2").setFontWeight("bold").setHorizontalAlignment("center");
  hojeSheet.getRange(currentRow, 1, 1, 6).setBorder(true, true, true, true, false, false, "#f57c00", SpreadsheetApp.BorderStyle.SOLID);
  hojeSheet.setRowHeight(currentRow, 35);
  currentRow++;

  // Linhas de próximas revisões
  for (let i = 0; i < 10; i++) {
    const row = currentRow + i;

    hojeSheet.getRange(row, 1).setValue("📌").setHorizontalAlignment("center").setFontSize(14);
    hojeSheet.getRange(row, 2).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!B:B,(DIÁRIO!D:D>TODAY())*(DIÁRIO!D:D<=TODAY()+7)*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 2).setFontWeight("bold");
    hojeSheet.getRange(row, 3).setFormula("=IFERROR(INDEX(FILTER(DIÁRIO!C:C,(DIÁRIO!D:D>TODAY())*(DIÁRIO!D:D<=TODAY()+7)*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'')");
    hojeSheet.getRange(row, 3).setHorizontalAlignment("center").setFontSize(9);
    hojeSheet.getRange(row, 4).setFormula("=IFERROR(TEXT(INDEX(FILTER(DIÁRIO!D:D,(DIÁRIO!D:D>TODAY())*(DIÁRIO!D:D<=TODAY()+7)*(DIÁRIO!E:E=TRUE))," + (i+1) + "),'dd/MM/yyyy'),'')");
    hojeSheet.getRange(row, 4).setHorizontalAlignment("center");
    hojeSheet.getRange(row, 5).setFormula("=IF(B" + row + "='','',TEXT(DATEVALUE(D" + row + ")-TODAY(),'0')&' dias')");
    hojeSheet.getRange(row, 5).setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#f57c00");
    hojeSheet.getRange(row, 6).setFormula("=IF(B" + row + "='','',IF(DATEVALUE(D" + row + ")-TODAY()<=2,'🔥 Alta',IF(DATEVALUE(D" + row + ")-TODAY()<=4,'⚡ Média','✅ Normal')))");
    hojeSheet.getRange(row, 6).setHorizontalAlignment("center").setFontSize(10);

    // Fundo alternado
    hojeSheet.getRange(row, 1, 1, 6).setBackground(i % 2 === 0 ? "#fff8e1" : "#ffe0b2");
    hojeSheet.setRowHeight(row, 32);
  }
  currentRow += 10;

  // === RODAPÉ ===
  hojeSheet.setRowHeight(currentRow, 20);
  currentRow++;

  hojeSheet.getRange(currentRow, 1, 1, 6).merge();
  hojeSheet.getRange(currentRow, 1).setValue("Dashboard atualizado automaticamente | Última visualização: " + formatDate(new Date()));
  hojeSheet.getRange(currentRow, 1).setBackground("#37474f").setFontColor("#ffffff");
  hojeSheet.getRange(currentRow, 1).setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(9);
  hojeSheet.setRowHeight(currentRow, 30);

  // Congelar cabeçalho principal
  hojeSheet.setFrozenRows(2);

  // Proteção visual - adicionar bordas nas seções principais
  hojeSheet.getRange("A1:F" + currentRow).setBorder(true, true, true, true, false, false, "#424242", SpreadsheetApp.BorderStyle.SOLID);
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
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy');
  } catch (e) {
    Logger.log('Erro ao formatar data: ' + e.toString());
    return '';
  }
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
// REAVALIAÇÃO DA REVISÃO EXTRA
// ==========================================
function reevaluateExtraReview(ss, data) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const diaryData = diarySheet.getDataRange().getValues();

  const year = new Date().getFullYear();
  const julyEnd = new Date(year, 6, 31);
  const septemberStart = new Date(year, 8, 1);

  // Buscar todas as revisões ativas do tema
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

  if (reviews.length === 0) return;

  // Ordenar por data
  reviews.sort((a, b) => a.date - b.date);

  // Identificar revisão extra (revisão em setembro ou depois que não seja parte da sequência normal)
  let extraReviewIndex = -1;
  let lastNormalReviewDate = null;

  // A revisão extra é identificada como a última revisão se estiver em setembro+
  const lastReview = reviews[reviews.length - 1];
  if (lastReview.date >= septemberStart) {
    // Verificar se há revisões antes de setembro
    const reviewsBeforeSeptember = reviews.filter(r => r.date < septemberStart);
    if (reviewsBeforeSeptember.length > 0) {
      extraReviewIndex = reviews.length - 1;
      lastNormalReviewDate = reviewsBeforeSeptember[reviewsBeforeSeptember.length - 1].date;
    } else {
      // Todas as revisões são em setembro+, não há revisão extra
      lastNormalReviewDate = reviews[reviews.length - 1].date;
    }
  } else {
    // Última revisão é antes de setembro, não há revisão extra
    lastNormalReviewDate = lastReview.date;
  }

  // Decidir se precisa de revisão extra
  const needsExtraReview = lastNormalReviewDate && lastNormalReviewDate <= julyEnd;
  const hasExtraReview = extraReviewIndex !== -1;

  if (needsExtraReview && !hasExtraReview) {
    // Adicionar revisão extra
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
      action: 'Revisão Extra Adicionada (Reavaliação)',
      date: formatDate(extraReviewDate),
      reason: 'Última revisão normal em ' + formatDate(lastNormalReviewDate) + ' (antes de julho)'
    });
  } else if (!needsExtraReview && hasExtraReview) {
    // Remover revisão extra
    const range = diarySheet.getRange(reviews[extraReviewIndex].index, 5);
    range.setValue(false);

    changeLog.push({
      type: 'EXTRA_REVIEW_REMOVED',
      action: 'Revisão Extra Removida (Reavaliação)',
      date: formatDate(reviews[extraReviewIndex].date),
      reason: 'Última revisão normal em ' + formatDate(lastNormalReviewDate) + ' (após julho)'
    });
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
  // Validar e parsear data
  if (!data.date || typeof data.date !== 'string') {
    throw new Error('Data inválida: ' + data.date);
  }

  const parts = data.date.split('/');
  if (parts.length !== 3) {
    throw new Error('Formato de data inválido. Use dd/MM/yyyy: ' + data.date);
  }

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Data com valores inválidos: ' + data.date);
  }

  const entryDate = new Date(year, month, day);

  if (isNaN(entryDate.getTime())) {
    throw new Error('Data inválida após conversão: ' + data.date);
  }

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

  // Reavaliar regra da revisão extra após mudanças nas datas
  reevaluateExtraReview(ss, data);
}

// ==========================================
// FUNÇÃO GET DIARY DATA
// ==========================================
function getDiaryData(ss) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const dataEntrySheet = ss.getSheetByName("DATA ENTRY");

  if (!diarySheet || !dataEntrySheet) {
    return { status: 'error', message: 'Planilhas não encontradas' };
  }

  const diaryData = diarySheet.getDataRange().getValues();
  const dataEntryData = dataEntrySheet.getDataRange().getValues();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const todayReviews = [];
  const completedToday = [];
  const overdue = [];
  const upcoming = [];

  for (let i = 1; i < diaryData.length; i++) {
    if (!diaryData[i][4]) continue; // Pular se status = false

    const dataAgendada = new Date(diaryData[i][3]);
    dataAgendada.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((dataAgendada - hoje) / (1000 * 60 * 60 * 24));

    const review = {
      id: diaryData[i][0],
      tema: diaryData[i][1],
      acao: diaryData[i][2],
      dataAgendada: formatDate(dataAgendada),
      status: diaryData[i][4],
      daysDiff: daysDiff
    };

    // Check if completed - verificar se existe entrada em DATA ENTRY na data agendada
    let isCompleted = false;
    for (let j = 1; j < dataEntryData.length; j++) {
      if (dataEntryData[j][1] === review.tema &&
          dataEntryData[j][2] === 'Revisão' &&
          dataEntryData[j][8] === review.dataAgendada) {
        isCompleted = true;
        break;
      }
    }

    // Apenas contar REVISÕES, não "Primeiro Contato"
    if (daysDiff === 0 && diaryData[i][2] === 'Revisão') {
      todayReviews.push(review);
      if (isCompleted) completedToday.push(review);
    } else if (daysDiff < 0 && diaryData[i][2] === 'Revisão') {
      overdue.push(review);
    } else if (daysDiff > 0 && daysDiff <= 7 && diaryData[i][2] === 'Revisão') {
      upcoming.push(review);
    }
  }

  // Statistics
  let completedThisMonth = 0;
  let totalCompleted = 0;
  const currentMonth = hoje.getMonth();
  const currentYear = hoje.getFullYear();

  for (let i = 1; i < dataEntryData.length; i++) {
    if (dataEntryData[i][2] === 'Revisão') {
      totalCompleted++;
      const parts = dataEntryData[i][8].split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        if (month === currentMonth && year === currentYear) {
          completedThisMonth++;
        }
      }
    }
  }

  return {
    status: 'success',
    data: {
      today: {
        date: formatDate(hoje),
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
        overdueCount: overdue.length,
        upcomingCount: upcoming.length
      },
      overdue: overdue,
      upcoming: upcoming,
      allActiveReviews: diaryData.length - 1
    }
  };
}

// ==========================================
// FUNÇÃO GET DASHBOARD DATA
// ==========================================
function getDashboardData(ss) {
  const dataEntrySheet = ss.getSheetByName("DATA ENTRY");
  const simuladosSheet = ss.getSheetByName("SIMULADOS");
  const temasSheet = ss.getSheetByName("TEMAS");

  if (!dataEntrySheet || !simuladosSheet) {
    return { status: 'error', message: 'Planilhas não encontradas' };
  }

  const dataEntryData = dataEntrySheet.getDataRange().getValues();
  const simuladosData = simuladosSheet.getDataRange().getValues();
  const temasData = temasSheet ? temasSheet.getDataRange().getValues() : [];

  // Stats por tema
  const topicStatsMap = {};
  let totalQuestoesRevisoes = 0;
  let totalAcertosRevisoes = 0;
  let totalRevisoes = 0;

  for (let i = 1; i < dataEntryData.length; i++) {
    if (dataEntryData[i][2] === 'Revisão' && dataEntryData[i][5]) {
      totalRevisoes++;
      const tema = dataEntryData[i][1];
      const total = parseInt(dataEntryData[i][6]) || 0;
      const acertos = parseInt(dataEntryData[i][7]) || 0;

      if (!topicStatsMap[tema]) {
        let cor = 'Amarelo';
        for (let j = 1; j < temasData.length; j++) {
          if (temasData[j][1] === tema) {
            cor = temasData[j][2] || 'Amarelo';
            break;
          }
        }
        topicStatsMap[tema] = { tema, totalQuestoes: 0, totalAcertos: 0, cor };
      }

      topicStatsMap[tema].totalQuestoes += total;
      topicStatsMap[tema].totalAcertos += acertos;
      totalQuestoesRevisoes += total;
      totalAcertosRevisoes += acertos;
    }
  }

  const topicStats = Object.values(topicStatsMap).map(t => ({
    ...t,
    percentual: t.totalQuestoes > 0 ? (t.totalAcertos / t.totalQuestoes) * 100 : 0
  }));

  // Stats por área (simulados)
  const areaStatsMap = {
    'Clínica': { area: 'Clínica', totalQuestoes: 0, totalAcertos: 0 },
    'Cirurgia': { area: 'Cirurgia', totalQuestoes: 0, totalAcertos: 0 },
    'Preventiva': { area: 'Preventiva', totalQuestoes: 0, totalAcertos: 0 },
    'Pediatria': { area: 'Pediatria', totalQuestoes: 0, totalAcertos: 0 },
    'Ginecologia': { area: 'Ginecologia', totalQuestoes: 0, totalAcertos: 0 }
  };

  let totalQuestoesSimulados = 0;
  let totalAcertosSimulados = 0;

  for (let i = 1; i < simuladosData.length; i++) {
    areaStatsMap['Clínica'].totalQuestoes += parseInt(simuladosData[i][3]) || 0;
    areaStatsMap['Clínica'].totalAcertos += parseInt(simuladosData[i][4]) || 0;
    areaStatsMap['Cirurgia'].totalQuestoes += parseInt(simuladosData[i][5]) || 0;
    areaStatsMap['Cirurgia'].totalAcertos += parseInt(simuladosData[i][6]) || 0;
    areaStatsMap['Preventiva'].totalQuestoes += parseInt(simuladosData[i][7]) || 0;
    areaStatsMap['Preventiva'].totalAcertos += parseInt(simuladosData[i][8]) || 0;
    areaStatsMap['Pediatria'].totalQuestoes += parseInt(simuladosData[i][9]) || 0;
    areaStatsMap['Pediatria'].totalAcertos += parseInt(simuladosData[i][10]) || 0;
    areaStatsMap['Ginecologia'].totalQuestoes += parseInt(simuladosData[i][11]) || 0;
    areaStatsMap['Ginecologia'].totalAcertos += parseInt(simuladosData[i][12]) || 0;

    totalQuestoesSimulados += parseInt(simuladosData[i][2]) || 0;
    totalAcertosSimulados += (parseInt(simuladosData[i][4]) || 0) +
                             (parseInt(simuladosData[i][6]) || 0) +
                             (parseInt(simuladosData[i][8]) || 0) +
                             (parseInt(simuladosData[i][10]) || 0) +
                             (parseInt(simuladosData[i][12]) || 0);
  }

  const areaStats = Object.values(areaStatsMap).map(a => ({
    ...a,
    percentual: a.totalQuestoes > 0 ? (a.totalAcertos / a.totalQuestoes) * 100 : 0
  }));

  // Atividade diária (últimos 14 dias)
  const dailyActivity = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = formatDate(date);

    let revisoes = 0;
    let simulados = 0;

    for (let j = 1; j < dataEntryData.length; j++) {
      if (dataEntryData[j][8] === dateStr && dataEntryData[j][2] === 'Revisão') {
        revisoes++;
      }
    }

    for (let j = 1; j < simuladosData.length; j++) {
      const timestamp = new Date(simuladosData[j][13]);
      if (formatDate(timestamp) === dateStr) {
        simulados++;
      }
    }

    dailyActivity.push({ date: dateStr, revisoes, simulados });
  }

  return {
    status: 'success',
    data: {
      topicStats,
      areaStats,
      dailyActivity,
      totalRevisoes,
      totalSimulados: simuladosData.length - 1,
      totalQuestoesRevisoes,
      totalAcertosRevisoes,
      totalQuestoesSimulados,
      totalAcertosSimulados
    }
  };
}

// ==========================================
// FUNÇÃO GET CRONOGRAMA
// ==========================================
function getCronograma(ss) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const dataEntrySheet = ss.getSheetByName("DATA ENTRY");

  if (!diarySheet || !dataEntrySheet) {
    return { status: 'error', message: 'Planilhas não encontradas' };
  }

  const diaryData = diarySheet.getDataRange().getValues();
  const dataEntryData = dataEntrySheet.getDataRange().getValues();

  // Map to store themes organized by week
  const temasPorSemana = {};
  const temasPorNome = {}; // Track themes to avoid duplicates

  // Collect all "Primeiro Contato" entries from DIÁRIO
  for (let i = 1; i < diaryData.length; i++) {
    if (diaryData[i][2] === 'Primeiro Contato') {
      const tema = diaryData[i][1];
      const dataPrimeiroContato = new Date(diaryData[i][3]);

      // Calculate week number (simple calculation: week of year)
      const startOfYear = new Date(dataPrimeiroContato.getFullYear(), 0, 1);
      const daysDiff = Math.floor((dataPrimeiroContato - startOfYear) / (1000 * 60 * 60 * 24));
      const semana = Math.ceil((daysDiff + startOfYear.getDay() + 1) / 7);

      // Check if tema was studied (exists in DATA ENTRY with "Primeiro Contato")
      let status = 'Pendente';
      let dataEstudo = '';

      for (let j = 1; j < dataEntryData.length; j++) {
        if (dataEntryData[j][1] === tema && dataEntryData[j][2] === 'Primeiro Contato') {
          status = 'Estudado';
          dataEstudo = dataEntryData[j][8]; // DATA_REF
          break;
        }
      }

      // Add tema to week if not already added
      if (!temasPorNome[tema]) {
        temasPorNome[tema] = true;

        if (!temasPorSemana[semana]) {
          temasPorSemana[semana] = [];
        }

        temasPorSemana[semana].push({
          tema: tema,
          status: status,
          dataEstudo: dataEstudo,
          semana: semana
        });
      }
    }
  }

  // Calculate progress: (Y/X) × 100
  // X = total planned (all Primeiro Contato + all Revisão with status=true in DIÁRIO)
  // Y = total realized (all entries in DATA ENTRY with Primeiro Contato or Revisão)
  let totalPrevisto = 0;
  let totalRealizado = 0;

  // Count all active entries in DIÁRIO
  for (let i = 1; i < diaryData.length; i++) {
    if (diaryData[i][4] === true) { // status = true
      totalPrevisto++;
    }
  }

  // Count all completed entries in DATA ENTRY
  for (let i = 1; i < dataEntryData.length; i++) {
    totalRealizado++;
  }

  const percentual = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;

  return {
    status: 'success',
    data: {
      temasPorSemana: temasPorSemana,
      progressoGeral: {
        totalPrevisto: totalPrevisto,
        totalRealizado: totalRealizado,
        percentual: percentual
      }
    }
  };
}

// ==========================================
// FUNÇÃO GET METRICAS
// ==========================================
function getMetricas(ss, periodo) {
  const dataEntrySheet = ss.getSheetByName("DATA ENTRY");

  if (!dataEntrySheet) {
    return { status: 'error', message: 'Planilha DATA ENTRY não encontrada' };
  }

  const dataEntryData = dataEntrySheet.getDataRange().getValues();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Calculate date range based on period
  let startDate = new Date(hoje);

  switch (periodo) {
    case 'dia':
      // Today only
      break;
    case 'semana':
      // Last 7 days
      startDate.setDate(hoje.getDate() - 6);
      break;
    case 'mes':
      // Current month
      startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case 'trimestre':
      // Last 3 months
      startDate.setMonth(hoje.getMonth() - 2);
      startDate.setDate(1);
      break;
    default:
      startDate.setDate(hoje.getDate() - 6); // Default to week
  }

  let questoesRealizadas = 0;
  let acertos = 0;
  let temasEstudados = 0;
  let temasRevisados = 0;

  // Process DATA ENTRY within date range
  for (let i = 1; i < dataEntryData.length; i++) {
    const dataRef = dataEntryData[i][8]; // DATA_REF

    // Skip if dataRef is not valid
    if (!dataRef || typeof dataRef !== 'string') continue;

    const parts = dataRef.split('/');
    if (parts.length !== 3) continue;

    const entryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    entryDate.setHours(0, 0, 0, 0);

    // Check if within range
    if (entryDate >= startDate && entryDate <= hoje) {
      const detalhes = dataEntryData[i][2]; // DETALHES
      const isQuestions = dataEntryData[i][5]; // QUESTOES (boolean)
      const totalQuestions = parseInt(dataEntryData[i][6]) || 0;
      const correctQuestions = parseInt(dataEntryData[i][7]) || 0;

      if (isQuestions) {
        questoesRealizadas += totalQuestions;
        acertos += correctQuestions;
      }

      if (detalhes === 'Primeiro Contato') {
        temasEstudados++;
      } else if (detalhes === 'Revisão') {
        temasRevisados++;
      }
    }
  }

  return {
    status: 'success',
    data: {
      questoesRealizadas: questoesRealizadas,
      acertos: acertos,
      temasEstudados: temasEstudados,
      temasRevisados: temasRevisados
    }
  };
}

// ==========================================
// FUNÇÃO GET LISTA MESTRA TEMAS
// ==========================================
function getListaMestraTemas(ss) {
  const diarySheet = ss.getSheetByName("DIÁRIO");
  const dataEntrySheet = ss.getSheetByName("DATA ENTRY");

  if (!diarySheet || !dataEntrySheet) {
    return { status: 'error', message: 'Planilhas não encontradas' };
  }

  const diaryData = diarySheet.getDataRange().getValues();
  const dataEntryData = dataEntrySheet.getDataRange().getValues();

  const temasMap = {};

  // First pass: collect all themes from DIÁRIO with "Primeiro Contato"
  for (let i = 1; i < diaryData.length; i++) {
    if (diaryData[i][2] === 'Primeiro Contato') {
      const tema = diaryData[i][1];
      const dataPrimeiroEstudo = formatDate(new Date(diaryData[i][3]));

      if (!temasMap[tema]) {
        temasMap[tema] = {
          tema: tema,
          dataPrimeiroEstudo: dataPrimeiroEstudo,
          totalQuestoes: 0,
          totalAcertos: 0,
          quantidadeRevisoes: 0,
          revisoes: []
        };
      }
    }
  }

  // Second pass: gather question data and revision count from DATA ENTRY
  for (let i = 1; i < dataEntryData.length; i++) {
    const tema = dataEntryData[i][1];
    const detalhes = dataEntryData[i][2];
    const isQuestions = dataEntryData[i][5];
    const totalQuestions = parseInt(dataEntryData[i][6]) || 0;
    const correctQuestions = parseInt(dataEntryData[i][7]) || 0;
    const dataRef = dataEntryData[i][8];

    // Skip if tema or dataRef is not valid
    if (!tema || !dataRef || typeof dataRef !== 'string') continue;

    if (temasMap[tema]) {
      if (isQuestions) {
        temasMap[tema].totalQuestoes += totalQuestions;
        temasMap[tema].totalAcertos += correctQuestions;
      }

      if (detalhes === 'Revisão') {
        temasMap[tema].quantidadeRevisoes++;

        // Find corresponding scheduled date in DIÁRIO to check if rescheduled
        let dataOriginal = '';
        let remarcada = false;

        for (let j = 1; j < diaryData.length; j++) {
          if (diaryData[j][1] === tema && diaryData[j][2] === 'Revisão') {
            const scheduledDate = formatDate(new Date(diaryData[j][3]));

            // Check if this scheduled date matches the actual completion date
            if (scheduledDate !== dataRef) {
              // This could be the rescheduled one
              // For simplicity, we'll mark as rescheduled if dates don't match
              remarcada = true;
              dataOriginal = scheduledDate;
              break;
            }
          }
        }

        temasMap[tema].revisoes.push({
          data: dataRef,
          remarcada: remarcada,
          dataOriginal: remarcada ? dataOriginal : ''
        });
      }
    }
  }

  const temas = Object.values(temasMap);

  return {
    status: 'success',
    data: temas
  };
}

// ==========================================
// FUNÇÕES DO CRONOGRAMA
// ==========================================

// Carregar cronograma completo
function getCronogramaCompleto(ss) {
  try {
    // Tentar carregar da aba CRONOGRAMA
    let cronogramaSheet = ss.getSheetByName("CRONOGRAMA");

    if (!cronogramaSheet) {
      // Se não existe, retornar null para inicializar no frontend
      return {
        status: 'success',
        data: null
      };
    }

    const data = cronogramaSheet.getRange("A2").getValue();

    if (!data) {
      return {
        status: 'success',
        data: null
      };
    }

    // Parse JSON
    const cronograma = JSON.parse(data);

    return {
      status: 'success',
      data: cronograma
    };
  } catch (err) {
    return {
      status: 'error',
      message: 'Erro ao carregar cronograma: ' + err.toString()
    };
  }
}

// Salvar cronograma completo
function saveCronograma(ss, dataStr) {
  try {
    let cronogramaSheet = ss.getSheetByName("CRONOGRAMA");

    // Criar aba se não existir
    if (!cronogramaSheet) {
      cronogramaSheet = ss.insertSheet("CRONOGRAMA");
      cronogramaSheet.appendRow(["DADOS_CRONOGRAMA"]);
    }

    // Salvar JSON na célula A2
    cronogramaSheet.getRange("A2").setValue(dataStr);

    return {
      status: 'success',
      message: 'Cronograma salvo com sucesso'
    };
  } catch (err) {
    return {
      status: 'error',
      message: 'Erro ao salvar cronograma: ' + err.toString()
    };
  }
}

// ==========================================
// FUNÇÕES DA ABA HOJE - DIÁRIO
// ==========================================

// Buscar todos os registros do DIÁRIO
function getDiario(ss) {
  try {
    const diarioSheet = ss.getSheetByName("DIÁRIO");

    if (!diarioSheet) {
      return {
        status: 'success',
        data: []
      };
    }

    const lastRow = diarioSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        status: 'success',
        data: []
      };
    }

    // Buscar dados da aba DIÁRIO
    // Assumindo estrutura: Data | Tema | Ação | Semana
    const data = diarioSheet.getRange(2, 1, lastRow - 1, 4).getValues();

    const registros = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || !row[1]) continue; // Pular linhas vazias

      // Validar e converter data
      let dataISO;
      try {
        if (row[0] instanceof Date) {
          dataISO = row[0].toISOString();
        } else {
          const dateObj = new Date(row[0]);
          if (isNaN(dateObj.getTime())) {
            continue; // Pular se data inválida
          }
          dataISO = dateObj.toISOString();
        }
      } catch (e) {
        continue; // Pular se erro ao converter data
      }

      registros.push({
        data: dataISO,
        tema: row[1].toString(),
        acao: row[2] ? row[2].toString() : 'Primeira vez',
        semana: row[3] ? parseInt(row[3]) : null
      });
    }

    return {
      status: 'success',
      data: registros
    };
  } catch (err) {
    return {
      status: 'error',
      message: 'Erro ao carregar diário: ' + err.toString()
    };
  }
}

// Buscar todas as sessões de estudo do DATA ENTRY
function getAllStudySessions(ss) {
  try {
    const dataEntrySheet = ss.getSheetByName("DATA ENTRY");

    if (!dataEntrySheet) {
      return {
        status: 'success',
        data: []
      };
    }

    const lastRow = dataEntrySheet.getLastRow();
    if (lastRow <= 1) {
      return {
        status: 'success',
        data: []
      };
    }

    // Buscar dados da aba DATA ENTRY
    // Assumindo estrutura: Data | Tema | Detalhes | Dificuldade | É Aula? | Questões? | Total | Corretas
    const data = dataEntrySheet.getRange(2, 1, lastRow - 1, 8).getValues();

    const sessions = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || !row[1]) continue; // Pular linhas vazias

      // Validar e converter data
      let dateISO;
      try {
        if (row[0] instanceof Date) {
          dateISO = row[0].toISOString();
        } else {
          const dateObj = new Date(row[0]);
          if (isNaN(dateObj.getTime())) {
            continue; // Pular se data inválida
          }
          dateISO = dateObj.toISOString();
        }
      } catch (e) {
        continue; // Pular se erro ao converter data
      }

      sessions.push({
        date: dateISO,
        topic: row[1].toString(),
        details: row[2] ? row[2].toString() : '',
        difficulty: row[3] ? row[3].toString() : '',
        isClass: row[4] ? row[4].toString().toLowerCase() === 'sim' || row[4].toString().toLowerCase() === 'true' : false,
        isQuestions: row[5] ? row[5].toString().toLowerCase() === 'sim' || row[5].toString().toLowerCase() === 'true' : false,
        totalQuestions: row[6] ? parseInt(row[6]) : 0,
        correctQuestions: row[7] ? parseInt(row[7]) : 0
      });
    }

    return {
      status: 'success',
      data: sessions
    };
  } catch (err) {
    return {
      status: 'error',
      message: 'Erro ao carregar sessões de estudo: ' + err.toString()
    };
  }
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