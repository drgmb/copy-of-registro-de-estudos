# 🔧 INTEGRAÇÃO DO CÓDIGO DE PLANEJAMENTO NO GOOGLE APPS SCRIPT

## ⚠️ IMPORTANTE
Este guia mostra como adicionar as novas funções de planejamento ao seu Google Apps Script EXISTENTE, sem quebrar as funções antigas do DATA ENTRY.

## 📋 Passo a Passo

### 1️⃣ Abra seu Google Apps Script
1. Abra sua planilha Google Sheets
2. Vá em **Extensões > Apps Script**
3. Você verá seu código existente com funções como `doGet()`, `doPost()`, `addStudySession()`, etc.

### 2️⃣ Adicione as FUNÇÕES AUXILIARES (no final do arquivo)

Cole estas funções **NO FINAL** do seu arquivo, antes do último `}`:

```javascript
// ==========================================
// FUNÇÕES DE PLANEJAMENTO - DIÁRIO
// ==========================================

/**
 * FUNÇÃO AUXILIAR: Converter string YYYY-MM-DD ou ISO completo para Date
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
```

### 3️⃣ Modifique sua função doGet() EXISTENTE

Encontre sua função `doGet()` e **ADICIONE** este trecho **ANTES** do `return` final:

```javascript
function doGet(e) {
  var action = e.parameter.action;

  // ⬇️ ADICIONE ESTA PARTE AQUI ⬇️
  // Nova ação: getDiario
  if (action === 'getDiario') {
    return getDiario();
  }
  // ⬆️ FIM DA PARTE ADICIONADA ⬆️

  // ... seu código existente continua aqui ...
  // (addStudySession, etc.)
}
```

### 4️⃣ Modifique sua função doPost() EXISTENTE

Encontre sua função `doPost()` e **ADICIONE** este trecho **ANTES** do `return` final:

```javascript
function doPost(e) {
  var action = e.parameter.action;

  // ⬇️ ADICIONE ESTA PARTE AQUI ⬇️
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
  // ⬆️ FIM DA PARTE ADICIONADA ⬆️

  // ... seu código existente continua aqui ...
  // (addStudySession, etc.)
}
```

### 5️⃣ Salve e Reimplante

1. Clique em **Salvar** (ícone de disquete ou Ctrl+S)
2. Clique em **Implantar > Gerenciar implantações**
3. Clique no ícone de **lápis** (editar) na implantação ativa
4. Em "Versão", selecione **Nova versão**
5. Clique em **Implantar**

## ✅ Verificação

Após fazer as alterações:

1. **Teste adicionar um tema** no calendário de planejamento
2. **Verifique a aba DIÁRIO** - o registro deve aparecer lá
3. **Verifique a aba DATA ENTRY** - NÃO deve aparecer registro vazio

## 🐛 Troubleshooting

Se ainda aparecer registros vazios no DATA ENTRY:

1. Verifique se você adicionou os `if` das novas actions **ANTES** do código antigo no `doPost()`
2. Verifique os logs do Apps Script: **Execuções > Ver logs**
3. Procure por mensagens como "✅ Registro adicionado" ou "❌ Erro"

## 📝 Estrutura Esperada do DIÁRIO

```
| Data       | Tema                    | Ação          | Semana |
|------------|-------------------------|---------------|--------|
| 30/01/2026 | AVC Isquêmico I         | Primeira vez  | 8      |
| 06/02/2026 | AVC Isquêmico I         | Revisão       | 9      |
```
