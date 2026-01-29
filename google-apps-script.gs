/**
 * Google Apps Script para receber dados do Study Tracker
 *
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código
 * 4. Clique em "Implantar" > "Nova implantação"
 * 5. Tipo: "Aplicativo da Web"
 * 6. Execute como: "Eu (seu email)"
 * 7. Quem tem acesso: "Qualquer pessoa"
 * 8. Clique em "Implantar"
 * 9. Copie a URL e cole nas configurações do app
 */

function doPost(e) {
  try {
    // Abrir a planilha ativa
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Pegar os parâmetros enviados via FormData
    const params = e.parameter;

    // Extrair dados
    const topicId = params.topicId || '';
    const topic = params.topic || '';
    const details = params.details || '';
    const difficulty = params.difficulty || '';
    const isClass = params.isClass === 'true';
    const isQuestions = params.isQuestions === 'true';
    const totalQuestions = parseInt(params.totalQuestions) || 0;
    const correctQuestions = parseInt(params.correctQuestions) || 0;
    const date = params.date || '';

    // Validação: verificar se já existe uma entrada "Primeiro Contato" para este tópico
    if (details === "Primeiro Contato") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) { // Começar em 1 para pular cabeçalho
        const row = data[i];
        // Assumindo que as colunas são: [topicId, topic, details, ...]
        if (row[0] === topicId && row[2] === "Primeiro Contato") {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Já existe um registro de "Primeiro Contato" para este tópico.',
            code: 'DUPLICATE_FIRST_ENTRY'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Preparar linha de dados
    const rowData = [
      topicId,
      topic,
      details,
      difficulty,
      isClass ? 'Sim' : 'Não',
      isQuestions ? 'Sim' : 'Não',
      totalQuestions,
      correctQuestions,
      date,
      new Date() // Timestamp de quando foi salvo
    ];

    // Verificar se a planilha tem cabeçalho, se não, adicionar
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID do Tópico',
        'Tópico',
        'Detalhes',
        'Dificuldade',
        'Assistiu Aula',
        'Fez Questões',
        'Total de Questões',
        'Questões Corretas',
        'Data',
        'Timestamp'
      ]);
    }

    // Adicionar dados
    sheet.appendRow(rowData);

    // Retornar sucesso
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Dados salvos com sucesso!'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Em caso de erro, retornar detalhes
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Erro ao processar: ' + error.toString(),
      code: 'SERVER_ERROR'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função de teste (opcional)
 * Execute esta função para testar se o script está funcionando
 */
function testDoPost() {
  const mockEvent = {
    parameter: {
      topicId: 'test-123',
      topic: 'Teste de Integração',
      details: 'Primeiro Contato',
      difficulty: 'Médio',
      isClass: 'true',
      isQuestions: 'false',
      totalQuestions: '0',
      correctQuestions: '0',
      date: '29/01/2026'
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
