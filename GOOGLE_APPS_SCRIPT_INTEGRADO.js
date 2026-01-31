// ==========================================
// GOOGLE APPS SCRIPT - VERSÃO INTEGRADA COMPLETA
// Sistema de Revisões + DIÁRIO + DATA ENTRY
// ==========================================

// ==========================================
// FUNÇÕES AUXILIARES DE DATA
// ==========================================

// Converter DD/MM/YYYY ou YYYY-MM-DD para objeto Date
function converterData(dataString) {
  try {
    if (!dataString) throw new Error('Data não fornecida');
    var str = String(dataString).trim();

    // Se veio no formato ISO (YYYY-MM-DD), converter para DD/MM/YYYY
    if (str.indexOf('-') !== -1 && str.indexOf('/') === -1) {
      var partesISO = str.split('T')[0].split('-');
      str = partesISO[2] + '/' + partesISO[1] + '/' + partesISO[0];
    }

    // Agora está em DD/MM/YYYY
    var partes = str.split('/');
    if (partes.length !== 3) throw new Error('Formato inválido: ' + dataString);

    var dia = parseInt(partes[0]);
    var mes = parseInt(partes[1]);
    var ano = parseInt(partes[2]);

    // Criar data sem timezone
    var data = new Date(ano, mes - 1, dia, 12, 0, 0);
    if (isNaN(data.getTime())) throw new Error('Data inválida: ' + dataString);

    return data;
  } catch (error) {
    Logger.log('❌ Erro converter data: ' + error.message);
    throw error;
  }
}

// Formatar Date para DD/MM/YYYY
function formatarData(data) {
  var dia = data.getDate();
  var mes = data.getMonth() + 1;
  var ano = data.getFullYear();
  return (dia < 10 ? '0' : '') + dia + '/' + (mes < 10 ? '0' : '') + mes + '/' + ano;
}

// ==========================================
// FUNÇÕES DO DIÁRIO (Planejamento)
// ==========================================

function getDiario() {
  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DIÁRIO');

    if (!aba) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Aba DIÁRIO não encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var dados = aba.getDataRange().getValues();
    var registros = [];

    for (var i = 1; i < dados.length; i++) {
      var linha = dados[i];
      if (!linha[0] || !linha[1]) continue;

      try {
        registros.push({
          data: formatarData(new Date(linha[0])),
          tema: String(linha[1]),
          acao: String(linha[2]),
          semana: linha[3] ? Number(linha[3]) : null
        });
      } catch (e) {
        Logger.log('Erro linha ' + (i + 1) + ': ' + e.message);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      diario: registros,
      data: registros
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function adicionarRegistroDiario(tema, acao, data) {
  try {
    Logger.log('📝 DIÁRIO - Adicionando: ' + tema + ' | ' + acao + ' | ' + data);

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DIÁRIO');

    if (!aba) {
      Logger.log('❌ Aba DIÁRIO não encontrada!');
      return { status: 'error', message: 'Aba DIÁRIO não encontrada' };
    }

    var dataObj = converterData(data);
    aba.appendRow([dataObj, tema, acao, '']);

    Logger.log('✅ Registro adicionado ao DIÁRIO');
    return { status: 'success', message: 'Registro adicionado' };
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    return { status: 'error', message: error.message };
  }
}

function editarDataRegistroDiario(tema, acao, dataAntiga, dataNova) {
  try {
    Logger.log('✏️ DIÁRIO - Editando: ' + tema + ' de ' + dataAntiga + ' para ' + dataNova);

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DIÁRIO');

    if (!aba) return { status: 'error', message: 'Aba DIÁRIO não encontrada' };

    var dados = aba.getDataRange().getValues();

    for (var i = 1; i < dados.length; i++) {
      var linha = dados[i];
      if (!linha[0] || !linha[1]) continue;

      var dataLinha = formatarData(new Date(linha[0]));

      if (dataLinha === dataAntiga && String(linha[1]) === tema && String(linha[2]) === acao) {
        var novaData = converterData(dataNova);
        aba.getRange(i + 1, 1).setValue(novaData);
        Logger.log('✅ Data atualizada');
        return { status: 'success', message: 'Data atualizada' };
      }
    }

    return { status: 'error', message: 'Registro não encontrado' };
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    return { status: 'error', message: error.message };
  }
}

function removerRegistroDiario(tema, acao, data) {
  try {
    Logger.log('🗑️ DIÁRIO - Removendo: ' + tema + ' | ' + acao + ' | ' + data);

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DIÁRIO');

    if (!aba) return { status: 'error', message: 'Aba DIÁRIO não encontrada' };

    var dados = aba.getDataRange().getValues();

    for (var i = 1; i < dados.length; i++) {
      var linha = dados[i];
      if (!linha[0] || !linha[1]) continue;

      var dataLinha = formatarData(new Date(linha[0]));

      if (dataLinha === data && String(linha[1]) === tema && String(linha[2]) === acao) {
        aba.deleteRow(i + 1);
        Logger.log('✅ Registro removido');
        return { status: 'success', message: 'Registro removido' };
      }
    }

    return { status: 'error', message: 'Registro não encontrado' };
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    return { status: 'error', message: error.message };
  }
}

// ==========================================
// FUNÇÕES DO DATA ENTRY (Registro de Estudos)
// ==========================================

function addStudySession(date, topic, details, difficulty, isClass, hasQuestions, totalQuestions, correctQuestions) {
  try {
    Logger.log('📚 DATA ENTRY - Adicionando: ' + topic + ' | ' + date);

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DATA ENTRY');

    if (!aba) {
      Logger.log('❌ Aba DATA ENTRY não encontrada!');
      return { status: 'error', message: 'Aba DATA ENTRY não encontrada' };
    }

    if (!date || !topic) {
      return { status: 'error', message: 'Data e tema obrigatórios' };
    }

    var dataObj = converterData(date);
    var isClassBool = (isClass === true || isClass === 'true' || isClass === 'TRUE');
    var hasQuestionsBool = (hasQuestions === true || hasQuestions === 'true' || hasQuestions === 'TRUE');
    var totalNum = parseInt(totalQuestions) || 0;
    var correctNum = parseInt(correctQuestions) || 0;

    aba.appendRow([
      topic,
      details || '',
      difficulty || '',
      isClassBool,
      hasQuestionsBool,
      totalNum,
      correctNum,
      dataObj
    ]);

    Logger.log('✅ Sessão adicionada ao DATA ENTRY');
    return { status: 'success', message: 'Sessão adicionada' };
  } catch (error) {
    Logger.log('❌ Erro: ' + error.message);
    return { status: 'error', message: error.message };
  }
}

function getAllStudySessions() {
  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName('DATA ENTRY');

    if (!aba) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Aba DATA ENTRY não encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var dados = aba.getDataRange().getValues();
    var sessoes = [];

    for (var i = 1; i < dados.length; i++) {
      var linha = dados[i];
      if (!linha[0] && !linha[7]) continue;

      try {
        var dataFormatada = linha[7] ? formatarData(new Date(linha[7])) : '';

        sessoes.push({
          topic: String(linha[0] || ''),
          details: String(linha[1] || ''),
          difficulty: String(linha[2] || ''),
          isClass: Boolean(linha[3]),
          hasQuestions: Boolean(linha[4]),
          totalQuestions: Number(linha[5]) || 0,
          correctQuestions: Number(linha[6]) || 0,
          date: dataFormatada
        });
      } catch (e) {
        Logger.log('Erro linha ' + (i + 1) + ': ' + e.message);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: sessoes
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// ROTEAMENTO HTTP - doGet
// ==========================================

function doGet(e) {
  var action = e.parameter.action;
  Logger.log('📥 GET: ' + action);

  // DIÁRIO
  if (action === 'getDiario') return getDiario();

  // DATA ENTRY
  if (action === 'getAllStudySessions') return getAllStudySessions();

  // ⚠️ ADICIONE AQUI SUAS OUTRAS AÇÕES GET EXISTENTES:
  // if (action === 'getDashboardData') return getDashboardData();
  // if (action === 'getCronograma') return getCronograma();
  // etc...

  Logger.log('❌ Ação GET não reconhecida: ' + action);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação GET não reconhecida: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// ROTEAMENTO HTTP - doPost
// ==========================================

function doPost(e) {
  var action = e.parameter.action;
  Logger.log('📤 POST: ' + action);

  // ========== DIÁRIO ==========
  if (action === 'adicionarRegistroDiario') {
    var result = adicionarRegistroDiario(
      e.parameter.tema,
      e.parameter.acao,
      e.parameter.data
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'editarDataRegistroDiario') {
    var result = editarDataRegistroDiario(
      e.parameter.tema,
      e.parameter.acao,
      e.parameter.dataAntiga,
      e.parameter.dataNova
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'removerRegistroDiario') {
    var result = removerRegistroDiario(
      e.parameter.tema,
      e.parameter.acao,
      e.parameter.data
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ========== DATA ENTRY ==========
  if (action === 'addStudySession') {
    var result = addStudySession(
      e.parameter.date,
      e.parameter.topic,
      e.parameter.details,
      e.parameter.difficulty,
      e.parameter.isClass,
      e.parameter.hasQuestions,
      e.parameter.totalQuestions,
      e.parameter.correctQuestions
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getAllStudySessions') {
    return getAllStudySessions();
  }

  // ⚠️ ADICIONE AQUI SUAS OUTRAS AÇÕES POST EXISTENTES:
  // if (action === 'updateSchedule') return updateSchedule(...);
  // etc...

  Logger.log('❌ Ação POST não reconhecida: ' + action);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação POST não reconhecida: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// ⚠️ IMPORTANTE: ADICIONE AQUI SUAS OUTRAS FUNÇÕES EXISTENTES
// ==========================================
//
// Cole aqui TODAS as outras funções que você já tem:
// - Sistema de revisões espaçadas
// - getDashboardData()
// - getCronograma()
// - updateSchedule()
// - etc...
//
// ESTRUTURA DAS ABAS:
// DATA ENTRY: TEMA | DETALHES | DIFICULDADE | AULA | QUESTOES | TOTAL | ACERTOS | DATA
// DIÁRIO: Data | Tema | Ação | Semana
// ==========================================
