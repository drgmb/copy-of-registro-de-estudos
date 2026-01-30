# 🚨 Resolver Problema do Cronograma - URGENTE

## 🎯 Dados Chegam mas Não Aparecem

Você confirmou que os dados estão chegando no network:
```json
{
  "date":"2026-01-30T03:00:00.000Z",
  "topic":"AVC Isquêmico 1",
  "difficulty":"Médio",
  ...
}
```

Mas os temas não aparecem no cronograma. **Agora temos logs super detalhados para identificar o problema.**

## 📋 FAÇA AGORA (Passo a Passo)

### 1. Deploy do Novo Build
- Já foi feito o build com logs detalhados
- Deploy para Vercel

### 2. Abrir Console e Testar
1. **Abra o site**
2. **Abra o Console** (F12)
3. **Vá na aba Cronograma**
4. **Clique em "Atualizar"**

### 3. Analisar os Logs

Você verá logs assim no console:

#### ✅ **Se aparecer:**
```
🔍 [DEBUG] Dados brutos do DATA ENTRY: [...]
✅ Tema encontrado: "AVC Isquêmico 1" -> ID: 123, Data: 2026-01-30
🎯 Dificuldade: "Médio" → 3
🔄 MIGRAÇÃO: Tema "AVC Isquêmico 1" da semana 10 → 1
```
→ **FUNCIONOU!** O tema será exibido na semana correta

#### ⚠️ **Se aparecer:**
```
⚠️ Tema não encontrado no mapa: "AVC Isquêmico 1"
💡 Nomes parecidos encontrados: ["AVC Isquemico 1", "AVC Isquêmico I", ...]
```
→ **PROBLEMA DE NOME** - O nome em DATA ENTRY não bate com o CSV

## 🔍 Problemas Identificados e Soluções

### Problema 1: Nome do Tema Não Bate
**Sintoma:** `⚠️ Tema não encontrado no mapa: "AVC Isquêmico 1"`

**Causa:** Nome em DATA ENTRY difere do CSV:
- Espaços diferentes
- Acentuação diferente ("ê" vs "e")
- Capitalização diferente ("AVC" vs "Avc")

**Solução:**
1. Veja os "Nomes parecidos" sugeridos no log
2. Copie o nome EXATO do log de sugestão
3. Use esse nome no DATA ENTRY

**Exemplo:**
- CSV tem: `"AVC Isquêmico 1"`
- Você digitou: `"Avc isquemico 1"` ❌
- Correto: `"AVC Isquêmico 1"` ✅

### Problema 2: Dificuldade como Texto
**Antes:** `difficulty: "Médio"` causava erro

**Agora:** ✅ Converte automaticamente:
- "Muito Fácil" / "Muito Facil" → 1
- "Fácil" / "Facil" → 2
- "Médio" / "Medio" → 3
- "Difícil" / "Dificil" → 4
- "Muito Difícil" / "Muito Dificil" → 5

### Problema 3: Data com Timezone
**Antes:** Data vinha como `2026-01-30T03:00:00.000Z` e podia mudar de dia

**Agora:** Logs mostram:
```
🕐 Data processamento: {
  original: "2026-01-30T03:00:00.000Z",
  antesZerar: "2026-01-30",
  depoisZerar: "2026-01-30",
  timezone: "America/Sao_Paulo"
}
```

Se a data mudar entre `antesZerar` e `depoisZerar`, há problema de timezone.

## 📊 Interpretando os Logs

### Log Completo Esperado
```
🔍 [DEBUG] Processando DATA ENTRY: 2 registros
🔍 [DEBUG] Dados brutos: [objeto com todos os dados]
🔍 [DEBUG] NOME_PARA_ID disponível: ["AVC Isquêmico 1", ...] (652 total)

🔍 [DEBUG] Registro 1: {
  topic: "AVC Isquêmico 1",
  date: "2026-01-30",
  difficulty: "Médio",
  isClass: true
}

✅ Tema encontrado: "AVC Isquêmico 1" -> ID: 123, Data: 2026-01-30
🎯 Dificuldade: "Médio" → 3

📅 Início da Semana 1: 2026-01-26 (hoje: 2026-01-30, dia: 4)

📍 Tema ID 123 (AVC Isquêmico 1): {
  dataEstudo: "2026-01-30",
  diffDias: 4,
  semanaCalculada: 1,
  semanaOriginal: 10,
  precisaMigrar: true
}

🔄 MIGRAÇÃO: Tema "AVC Isquêmico 1" da semana 10 → 1

📊 [RESUMO] Processamento concluído: {
  temasComProgresso: 1,
  temasNaoEncontrados: "Nenhum"
}
```

### Se Não Funcionar

#### Cenário A: Tema Não Encontrado
```
⚠️ Tema não encontrado no mapa: "AVC Isquêmico 1"
💡 Nomes parecidos: ["AVC Isquemico 1", "AVC Isquêmico I"]
```
→ Use um dos nomes sugeridos

#### Cenário B: Semana Inválida
```
⚠️ Semana inválida calculada: 35 para data 2026-01-30
```
→ Data muito antiga ou futura (fora das 30 semanas)

#### Cenário C: Nenhum Registro Processado
```
🔍 [DEBUG] Processando DATA ENTRY: 0 registros
```
→ Google Apps Script não está retornando dados

## 🆘 Se Ainda Não Funcionar

**Copie TODOS os logs do console** e me envie:

1. Aperte F12
2. Clique com botão direito no console
3. "Salvar como..." → salve como TXT
4. Ou copie e cole todos os logs

**Também envie:**
- Screenshot do Painel de Debug (caixa amarela)
- Nome EXATO do tema que você registrou em DATA ENTRY
- Print da linha do DATA ENTRY na planilha

## 💡 Dica Rápida

**O log mais importante é:**
```
✅ Tema encontrado: "..." -> ID: ..., Data: ...
```

Se você VER esse log, o tema SERÁ processado. Se NÃO ver, há problema de nome.

---

**Deploy agora e veja os logs! Eles vão revelar exatamente o problema.** 🔍
