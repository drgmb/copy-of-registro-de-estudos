# 🔍 Debug do Cronograma - Guia de Diagnóstico

## 🎯 Nova Abordagem Implementada

A nova versão do cronograma inclui **logs detalhados** e um **painel de debug visual** para identificar problemas de forma rápida.

## 📊 Recursos de Debug

### 1. Painel de Debug Visual (na Interface)

Ao abrir a aba **Cronograma**, você verá um painel amarelo no topo com:

- ✅ Total de Semanas carregadas
- ✅ Temas Carregados do CSV
- ✅ Temas Estudados (encontrados em DATA ENTRY)
- ✅ Temas Migrados (mudaram de semana)
- ✅ Última Atualização do cronograma

**Como usar:**
1. Abra a aba Cronograma
2. Veja o painel amarelo "🔍 Painel de Debug"
3. Clique em "Atualizar" para recarregar os dados
4. Observe os números atualizarem

### 2. Console do Navegador (F12)

Logs detalhados aparecem no console com prefixos coloridos:

```
🔍 [DEBUG] Processando DATA ENTRY: X registros
🔍 [DEBUG] Processando DIÁRIO: Y registros
✅ Tema encontrado: "Nome do Tema" -> ID: 123, Data: 2026-01-27
⚠️ Tema não encontrado no mapa: "Nome Digitado Errado"
📅 Início da Semana 1: 2026-01-26
📍 Tema ID 123 (Nome): { dataEstudo, semanaCalculada, precisaMigrar }
🔄 MIGRAÇÃO: Tema "X" da semana 10 → 1
📊 [RESUMO] Processamento concluído
```

## 🐛 Diagnóstico de Problemas

### Problema 1: "Tema não aparece como estudado"

**Como diagnosticar:**

1. Abra o Console (F12)
2. Clique em "Atualizar" no cronograma
3. Procure por `⚠️ Tema não encontrado no mapa: "Nome"`

**Solução:**
- O nome em DATA ENTRY deve ser **exatamente igual** ao CSV
- **Case-sensitive**: "Avc isquêmico" ≠ "AVC Isquêmico"
- Verifique espaços extras, acentos, caracteres especiais

**Exemplo:**
```
CSV: "AVC Isquêmico 1"
DATA ENTRY (correto): "AVC Isquêmico 1"
DATA ENTRY (errado): "avc isquemico 1"
```

### Problema 2: "Tema não migrou para a semana correta"

**Como diagnosticar:**

1. Abra o Console (F12)
2. Procure por `📅 Início da Semana 1:`
3. Verifique se a data está correta (deve ser o domingo mais recente)
4. Procure por `📍 Tema ID X:` para ver o cálculo de semana

**Verificar:**
- Data de estudo em DATA ENTRY está em formato DD/MM/YYYY?
- A conversão para ISO está funcionando?
- O cálculo de semana está correto?

**Exemplo de log esperado:**
```
📅 Início da Semana 1: 2026-01-26 (hoje: 2026-01-30, dia da semana: 4)
📍 Tema ID 123 (AVC Isquêmico 1): {
  dataEstudo: "2026-01-27",
  diffDias: 1,
  semanaCalculada: 1,
  semanaOriginal: 10,
  precisaMigrar: true
}
🔄 MIGRAÇÃO: Tema "AVC Isquêmico 1" da semana 10 → 1
```

### Problema 3: "Nenhum tema foi carregado"

**Como diagnosticar:**

1. Verifique o Painel de Debug: "Temas Carregados" deve ser > 0
2. Console: `🔍 [DEBUG] Processando DATA ENTRY: X registros`

**Possíveis causas:**
- Google Apps Script não está retornando dados
- URL da planilha está incorreta
- Aba DATA ENTRY não tem dados

### Problema 4: "Datas não estão sendo convertidas corretamente"

**Como verificar:**

1. Console: Procure por `✅ Tema encontrado:` e veja a `Data:` exibida
2. Deve estar em formato ISO: `2026-01-27` (YYYY-MM-DD)
3. Se aparecer `27/01/2026`, a conversão **não está funcionando**

**Solução:**
- Verificar se `converterDDMMYYYYparaISO()` está sendo chamada
- Logs devem mostrar data convertida

## 📋 Checklist de Verificação

Antes de abrir um chamado, verifique:

- [ ] Console aberto (F12) enquanto carrega o cronograma
- [ ] Painel de Debug visível
- [ ] Botão "Atualizar" foi clicado após adicionar dados em DATA ENTRY
- [ ] Nomes dos temas em DATA ENTRY correspondem **exatamente** aos do CSV
- [ ] Datas em DATA ENTRY estão no formato DD/MM/YYYY
- [ ] Início da Semana 1 está correto no console (domingo mais recente)
- [ ] Logs de migração aparecem quando esperado

## 🔧 Comandos Úteis no Console

Abra o Console (F12) e execute:

```javascript
// Ver todos os temas estudados
console.table(
  cronograma.semanas
    .flatMap(s => s.temas)
    .filter(t => t.estudado)
    .map(t => ({
      nome: t.nome,
      semanaOriginal: t.semanaOriginal,
      semanaAtual: t.semanaAtual,
      primeiraVez: t.primeiraVisualizacao
    }))
);

// Ver todos os temas migrados
console.table(
  cronograma.semanas
    .flatMap(s => s.temas)
    .filter(t => t.semanaAtual !== t.semanaOriginal)
    .map(t => ({
      nome: t.nome,
      de: t.semanaOriginal,
      para: t.semanaAtual
    }))
);
```

## 📞 Suporte

Se após seguir este guia o problema persistir:

1. **Copie todos os logs do Console** (F12 → clique direito → "Salvar como...")
2. **Tire uma screenshot** do Painel de Debug
3. **Liste os nomes exatos** dos temas que não estão funcionando (copie de DATA ENTRY)
4. **Forneça as datas** desses estudos

## ✅ Próximos Passos

1. **Deploy** do novo build para Vercel
2. **Abra a aba Cronograma**
3. **Veja o Painel de Debug** (deve aparecer automaticamente)
4. **Abra o Console** (F12)
5. **Clique em "Atualizar"**
6. **Leia os logs** e identifique o problema

---

**Boa sorte! 🩺📚**
