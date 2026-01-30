// ==========================================
// GOOGLE APPS SCRIPT - SISTEMA DE PLANEJAMENTO
// Código para adicionar ao seu Google Apps Script
// ==========================================

/**
 * FUNÇÃO 1: getDiario
 * Buscar todos os registros do DIÁRIO
 * Chamada via GET: ?action=getDiario
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

    // Assumindo estrutura: Data (coluna A) | Tema (coluna B) | Ação (coluna C) | Semana (coluna D)
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
 * FUNÇÃO 2: adicionarRegistroDiario
 * Adicionar novo registro ao DIÁRIO
 * Parâmetros: tema, acao, data
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
    var dataObj = new Date(data);

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
 * FUNÇÃO 3: editarDataRegistroDiario
 * Editar a data de um registro existente
 * Parâmetros: tema, acao, dataAntiga, dataNova
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
          var novaDataObj = new Date(dataNova);
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
 * FUNÇÃO 4: removerRegistroDiario
 * Remover um registro do DIÁRIO
 * Parâmetros: tema, acao, data
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

/**
 * FUNÇÃO 5: Modificar doGet
 * Adicionar suporte para a ação getDiario
 */
function doGet(e) {
  var action = e.parameter.action;

  // Nova ação: getDiario
  if (action === 'getDiario') {
    return getDiario();
  }

  // ... mantenha suas outras ações existentes aqui ...

  // Se nenhuma ação corresponder
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação não reconhecida'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * FUNÇÃO 6: Modificar doPost
 * Adicionar suporte para as novas ações
 */
function doPost(e) {
  var action = e.parameter.action;

  // Nova ação: adicionarRegistroDiario
  if (action === 'adicionarRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var data = e.parameter.data;

    var result = adicionarRegistroDiario(tema, acao, data);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Nova ação: editarDataRegistroDiario
  if (action === 'editarDataRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var dataAntiga = e.parameter.dataAntiga;
    var dataNova = e.parameter.dataNova;

    var result = editarDataRegistroDiario(tema, acao, dataAntiga, dataNova);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Nova ação: removerRegistroDiario
  if (action === 'removerRegistroDiario') {
    var tema = e.parameter.tema;
    var acao = e.parameter.acao;
    var data = e.parameter.data;

    var result = removerRegistroDiario(tema, acao, data);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ... mantenha suas outras ações POST existentes aqui ...

  // Se nenhuma ação corresponder
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Ação não reconhecida'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * FUNÇÃO DE TESTE
 * Testar todas as funções
 */
function testarFuncoesPlanejamento() {
  Logger.log('=== TESTANDO FUNÇÕES DE PLANEJAMENTO ===');

  // Teste 1: Buscar DIÁRIO
  Logger.log('\n1. Testando getDiario...');
  var resultado1 = getDiario();
  Logger.log(resultado1.getContent());

  // Teste 2: Adicionar registro
  Logger.log('\n2. Testando adicionarRegistroDiario...');
  var resultado2 = adicionarRegistroDiario(
    'Teste Tema',
    'Primeira vez',
    '2026-02-15'
  );
  Logger.log(JSON.stringify(resultado2));

  // Teste 3: Editar data
  Logger.log('\n3. Testando editarDataRegistroDiario...');
  var resultado3 = editarDataRegistroDiario(
    'Teste Tema',
    'Primeira vez',
    '2026-02-15',
    '2026-02-20'
  );
  Logger.log(JSON.stringify(resultado3));

  // Teste 4: Remover registro
  Logger.log('\n4. Testando removerRegistroDiario...');
  var resultado4 = removerRegistroDiario(
    'Teste Tema',
    'Primeira vez',
    '2026-02-20'
  );
  Logger.log(JSON.stringify(resultado4));

  Logger.log('\n=== TESTES CONCLUÍDOS ===');
}

// ==========================================
// INSTRUÇÕES DE INSTALAÇÃO
// ==========================================

/*
PASSO A PASSO PARA ADICIONAR AO SEU GOOGLE APPS SCRIPT:

1. Abra seu Google Sheets
2. Vá em Extensões > Apps Script
3. Se você JÁ TEM um arquivo doGet e doPost:
   - Cole apenas as FUNÇÕES 1 a 4 (getDiario, adicionarRegistroDiario, etc.)
   - MODIFIQUE seu doGet existente para incluir o código da FUNÇÃO 5
   - MODIFIQUE seu doPost existente para incluir o código da FUNÇÃO 6

4. Se você NÃO TEM doGet/doPost ainda:
   - Cole TODO este arquivo

5. Salve o projeto (Ctrl+S ou Cmd+S)

6. Para testar:
   - Execute a função testarFuncoesPlanejamento()
   - Veja os logs em Execuções > Ver logs

7. Faça o deploy:
   - Clique em "Implantar" > "Nova implantação"
   - Tipo: "Aplicativo da Web"
   - Executar como: "Eu"
   - Quem tem acesso: "Qualquer pessoa"
   - Clique em "Implantar"
   - Copie a URL da Web App
   - Cole essa URL nas configurações do seu app React

8. IMPORTANTE:
   - Certifique-se que sua aba se chama exatamente "DIÁRIO" (com acento)
   - A estrutura deve ser: Data | Tema | Ação | Semana
   - A linha 1 deve ser o cabeçalho

ESTRUTURA ESPERADA DO DIÁRIO:
-----------------------------
| Data       | Tema              | Ação          | Semana |
|------------|-------------------|---------------|--------|
| 30/01/2026 | AVC Isquêmico I   | Primeira vez  | 8      |
| 06/02/2026 | AVC Isquêmico I   | Revisão 1     | 9      |
| 13/02/2026 | AVC Isquêmico I   | Revisão 2     | 10     |

*/
