# 📚 Sistema de Revisões com Ajuste Propagado

## 🎯 Visão Geral

O sistema agora ajusta **TODAS as revisões futuras** quando:
1. **Resultado de questões** indica necessidade de ajuste
2. **Revisão feita antecipada ou atrasada** em relação à data programada

## 🔄 Como Funciona

### 1. Ajuste por Performance (Resultado de Questões)

Baseado no percentual de acerto, os intervalos de TODAS as revisões futuras são ajustados:

| Percentual de Acerto | Fator de Ajuste | Exemplo (7 dias) |
|---------------------|-----------------|------------------|
| ≥ 90% (Excelente) | +25% | 7 → 9 dias |
| 80-89% (Bom) | +10% | 7 → 8 dias |
| 70-79% (Médio) | 0% | 7 → 7 dias |
| 60-69% (Regular) | -15% | 7 → 6 dias |
| < 60% (Ruim) | -30% | 7 → 5 dias |

**Exemplo Prático:**

```
Intervalos Padrão: [1, 7, 15, 30, 60, 90] dias

Você faz Revisão 2 e acerta 92% das questões:
✅ Todos os intervalos aumentam 25%
Novos Intervalos: [1, 9, 19, 38, 75, 113] dias

Resultado:
• Revisão 3: 15 dias → 19 dias
• Revisão 4: 30 dias → 38 dias
• Revisão 5: 60 dias → 75 dias
• Revisão 6: 90 dias → 113 dias
```

### 2. Ajuste Temporal (Antecipação/Atraso)

Quando você faz uma revisão X dias antes ou depois da data programada, **TODAS as revisões futuras** são ajustadas pelo mesmo valor.

**Exemplo 1: Antecipação**

```
Revisão 2 programada: 10/02/2026
Você fez: 07/02/2026 (3 dias ANTES)

Todas as revisões futuras são ANTECIPADAS em 3 dias:
• Revisão 3: 25/02 → 22/02
• Revisão 4: 27/03 → 24/03
• Revisão 5: 26/05 → 23/05
```

**Exemplo 2: Atraso**

```
Revisão 3 programada: 22/02/2026
Você fez: 28/02/2026 (6 dias DEPOIS)

Todas as revisões futuras são ADIADAS em 6 dias:
• Revisão 4: 24/03 → 30/03
• Revisão 5: 23/05 → 29/05
• Revisão 6: 21/08 → 27/08
```

### 3. Ajuste Combinado (Performance + Temporal)

Quando ambos os ajustes se aplicam:

```
Revisão 2:
• Programada: 10/02/2026
• Realizada: 12/02/2026 (2 dias atrasada)
• Performance: 88% de acerto

Processamento:
1️⃣ Ajuste temporal aplicado: +2 dias em TODAS as revisões
2️⃣ Intervalos ajustados por performance: +10% (88%)
3️⃣ Revisões recalculadas com novos intervalos a partir da data realizada (12/02)

Resultado:
Intervalos: [1, 7, 15, 30, 60, 90] → [1, 8, 17, 33, 66, 99] (+10%)

• Revisão 3: 27/02 → 20/02 (12/02 + 8 dias)
• Revisão 4: 29/03 → 09/03 (20/02 + 17 dias)
• Revisão 5: 28/05 → 12/04 (09/03 + 33 dias)
• ...
```

## 🛠️ Implementação Técnica

### Funções Principais

#### 1. `calcularFatorAjuste(percentualAcerto)`
Determina o fator de multiplicação baseado na performance.

#### 2. `ajustarIntervalosPorPerformance(intervalos, resultado)`
Aplica o fator a todos os intervalos.

#### 3. `aplicarAjusteTemporalEmTodasRevisoes(revisoes, index, ajuste)`
Propaga ajuste temporal para todas as revisões futuras.

#### 4. `recalcularRevisoesFuturasComNovosIntervalos(revisoes, index, intervalos, dataBase)`
Recalcula datas de todas as revisões futuras com novos intervalos.

#### 5. `processarRevisaoComAjustes(revisoes, index, dataRealizacao, resultado)`
Função principal que combina ambos os ajustes.

### Fluxo de Processamento

```typescript
import {
  processarRevisaoComAjustes,
  ResultadoQuestoes
} from './utils/revisoesUtils';

// Quando uma revisão é realizada
const resultado: ResultadoQuestoes = {
  total: 20,
  corretas: 18,
  percentualAcerto: 90
};

const {
  novasRevisoes,
  intervalosAjustados,
  log
} = processarRevisaoComAjustes(
  revisoesProgramadas,  // Array de revisões do tema
  1,                     // Index da revisão realizada (0-based)
  '2026-02-12',         // Data em que foi realizada
  resultado             // Resultado das questões (opcional)
);

// novasRevisoes contém TODAS as revisões com datas atualizadas
// intervalosAjustados contém os novos intervalos calculados
// log contém mensagens descrevendo as mudanças
```

## 📊 Intervalos Padrão

```typescript
export const INTERVALOS_PADRAO = [1, 7, 15, 30, 60, 90]; // dias
```

Você pode customizar os intervalos conforme sua estratégia de estudo.

## 🔍 Logs e Debug

O sistema gera logs detalhados durante o processamento:

```
📅 Ajuste temporal detectado: -3 dias (antecipou)
  ✅ Revisão 3: 2026-02-25 → 2026-02-22
  ✅ Revisão 4: 2026-03-27 → 2026-03-24
  ✅ Revisão 5: 2026-05-26 → 2026-05-23

📊 Recalculando revisões futuras com novos intervalos: [1, 9, 19, 38, 75, 113]
  ✅ Revisão 3: 2026-02-22 → 2026-02-16 (+9 dias)
  ✅ Revisão 4: 2026-03-24 → 2026-03-07 (+19 dias)
  ✅ Revisão 5: 2026-05-23 → 2026-04-14 (+38 dias)
```

## 🎮 Como Usar no App

### Ao Registrar uma Revisão:

1. **Vá na aba "Registrar"**
2. **Selecione o tema**
3. **Escolha "Revisão" em Detalhes**
4. **Marque "Fiz Questões"** (se aplicável)
5. **Informe total e acertos**
6. **Clique em "Registrar"**

O sistema automaticamente:
- ✅ Detecta se é revisão
- ✅ Verifica se foi feita na data programada
- ✅ Calcula ajuste temporal (se houver)
- ✅ Calcula ajuste por performance (se houver questões)
- ✅ **Propaga ajustes para TODAS as revisões futuras**
- ✅ Atualiza o DIÁRIO com as novas datas

## 📈 Benefícios

### 1. **Aprendizado Otimizado**
- Se você está indo bem (>90%), aumenta automaticamente os intervalos
- Se está com dificuldade (<60%), reduz os intervalos para reforçar

### 2. **Flexibilidade**
- Fez a revisão alguns dias antes? O sistema ajusta tudo automaticamente
- Atrasou a revisão? Sem problema, todas as futuras são ajustadas

### 3. **Consistência**
- Não precisa recalcular manualmente cada revisão
- O sistema garante que todas as revisões futuras sejam consistentes

### 4. **Adaptativo**
- O sistema se adapta continuamente ao seu desempenho
- Cada revisão refina ainda mais os intervalos futuros

## ⚠️ Considerações

- Os ajustes são **cumulativos**: cada revisão pode ajustar novamente
- Ajustes temporais são aplicados **antes** dos ajustes de performance
- O sistema sempre arredonda para dias inteiros
- Intervalos mínimos são respeitados (nunca < 1 dia)

## 🔄 Integração com Google Sheets

O sistema salva no DIÁRIO:
- Datas atualizadas de todas as revisões
- Intervalos ajustados em uma coluna separada
- Log de mudanças no ChangeLog

**Estrutura no DIÁRIO:**

| Data | Tema | Ação | Semana | Intervalos Ajustados | Motivo do Ajuste |
|------|------|------|--------|---------------------|------------------|
| 2026-02-20 | Tema X | Revisão 3 | 8 | [1, 9, 19, 38] | Performance: 92% |
| 2026-03-11 | Tema X | Revisão 4 | 11 | [1, 9, 19, 38] | - |

## 🚀 Próximos Passos

Para começar a usar o sistema:

1. **Faça o deploy** do novo código
2. **Registre uma revisão** com questões
3. **Observe os logs** no console (F12)
4. **Verifique o DIÁRIO** para ver as mudanças propagadas
5. **Confira o ChangeLog** para histórico completo

---

**Boa sorte nos estudos! O sistema agora se adapta continuamente ao seu aprendizado! 🧠📚**
