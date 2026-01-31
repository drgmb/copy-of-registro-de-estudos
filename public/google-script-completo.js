// ==========================================
// GOOGLE APPS SCRIPT - SISTEMA COMPLETO
// DATA ENTRY + DIÁRIO + PLANEJAMENTO
// ==========================================
//
// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Copie TODO este código
// 2. Abra seu Google Sheets
// 3. Vá em Extensões > Apps Script
// 4. APAGUE todo o código existente
// 5. Cole este código completo
// 6. Salve (Ctrl+S)
// 7. Implantar > Nova implantação > Aplicativo da Web
// 8. Executar como: "Eu"
// 9. Quem tem acesso: "Qualquer pessoa"
// 10. Copie a URL e cole nas Configurações do app
// ==========================================

// FUNÇÕES AUXILIARES
function converterDataISO(dataString) {
  try {
    if (!dataString) throw new Error('Data não fornecida');
    dataString = String(dataString).trim();
    if (dataString.indexOf('T') !== -1) dataString = dataString.split('T')[0];
    var partes = dataString.split('-');
    if (partes.length !== 3) throw new Error('Formato de data inválido: ' + dataString);
    var ano = parseInt(partes[0]);
    var mes = parseInt(partes[1]) - 1;
    var dia = parseInt(partes[2]);
    var dataObj = new Date(ano, mes, dia);
    if (isNaN(dataObj.getTime())) throw new Error('Data inválida: ' + dataString);
    Logger.log('✅ Data convertida: ' + dataString + ' -> ' + dataObj);
    return dataObj;
  } catch (error) {
    Logger.log('❌ Erro ao converter data "' + dataString + '": ' + error.message);
    throw error;
  }
}

// FUNÇÕES DO DATA ENTRY (Registro de Estudos)
function addStudySession(date, topic, details, difficulty, isClass, hasQuestions, totalQuestions, correctQuestions) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('DATA ENTRY');
    if (!sheet) return { status: 'error', message: 'Aba DATA ENTRY não encontrada' };
    if (!date || !topic) return { status: 'error', message: 'Data e tema são obrigatórios' };

    var dateObj;
    try {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) throw new Error('Data inválida');
    } catch (e) {
      return { status: 'error', message: 'Formato de data inválido. Use dd/MM/yyyy: ' + date };
    }

    var isClassBool = (isClass === true || isClass === 'true' || isClass === 'TRUE');
    var hasQuestionsBool = (hasQuestions === true || hasQuestions === 'true' || hasQuestions === 'TRUE');
    var totalQuestionsNum = parseInt(totalQuestions) || 0;
    var correctQuestionsNum = parseInt(correctQuestions) || 0;

    sheet.appendRow([topic, details || '', difficulty || '', isClassBool, hasQuestionsBool, totalQuestionsNum, correctQuestionsNum, dateObj]);
    Logger.log('✅ Sessão de estudo adicionada: ' + topic + ' - ' + date);
    return { status: 'success', message: 'Sessão de estudo adicionada com sucesso' };
  } catch (error) {
    Logger.log('❌ Erro em addStudySession: ' + error.message);
    return { status: 'error', message: 'Erro ao adicionar sessão: ' + error.message };
  }
}

function getAllStudySessions() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('DATA ENTRY');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Aba DATA ENTRY não encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var sessions = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[7]) continue;

      try {
        var dateValue = row[7];
        var formattedDate = '';
        if (dateValue) {
          formattedDate = Utilities.formatDate(new Date(dateValue), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        sessions.push({
          topic: String(row[0] || ''),
          details: String(row[1] || ''),
          difficulty: String(row[2] || ''),
          isClass: Boolean(row[3]),
          hasQuestions: Boolean(row[4]),
          totalQuestions: Number(row[5]) || 0,
          correctQuestions: Number(row[6]) || 0,
          date: formattedDate
        });
      } catch (e) {
        Logger.log('Erro ao processar linha ' + (i + 1) + ': ' + e.message);
      }
    }

    Logger.log('✅ getAllStudySessions: ' + sessions.length + ' sessões encontradas');
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: sessions })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('❌ Erro em getAllStudySessions: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Erro ao buscar sessões: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNÇÕES DO DIÁRIO (Planejamento)
function getDiario() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');
    if (!sheetDiario) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Aba DIÁRIO não encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheetDiario.getDataRange().getValues();
    var diario = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || !row[1]) continue;

      try {
        var dataFormatada = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        diario.push({
          data: dataFormatada,
          tema: String(row[1]),
          acao: String(row[2]),
          semana: row[3] ? Number(row[3]) : null
        });
      } catch (e) {
        Logger.log('Erro ao processar linha ' + (i + 1) + ': ' + e.message);
      }
    }

    Logger.log('✅ getDiario: ' + diario.length + ' registros encontrados');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      diario: diario,
      data: diario
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('❌ Erro em getDiario: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Erro ao buscar DIÁRIO: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function adicionarRegistroDiario(tema, acao, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');
    if (!sheetDiario) return { status: 'error', message: 'Aba DIÁRIO não encontrada' };

    var dataObj = converterDataISO(data);
    sheetDiario.appendRow([dataObj, tema, acao, '']);
    Logger.log('✅ Registro adicionado: ' + tema + ' - ' + acao + ' - ' + data);
    return { status: 'success', message: 'Registro adicionado com sucesso' };
  } catch (error) {
    Logger.log('❌ Erro em adicionarRegistroDiario: ' + error.message);
    return { status: 'error', message: 'Erro ao adicionar registro: ' + error.message };
  }
}

function editarDataRegistroDiario(tema, acao, dataAntiga, dataNova) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');
    if (!sheetDiario) return { status: 'error', message: 'Aba DIÁRIO não encontrada' };

    var data = sheetDiario.getDataRange().getValues();
    var encontrado = false;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] || !row[1]) continue;

      try {
        var dataReg = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (dataReg === dataAntiga && String(row[1]) === tema && String(row[2]) === acao) {
          var novaDataObj = converterDataISO(dataNova);
          sheetDiario.getRange(i + 1, 1).setValue(novaDataObj);
          encontrado = true;
          Logger.log('✅ Data atualizada: ' + tema + ' de ' + dataAntiga + ' para ' + dataNova);
          break;
        }
      } catch (e) {
        Logger.log('Erro ao processar linha ' + (i + 1) + ': ' + e.message);
      }
    }

    if (!encontrado) return { status: 'error', message: 'Registro não encontrado no DIÁRIO' };
    return { status: 'success', message: 'Data atualizada com sucesso' };
  } catch (error) {
    Logger.log('❌ Erro em editarDataRegistroDiario: ' + error.message);
    return { status: 'error', message: 'Erro ao editar data: ' + error.message };
  }
}

function removerRegistroDiario(tema, acao, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');
    if (!sheetDiario) return { status: 'error', message: 'Aba DIÁRIO não encontrada' };

    var dataSheet = sheetDiario.getDataRange().getValues();
    var encontrado = false;

    for (var i = 1; i < dataSheet.length; i++) {
      var row = dataSheet[i];
      if (!row[0] || !row[1]) continue;

      try {
        var dataReg = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (dataReg === data && String(row[1]) === tema && String(row[2]) === acao) {
          sheetDiario.deleteRow(i + 1);
          encontrado = true;
          Logger.log('✅ Registro removido: ' + tema + ' - ' + acao + ' - ' + data);
          break;
        }
      } catch (e) {
        Logger.log('Erro ao processar linha ' + (i + 1) + ': ' + e.message);
      }
    }

    if (!encontrado) return { status: 'error', message: 'Registro não encontrado no DIÁRIO' };
    return { status: 'success', message: 'Registro removido com sucesso' };
  } catch (error) {
    Logger.log('❌ Erro em removerRegistroDiario: ' + error.message);
    return { status: 'error', message: 'Erro ao remover registro: ' + error.message };
  }
}

// ROTEAMENTO HTTP
function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getDiario') return getDiario();
  if (action === 'getAllStudySessions') return getAllStudySessions();
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação GET não reconhecida: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var action = e.parameter.action;

  // DIÁRIO
  if (action === 'adicionarRegistroDiario') {
    var result = adicionarRegistroDiario(e.parameter.tema, e.parameter.acao, e.parameter.data);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'editarDataRegistroDiario') {
    var result = editarDataRegistroDiario(e.parameter.tema, e.parameter.acao, e.parameter.dataAntiga, e.parameter.dataNova);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'removerRegistroDiario') {
    var result = removerRegistroDiario(e.parameter.tema, e.parameter.acao, e.parameter.data);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // DATA ENTRY
  if (action === 'addStudySession') {
    var result = addStudySession(
      e.parameter.date, e.parameter.topic, e.parameter.details, e.parameter.difficulty,
      e.parameter.isClass, e.parameter.hasQuestions, e.parameter.totalQuestions, e.parameter.correctQuestions
    );
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'getAllStudySessions') return getAllStudySessions();

  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação POST não reconhecida: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

// ESTRUTURA DAS ABAS:
// DATA ENTRY: TEMA | DETALHES | DIFICULDADE | AULA | QUESTOES | TOTAL | ACERTOS | DATA
// DIÁRIO: Data | Tema | Ação | Semana
