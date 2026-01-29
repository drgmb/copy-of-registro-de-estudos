# Solução para o Erro de CORS com Google Apps Script

## O Problema

O erro de CORS estava ocorrendo porque:

1. O navegador envia uma requisição "preflight" (OPTIONS) quando você usa `Content-Type: application/json`
2. O Google Apps Script não responde corretamente ao preflight
3. O navegador bloqueia a requisição real (POST)

## Solução Implementada

✅ Mudamos de **JSON** para **FormData** (URLSearchParams)

### O que foi alterado no código:

**Antes:**
```javascript
const response = await fetch(sheetUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
  signal: controller.signal
});
```

**Depois:**
```javascript
const formData = new URLSearchParams();
formData.append('topicId', data.topicId);
formData.append('topic', data.topic);
// ... outros campos

const response = await fetch(sheetUrl, {
  method: 'POST',
  body: formData,
  signal: controller.signal
});
```

## Passos para Configurar o Google Apps Script

### 1. Abrir o Google Apps Script

1. Abra sua planilha do Google Sheets
2. Vá em **Extensões** > **Apps Script**
3. Delete o código existente (se houver)
4. Cole o código do arquivo `google-apps-script.gs`

### 2. Implantar como Aplicativo da Web

1. Clique no botão **"Implantar"** (canto superior direito)
2. Selecione **"Nova implantação"**
3. Clique no ícone de engrenagem ao lado de "Tipo" e selecione **"Aplicativo da Web"**
4. Configure:
   - **Descrição**: "Study Tracker API"
   - **Executar como**: **Eu (seu email)**
   - **Quem tem acesso**: **Qualquer pessoa** ⚠️ IMPORTANTE
5. Clique em **"Implantar"**
6. **Autorize** o script quando solicitado
7. **Copie a URL** fornecida

### 3. Atualizar Sempre que Modificar o Código

⚠️ **IMPORTANTE**: Toda vez que você modificar o código do Apps Script:

1. Vá em **Implantar** > **Gerenciar implantações**
2. Clique no ícone de lápis (editar) na implantação
3. Em **"Nova versão"**, clique e selecione **"Nova versão"**
4. Clique em **"Implantar"**

Se você **NÃO** criar uma nova versão, as mudanças não serão aplicadas!

### 4. Configurar no App

1. Abra o aplicativo Study Tracker
2. Clique no ícone de **configurações** (engrenagem)
3. Cole a URL copiada do Apps Script
4. Clique em **"Salvar"**

## Testando

1. Tente registrar uma sessão de estudo
2. Se funcionar, você verá a tela de sucesso
3. Verifique sua planilha - os dados devem aparecer lá

## Se Ainda Der Erro

### Erro de CORS persiste:
- Verifique se a implantação está configurada como **"Qualquer pessoa"**
- Crie uma **nova versão** da implantação (passo 3 acima)
- Limpe o cache do navegador (Ctrl+Shift+Delete)

### Erro 403 (Forbidden):
- Certifique-se de ter autorizado o script
- Reimplante com **"Executar como: Eu"**

### Erro de timeout:
- Verifique sua conexão com a internet
- O Google Apps Script pode estar temporariamente indisponível

## Estrutura da Planilha

O script criará automaticamente as seguintes colunas:

| ID do Tópico | Tópico | Detalhes | Dificuldade | Assistiu Aula | Fez Questões | Total de Questões | Questões Corretas | Data | Timestamp |
|--------------|--------|----------|-------------|---------------|--------------|-------------------|-------------------|------|-----------|

## Validações Implementadas

- ✅ Impede duplicação de "Primeiro Contato" para o mesmo tópico
- ✅ Retorna erros formatados em JSON
- ✅ Adiciona timestamp automático

## Por Que Isso Funciona?

Quando você usa **URLSearchParams** (FormData simples):
- O navegador **NÃO** envia preflight request
- O Content-Type é `application/x-www-form-urlencoded` (tipo simples)
- O Google Apps Script recebe os dados via `e.parameter`
- **Sem CORS, sem problemas! 🎉**

## Código Alternativo (se preferir JSON no backend)

Se você **realmente** precisar receber JSON no Apps Script (não recomendado devido ao CORS), você precisaria:

1. Usar um servidor proxy (Vercel Serverless Functions, Cloudflare Workers)
2. O proxy recebe o JSON do frontend
3. O proxy envia FormData para o Apps Script

Mas isso é **muito mais complexo** e desnecessário para este caso.
