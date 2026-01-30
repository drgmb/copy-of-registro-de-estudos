# 🚨 GUIA DEFINITIVO - Resolver CORS do Google Apps Script

## ⚠️ ERRO ATUAL
```
Access to fetch at 'https://script.google.com/...' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🎯 CAUSA RAIZ
O Google Apps Script só adiciona o cabeçalho CORS automaticamente quando:
1. O deployment é **WEB APP** (não Macro ou Add-on)
2. "Who has access" está configurado como **"Anyone"** (não "Anyone with Google account")
3. Você está usando a **URL CORRETA** do deployment mais recente

## ✅ SOLUÇÃO COMPLETA (Siga EXATAMENTE nesta ordem)

### PASSO 1: Deletar TODOS os Deployments Antigos

**Por que?** Deployments antigos têm URLs diferentes e podem causar conflito.

1. Abra sua planilha Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. No menu lateral, clique em **Deploy** → **Manage deployments**
4. Para CADA deployment listado:
   - Clique nos 3 pontinhos (⋮)
   - Clique em **Archive** (Arquivar)
5. Confirme que a lista ficou VAZIA

### PASSO 2: Verificar o Código do Apps Script

Cole este código COMPLETO no editor (substitua TODO o código existente):

```javascript
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;

    // Handlers de LEITURA (novos)
    if (action === 'getCronogramaCompleto') {
      const result = getCronogramaCompleto(ss);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getDiario') {
      const result = getDiario(ss);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAllStudySessions') {
      const result = getAllStudySessions(ss);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handler de ESCRITA (salvar cronograma)
    if (action === 'saveCronogramaCompleto') {
      const data = JSON.parse(e.parameter.data);
      const result = salvarCronogramaCompleto(ss, data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handler de registro de estudos (já existente)
    if (action === 'addStudySession') {
      const session = {
        date: e.parameter.date,
        topic: e.parameter.topic,
        details: e.parameter.details || '',
        difficulty: e.parameter.difficulty || '',
        isClass: e.parameter.isClass === 'true',
        hasQuestions: e.parameter.hasQuestions === 'true',
        totalQuestions: parseInt(e.parameter.totalQuestions) || 0,
        correctQuestions: parseInt(e.parameter.correctQuestions) || 0
      };
      const result = addStudySession(ss, session);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ação desconhecida
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Ação desconhecida: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para obter cronograma completo
function getCronogramaCompleto(ss) {
  try {
    const sheet = ss.getSheetByName('CRONOGRAMA');
    if (!sheet) {
      return { status: 'success', data: null };
    }

    const data = sheet.getRange('A1').getValue();
    if (!data) {
      return { status: 'success', data: null };
    }

    return { status: 'success', data: JSON.parse(data) };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Função para salvar cronograma completo
function salvarCronogramaCompleto(ss, cronogramaData) {
  try {
    let sheet = ss.getSheetByName('CRONOGRAMA');

    if (!sheet) {
      sheet = ss.insertSheet('CRONOGRAMA');
    }

    sheet.getRange('A1').setValue(JSON.stringify(cronogramaData));

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Função para obter diário
function getDiario(ss) {
  try {
    const sheet = ss.getSheetByName('DIÁRIO');
    if (!sheet) {
      return { status: 'success', data: [] };
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return { status: 'success', data: [] };
    }

    const diario = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Validar data
      let dataISO;
      try {
        if (row[0] instanceof Date) {
          dataISO = row[0].toISOString();
        } else {
          const dateObj = new Date(row[0]);
          if (isNaN(dateObj.getTime())) {
            continue; // Pular linhas com data inválida
          }
          dataISO = dateObj.toISOString();
        }
      } catch (e) {
        continue; // Pular em caso de erro
      }

      if (row[1]) { // Tem tema
        diario.push({
          data: dataISO,
          tema: row[1].toString(),
          acao: row[2] ? row[2].toString() : '',
          semana: row[3] ? parseInt(row[3]) : 0
        });
      }
    }

    return { status: 'success', data: diario };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Função para obter todas as sessões de estudo
function getAllStudySessions(ss) {
  try {
    const sheet = ss.getSheetByName('DATA ENTRY');
    if (!sheet) {
      return { status: 'success', data: [] };
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return { status: 'success', data: [] };
    }

    const sessions = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Validar data
      let dataISO;
      try {
        if (row[0] instanceof Date) {
          dataISO = row[0].toISOString();
        } else {
          const dateObj = new Date(row[0]);
          if (isNaN(dateObj.getTime())) {
            continue;
          }
          dataISO = dateObj.toISOString();
        }
      } catch (e) {
        continue;
      }

      if (row[1]) { // Tem tema
        sessions.push({
          date: dataISO,
          topic: row[1].toString(),
          details: row[2] ? row[2].toString() : '',
          difficulty: row[3] ? row[3].toString() : '',
          isClass: row[4] === true || row[4] === 'true' || row[4] === 'TRUE',
          hasQuestions: row[5] === true || row[5] === 'true' || row[5] === 'TRUE',
          totalQuestions: row[6] ? parseInt(row[6]) : 0,
          correctQuestions: row[7] ? parseInt(row[7]) : 0
        });
      }
    }

    return { status: 'success', data: sessions };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// Função para adicionar sessão de estudo
function addStudySession(ss, session) {
  try {
    let sheet = ss.getSheetByName('DATA ENTRY');

    if (!sheet) {
      sheet = ss.insertSheet('DATA ENTRY');
      sheet.appendRow([
        'Data', 'Tema', 'Detalhes', 'Dificuldade',
        'É Aula?', 'Questões?', 'Total', 'Corretas'
      ]);
    }

    sheet.appendRow([
      new Date(session.date),
      session.topic,
      session.details,
      session.difficulty,
      session.isClass,
      session.hasQuestions,
      session.totalQuestions,
      session.correctQuestions
    ]);

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}
```

**IMPORTANTE**: Após colar, pressione **Ctrl+S** (ou Cmd+S no Mac) para SALVAR.

### PASSO 3: Criar NOVO Deployment (CRÍTICO)

1. No Apps Script, clique em **Deploy** → **New deployment**
2. Clique no ícone de **⚙️** (engrenagem) ao lado de "Select type"
3. Escolha **Web app**
4. Configure EXATAMENTE assim:

```
Description: Sistema de Estudos CORS Fix

Execute as: Me (seu-email@gmail.com)

Who has access: Anyone  ← DEVE SER "Anyone" (não "Anyone with Google account")
```

5. Clique em **Deploy**

### PASSO 4: Autorizar (Se Necessário)

Se aparecer tela de autorização:
1. Clique em **Review permissions**
2. Escolha sua conta Google
3. Clique em **Advanced** (Avançado)
4. Clique em **Go to [nome do projeto] (unsafe)**
5. Clique em **Allow** (Permitir)

### PASSO 5: Copiar a URL CORRETA

1. Após deployment bem-sucedido, aparecerá uma tela com **Web app URL**
2. **COPIE TODA A URL** (deve terminar com `/exec`)
3. Exemplo: `https://script.google.com/macros/s/AKfycb.../exec`

**⚠️ ATENÇÃO**: Esta é a ÚNICA URL que você deve usar. NÃO use URLs antigas!

### PASSO 6: Atualizar URL no App

1. Abra https://copy-of-registro-de-estudos.vercel.app
2. Clique no botão **⚙️** (Configuração)
3. **DELETE completamente** a URL antiga
4. **Cole a NOVA URL** que você copiou no Passo 5
5. Clique em **Salvar**
6. **Recarregue a página** (F5 ou Ctrl+R)

### PASSO 7: Testar

1. Abra o Console do navegador (F12)
2. Vá na aba **Console**
3. Limpe o console (ícone de 🚫 ou clear)
4. Tente usar o cronograma
5. Verifique se não há erros de CORS

## 🐛 Se o Erro AINDA Persistir

### Teste a URL Diretamente

Cole no navegador:
```
SUA_URL_AQUI?action=getDiario
```

**Resultado esperado**: Deve mostrar JSON (mesmo que vazio):
```json
{"status":"success","data":[]}
```

**Se aparecer erro 404 ou "Script function not found"**: Você está usando a URL errada.

### Verificar Deployment

1. Vá em **Deploy** → **Manage deployments**
2. Deve ter APENAS 1 deployment ativo
3. Clique no ícone de lápis (editar)
4. Verifique se "Who has access" está **"Anyone"** (não "Anyone with Google account")

### Limpar Cache do Navegador

Às vezes o navegador cacheia a URL antiga:
1. Pressione **Ctrl+Shift+Delete** (ou Cmd+Shift+Delete no Mac)
2. Marque "Cached images and files"
3. Clique em "Clear data"
4. Recarregue o app

## ✅ Checklist Final

Antes de considerar resolvido:

- [ ] Todos os deployments antigos foram arquivados
- [ ] Código do Apps Script foi atualizado e SALVO
- [ ] Novo deployment criado como "Web app"
- [ ] "Execute as" = **Me**
- [ ] "Who has access" = **Anyone** (não "Anyone with Google account")
- [ ] Script foi autorizado (se solicitado)
- [ ] Nova URL foi copiada (termina com /exec)
- [ ] URL antiga foi deletada do app
- [ ] Nova URL foi salva no app
- [ ] Página foi recarregada
- [ ] Testado no console sem erros de CORS

## 🎯 Por Que Isso Funciona?

O Google Apps Script adiciona automaticamente o cabeçalho `Access-Control-Allow-Origin: *` APENAS quando:
1. É um Web App deployment
2. Configurado como "Anyone"
3. Retorna `ContentService.createTextOutput()`

Sem essas 3 condições, o navegador bloqueia a requisição com erro de CORS.
