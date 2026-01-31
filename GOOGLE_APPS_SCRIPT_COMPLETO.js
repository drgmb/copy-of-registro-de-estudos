// ==========================================
// GOOGLE APPS SCRIPT - SISTEMA COMPLETO
// DATA ENTRY + DIÁRIO + PLANEJAMENTO
// ==========================================

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Converter string YYYY-MM-DD ou ISO completo para Date
 * Aceita formatos:
 * - YYYY-MM-DD (ex: 2026-01-30)
 * - ISO completo (ex: 2026-01-30T03:00:00.000Z)
 */
function converterDataISO(dataString) {
  try {
    if (!dataString) {
      throw new Error('Data não fornecida');
    }

    // Converter para string e remover espaços
    dataString = String(dataString).trim();

    // Se a data contém 'T' (formato ISO completo), extrair apenas a parte da data
    if (dataString.indexOf('T') !== -1) {
      dataString = dataString.split('T')[0];
    }

    // Extrair ano, mês e dia da string YYYY-MM-DD
    var partes = dataString.split('-');
    if (partes.length !== 3) {
      throw new Error('Formato de data inválido: ' + dataString);
    }

    var ano = parseInt(partes[0]);
    var mes = parseInt(partes[1]) - 1; // Mês começa em 0 no JavaScript
    var dia = parseInt(partes[2]);

    // Criar data no timezone do script
    var dataObj = new Date(ano, mes, dia);

    // Validar se a data é válida
    if (isNaN(dataObj.getTime())) {
      throw new Error('Data inválida: ' + dataString);
    }

    Logger.log('✅ Data convertida: ' + dataString + ' -> ' + dataObj);
    return dataObj;
  } catch (error) {
    Logger.log('❌ Erro ao converter data "' + dataString + '": ' + error.message);
    throw error;
  }
}

/**
 * Normalizar string para comparação (remove acentos, converte para minúsculas)
 */
function normalizeString(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ==========================================
// FUNÇÕES DO DATA ENTRY (Registro de Estudos)
// ==========================================

/**
 * Adicionar sessão de estudo ao DATA ENTRY
 */
function addStudySession(date, topic, details, difficulty, isClass, hasQuestions, totalQuestions, correctQuestions) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('DATA ENTRY');

    if (!sheet) {
      return {
        status: 'error',
        message: 'Aba DATA ENTRY não encontrada'
      };
    }

    // Validação básica
    if (!date || !topic) {
      return {
        status: 'error',
        message: 'Data e tema são obrigatórios'
      };
    }

    // Converter data
    var dateObj;
    try {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Data inválida');
      }
    } catch (e) {
      return {
        status: 'error',
        message: 'Formato de data inválido. Use dd/MM/yyyy: ' + date
      };
    }

    // Converter valores booleanos
    var isClassBool = (isClass === true || isClass === 'true' || isClass === 'TRUE');
    var hasQuestionsBool = (hasQuestions === true || hasQuestions === 'true' || hasQuestions === 'TRUE');

    // Converter números
    var totalQuestionsNum = parseInt(totalQuestions) || 0;
    var correctQuestionsNum = parseInt(correctQuestions) || 0;

    // Adicionar linha
    sheet.appendRow([
      topic,
      details || '',
      difficulty || '',
      isClassBool,
      hasQuestionsBool,
      totalQuestionsNum,
      correctQuestionsNum,
      dateObj
    ]);

    Logger.log('✅ Sessão de estudo adicionada: ' + topic + ' - ' + date);

    return {
      status: 'success',
      message: 'Sessão de estudo adicionada com sucesso'
    };

  } catch (error) {
    Logger.log('❌ Erro em addStudySession: ' + error.message);
    return {
      status: 'error',
      message: 'Erro ao adicionar sessão: ' + error.message
    };
  }
}

/**
 * Buscar todas as sessões de estudo do DATA ENTRY
 */
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

    // Estrutura: TEMA | DETALHES | DIFICULDADE | AULA | QUESTOES | TOTAL | ACERTOS | DATA
    // Linha 1 é o cabeçalho, começar da linha 2
    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Pular linhas completamente vazias
      if (!row[0] && !row[7]) continue;

      try {
        var dateValue = row[7];
        var formattedDate = '';

        if (dateValue) {
          formattedDate = Utilities.formatDate(
            new Date(dateValue),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );
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

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: sessions
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ Erro em getAllStudySessions: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Erro ao buscar sessões: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// FUNÇÕES DO DIÁRIO (Planejamento)
// ==========================================

/**
 * Buscar todos os registros do DIÁRIO
 */
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

    // Estrutura: Data (coluna A) | Tema (coluna B) | Ação (coluna C) | Semana (coluna D)
    // Linha 1 é o cabeçalho, começar da linha 2
    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Pular linhas vazias
      if (!row[0] || !row[1]) continue;

      try {
        var dataFormatada = Utilities.formatDate(
          new Date(row[0]),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        );

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

    // Retornar em ambos os formatos para compatibilidade
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      diario: diario,
      data: diario  // Compatibilidade com versões antigas
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ Erro em getDiario: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Erro ao buscar DIÁRIO: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Adicionar novo registro ao DIÁRIO
 */
function adicionarRegistroDiario(tema, acao, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');

    if (!sheetDiario) {
      return {
        status: 'error',
        message: 'Aba DIÁRIO não encontrada'
      };
    }

    // Converter string de data para objeto Date
    var dataObj = converterDataISO(data);

    // Adicionar nova linha ao final da planilha
    // Estrutura: Data | Tema | Ação | Semana
    sheetDiario.appendRow([
      dataObj,
      tema,
      acao,
      '' // Semana em branco por enquanto
    ]);

    Logger.log('✅ Registro adicionado: ' + tema + ' - ' + acao + ' - ' + data);

    return {
      status: 'success',
      message: 'Registro adicionado com sucesso'
    };

  } catch (error) {
    Logger.log('❌ Erro em adicionarRegistroDiario: ' + error.message);
    return {
      status: 'error',
      message: 'Erro ao adicionar registro: ' + error.message
    };
  }
}

/**
 * Editar a data de um registro existente
 */
function editarDataRegistroDiario(tema, acao, dataAntiga, dataNova) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');

    if (!sheetDiario) {
      return {
        status: 'error',
        message: 'Aba DIÁRIO não encontrada'
      };
    }

    var data = sheetDiario.getDataRange().getValues();
    var encontrado = false;

    // Procurar o registro com a data antiga
    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      // Pular linhas vazias
      if (!row[0] || !row[1]) continue;

      try {
        var dataReg = Utilities.formatDate(
          new Date(row[0]),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        );

        // Verificar se encontrou o registro correto
        if (dataReg === dataAntiga &&
            String(row[1]) === tema &&
            String(row[2]) === acao) {

          // Atualizar a data (coluna A, índice da linha é i+1 porque array começa em 0)
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

    if (!encontrado) {
      return {
        status: 'error',
        message: 'Registro não encontrado no DIÁRIO'
      };
    }

    return {
      status: 'success',
      message: 'Data atualizada com sucesso'
    };

  } catch (error) {
    Logger.log('❌ Erro em editarDataRegistroDiario: ' + error.message);
    return {
      status: 'error',
      message: 'Erro ao editar data: ' + error.message
    };
  }
}

/**
 * Remover um registro do DIÁRIO
 */
function removerRegistroDiario(tema, acao, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDiario = ss.getSheetByName('DIÁRIO');

    if (!sheetDiario) {
      return {
        status: 'error',
        message: 'Aba DIÁRIO não encontrada'
      };
    }

    var dataSheet = sheetDiario.getDataRange().getValues();
    var encontrado = false;

    // Procurar e deletar o registro
    for (var i = 1; i < dataSheet.length; i++) {
      var row = dataSheet[i];

      // Pular linhas vazias
      if (!row[0] || !row[1]) continue;

      try {
        var dataReg = Utilities.formatDate(
          new Date(row[0]),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        );

        // Verificar se encontrou o registro correto
        if (dataReg === data &&
            String(row[1]) === tema &&
            String(row[2]) === acao) {

          // Deletar a linha (índice da linha é i+1 porque array começa em 0)
          sheetDiario.deleteRow(i + 1);

          encontrado = true;
          Logger.log('✅ Registro removido: ' + tema + ' - ' + acao + ' - ' + data);
          break;
        }
      } catch (e) {
        Logger.log('Erro ao processar linha ' + (i + 1) + ': ' + e.message);
      }
    }

    if (!encontrado) {
      return {
        status: 'error',
        message: 'Registro não encontrado no DIÁRIO'
      };
    }

    return {
      status: 'success',
      message: 'Registro removido com sucesso'
    };

  } catch (error) {
    Logger.log('❌ Erro em removerRegistroDiario: ' + error.message);
    return {
      status: 'error',
      message: 'Erro ao remover registro: ' + error.message
    };
  }
}

// ==========================================
// ROTEAMENTO HTTP - doGet
// ==========================================

function doGet(e) {
  var action = e.parameter.action;

  // DIÁRIO - GET
  if (action === 'getDiario') {
    return getDiario();
  }

  // DATA ENTRY - GET
  if (action === 'getAllStudySessions') {
    return getAllStudySessions();
  }

  // Ação não reconhecida
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

  // ==========================================
  // DIÁRIO - POST
  // ==========================================

  if (action === 'adicionarRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var data = e.parameter.data;

    var result = adicionarRegistroDiario(tema, acao, data);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'editarDataRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var dataAntiga = e.parameter.dataAntiga;
    var dataNova = e.parameter.dataNova;

    var result = editarDataRegistroDiario(tema, acao, dataAntiga, dataNova);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'removerRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var data = e.parameter.data;

    var result = removerRegistroDiario(tema, acao, data);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ==========================================
  // DATA ENTRY - POST
  // ==========================================

  if (action === 'addStudySession') {
    var date = e.parameter.date;
    var topic = e.parameter.topic;
    var details = e.parameter.details;
    var difficulty = e.parameter.difficulty;
    var isClass = e.parameter.isClass;
    var hasQuestions = e.parameter.hasQuestions;
    var totalQuestions = e.parameter.totalQuestions;
    var correctQuestions = e.parameter.correctQuestions;

    var result = addStudySession(
      date,
      topic,
      details,
      difficulty,
      isClass,
      hasQuestions,
      totalQuestions,
      correctQuestions
    );

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getAllStudySessions') {
    return getAllStudySessions();
  }

  // Ação não reconhecida
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação POST não reconhecida: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNÇÃO DE TESTE
// ==========================================

function testarFuncoesCompleto() {
  Logger.log('=== TESTANDO FUNÇÕES DO SISTEMA COMPLETO ===');

  // Teste 1: Buscar DATA ENTRY
  Logger.log('\n1. Testando getAllStudySessions...');
  var resultado1 = getAllStudySessions();
  Logger.log(resultado1.getContent());

  // Teste 2: Buscar DIÁRIO
  Logger.log('\n2. Testando getDiario...');
  var resultado2 = getDiario();
  Logger.log(resultado2.getContent());

  // Teste 3: Adicionar registro ao DIÁRIO
  Logger.log('\n3. Testando adicionarRegistroDiario...');
  var resultado3 = adicionarRegistroDiario(
    'Teste Tema',
    'Primeira vez',
    '2026-02-15'
  );
  Logger.log(JSON.stringify(resultado3));

  // Teste 4: Adicionar sessão ao DATA ENTRY
  Logger.log('\n4. Testando addStudySession...');
  var hoje = new Date();
  var dataFormatada = Utilities.formatDate(hoje, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  var resultado4 = addStudySession(
    dataFormatada,
    'Teste Tema DATA ENTRY',
    'Primeiro Contato',
    'Médio',
    true,
    false,
    0,
    0
  );
  Logger.log(JSON.stringify(resultado4));

  Logger.log('\n=== TESTES CONCLUÍDOS ===');
}

// ==========================================
// INSTRUÇÕES DE INSTALAÇÃO
// ==========================================

/*
PASSO A PASSO PARA INSTALAR NO GOOGLE APPS SCRIPT:

1. Abra seu Google Sheets
2. Vá em Extensões > Apps Script
3. APAGUE TODO o código existente
4. Cole TODO este arquivo
5. Salve o projeto (Ctrl+S ou Cmd+S)

6. Para testar:
   - Execute a função testarFuncoesCompleto()
   - Veja os logs em Execuções > Ver logs

7. Faça o deploy:
   - Clique em "Implantar" > "Nova implantação"
   - Tipo: "Aplicativo da Web"
   - Executar como: "Eu"
   - Quem tem acesso: "Qualquer pessoa"
   - Clique em "Implantar"
   - Copie a URL da Web App
   - Cole essa URL nas configurações do seu app React

8. IMPORTANTE - Estrutura das Abas:

   ABA "DATA ENTRY":
   | TEMA | DETALHES | DIFICULDADE | AULA | QUESTOES | TOTAL | ACERTOS | DATA |
   |------|----------|-------------|------|----------|-------|---------|------|

   ABA "DIÁRIO":
   | Data       | Tema              | Ação          | Semana |
   |------------|-------------------|---------------|--------|
   | 30/01/2026 | AVC Isquêmico I   | Primeira vez  | 8      |
   | 06/02/2026 | AVC Isquêmico I   | Revisão       | 9      |

9. ATENÇÃO:
   - As abas devem se chamar exatamente "DATA ENTRY" e "DIÁRIO"
   - A primeira linha de cada aba deve ser o cabeçalho
   - Não altere a ordem das colunas

10. TROUBLESHOOTING:
    - Se der erro de permissão, autorize o script
    - Se der erro de aba não encontrada, verifique os nomes exatos
    - Verifique os logs para ver mensagens de erro detalhadas
*/
