# 🔧 Guia de Deployment do Google Apps Script - Correção de CORS

## ⚠️ Problema Atual
```
Access to fetch at 'https://script.google.com/...' from origin 'https://copy-of-registro-de-estudos.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 📋 Causa do Problema

O erro de CORS acontece quando:
1. O Google Apps Script não está deployado como "Web App"
2. O deployment não está configurado para "Anyone" access
3. Há múltiplos deployments com URLs diferentes

## ✅ Solução Passo a Passo

### Passo 1: Abrir o Google Apps Script

1. Acesse sua planilha Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. Você verá o editor do Apps Script

### Passo 2: Substituir TODO o Código

1. **DELETE todo o código existente** no editor
2. Clique no botão **⚙️ Configuração** no app ou copie o código da configuração
3. Cole o novo código completo
4. **Salve** (Ctrl/Cmd + S)

### Passo 3: Deploy Correto (CRÍTICO)

#### 3.1 Deletar Deployments Antigos

1. No Apps Script, clique em **Deploy** → **Manage deployments**
2. **DELETE todos os deployments antigos** (⋮ → Archive)
3. Isso remove as URLs antigas e conflitos de CORS

#### 3.2 Criar Novo Deployment

1. Clique em **Deploy** → **New deployment**
2. Clique no ícone de **⚙️** (configuração) ao lado de "Select type"
3. Escolha **Web app**

#### 3.3 Configurações Essenciais

Configure exatamente assim:

```
┌─────────────────────────────────────────────┐
│ Description: Sistema de Estudos v2          │
│                                             │
│ Execute as: Me (seu-email@gmail.com)       │
│                                             │
│ Who has access: Anyone                     │ ← CRÍTICO!
└─────────────────────────────────────────────┘
```

**IMPORTANTE**:
- ✅ "Execute as" = **Me** (sua conta)
- ✅ "Who has access" = **Anyone** (não "Anyone with Google account")

#### 3.4 Autorizar o Script

1. Clique em **Deploy**
2. Uma janela de autorização aparecerá
3. Clique em **Review permissions**
4. Escolha sua conta Google
5. Clique em **Advanced** (Avançado)
6. Clique em **Go to [nome do projeto] (unsafe)**
7. Clique em **Allow** (Permitir)

#### 3.5 Copiar a Nova URL

1. Após o deployment, copie a **Web app URL**
2. Formato: `https://script.google.com/macros/s/AKfycb.../exec`
3. **Esta é a ÚNICA URL que você deve usar**

### Passo 4: Atualizar URL no App

1. Abra seu app em https://copy-of-registro-de-estudos.vercel.app
2. Clique no botão **⚙️ Configuração**
3. **DELETE a URL antiga**
4. **Cole a NOVA URL** do deployment
5. Clique em **Salvar**

### Passo 5: Verificar Estrutura da Planilha

Certifique-se de que sua planilha tem as seguintes abas:

#### Aba: **DATA ENTRY**
```
A          | B      | C         | D            | E        | F         | G     | H
----------|--------|-----------|--------------|----------|-----------|-------|--------
Data      | Tema   | Detalhes  | Dificuldade  | É Aula?  | Questões? | Total | Corretas
```

#### Aba: **DIÁRIO** (nova - se não existir, crie)
```
A     | B     | C                | D
------|-------|------------------|--------
Data  | Tema  | Ação             | Semana
      |       | "Primeira vez"   | 1-30
      |       | ou "Revisão"     |
```

#### Aba: **CRONOGRAMA** (criada automaticamente)
```
A
--------------------
DADOS_CRONOGRAMA
{json...}
```

### Passo 6: Testar

1. Recarregue o app
2. Teste a aba **HOJE**
3. Teste o **CRONOGRAMA**
4. Não deve mais aparecer erro de CORS

## 🐛 Solução de Problemas

### Erro persiste após deployment?

1. **Limpe o cache do navegador**:
   - Chrome: Ctrl+Shift+Delete → Clear cache
   - Edge: Ctrl+Shift+Delete → Clear cache

2. **Verifique a URL**:
   - A URL deve terminar com `/exec`
   - Deve começar com `https://script.google.com/macros/s/`

3. **Teste a URL diretamente**:
   - Cole no navegador: `sua-url?action=getDiario`
   - Deve retornar JSON (mesmo que vazio): `{"status":"success","data":[]}`

### Múltiplas URLs antigas?

Se você tem URLs antigas salvas:
1. Vá em **Deploy** → **Manage deployments**
2. **Archive TODOS** os deployments antigos
3. Crie **apenas UM** novo deployment
4. Use **apenas essa URL** no app

### "Permission denied" ou "Authorization required"?

1. O deployment deve ser "Execute as: **Me**"
2. "Who has access" deve ser "**Anyone**" (não "Anyone with Google account")
3. Re-autorize o script (Passo 3.4)

## 📝 Checklist Final

Antes de considerar concluído, verifique:

- [ ] Todo código antigo foi deletado
- [ ] Novo código foi colado e salvo
- [ ] Deployments antigos foram arquivados
- [ ] Novo deployment criado como "Web app"
- [ ] "Execute as" = Me
- [ ] "Who has access" = Anyone
- [ ] Script foi autorizado
- [ ] Nova URL foi copiada
- [ ] URL foi atualizada no app
- [ ] Aba DIÁRIO existe na planilha
- [ ] Cache do navegador foi limpo
- [ ] App foi testado e funciona

## 🎯 Resultado Esperado

Após seguir todos os passos:

✅ Aba **HOJE** carrega sem erros
✅ Aba **CRONOGRAMA** salva dados
✅ Sem erro de CORS no console
✅ Sem "Invalid time value"
✅ Sem "Failed to fetch"

---

**Dica**: Salve a URL do deployment em um local seguro. Se precisar re-deployar no futuro, sempre delete o antigo primeiro.
