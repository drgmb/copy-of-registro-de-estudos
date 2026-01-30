# 📋 Como Popular a Aba CRONOGRAMA

## Estrutura da Aba CRONOGRAMA

Você precisa ter esta estrutura:

```
| ID | TEMA | COR | SEMANA_ORIGINAL |
|----|------|-----|-----------------|
| 1  | Anatomia Cardiovascular | VERDE | 1 |
| 2  | Fisiologia Cardíaca | AMARELO | 1 |
...
| 645 | Emergências Pediátricas | VERMELHO | 30 |
```

## Opção 1: Popular Manualmente (Recomendado para Teste)

Adicione alguns temas de teste primeiro:

```
ID | TEMA | COR | SEMANA_ORIGINAL
1 | Cardiologia Básica | VERDE | 1
2 | Anatomia Cardiovascular | AMARELO | 1
3 | Fisiologia Cardíaca | VERDE | 1
4 | Eletrocardiografia | VERMELHO | 2
5 | Hipertensão Arterial | VERDE | 2
```

## Opção 2: Usar Código do App (Automático)

O app tem 645 temas no arquivo `temasColors.ts`. Você pode exportá-los:

1. No app, vá em **Cronograma**
2. Clique em **Exportar Temas** (se disponível)
3. Cole na aba CRONOGRAMA

## Opção 3: Script do Google Sheets (Mais Rápido)

Cole este código no Google Apps Script e execute:

```javascript
function popularCronograma() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cronogramaSheet = ss.getSheetByName("CRONOGRAMA");

  // Criar aba se não existir
  if (!cronogramaSheet) {
    cronogramaSheet = ss.insertSheet("CRONOGRAMA");
  }

  // Limpar aba
  cronogramaSheet.clear();

  // Adicionar cabeçalho
  cronogramaSheet.appendRow(['ID', 'TEMA', 'COR', 'SEMANA_ORIGINAL']);

  // Lista de temas (exemplo com primeiros 10 - você precisa completar os 645)
  const temas = [
    ['1', 'Cardiologia Básica', 'VERDE', '1'],
    ['2', 'Anatomia Cardiovascular', 'AMARELO', '1'],
    ['3', 'Fisiologia Cardíaca', 'VERDE', '1'],
    ['4', 'Eletrocardiografia', 'VERMELHO', '2'],
    ['5', 'Hipertensão Arterial', 'VERDE', '2'],
    ['6', 'Insuficiência Cardíaca', 'AMARELO', '2'],
    ['7', 'Arritmias Cardíacas', 'VERMELHO', '3'],
    ['8', 'Doença Arterial Coronariana', 'VERDE', '3'],
    ['9', 'Valvopatias', 'AMARELO', '3'],
    ['10', 'Cardiomiopatias', 'VERDE', '4']
    // ... adicione os 635 temas restantes
  ];

  // Adicionar temas
  temas.forEach(tema => {
    cronogramaSheet.appendRow(tema);
  });

  Logger.log('Cronograma populado com sucesso!');
}
```

## Opção 4: Importar CSV

Crie um arquivo CSV com este formato:

```csv
ID,TEMA,COR,SEMANA_ORIGINAL
1,Cardiologia Básica,VERDE,1
2,Anatomia Cardiovascular,AMARELO,1
...
```

E importe no Google Sheets (File → Import).

## Distribuição por Cores

**Cores Disponíveis:**
- **VERDE**: Temas de revisão básica
- **AMARELO**: Temas de média relevância
- **VERMELHO**: Temas críticos para prova
- **ROXO**: Temas especiais

## Distribuição por Semanas

**Total:** 30 semanas
**Temas por semana:** ~21-22 temas

**Sugestão de distribuição:**
- Semanas 1-10: Temas básicos (VERDE)
- Semanas 11-20: Temas intermediários (AMARELO)
- Semanas 21-30: Temas avançados (VERMELHO e ROXO)

## Verificação

Após popular, verifique:
- [ ] Total de 645 linhas (+ 1 cabeçalho = 646)
- [ ] Todas as cores são: VERDE, AMARELO, VERMELHO ou ROXO
- [ ] Semanas vão de 1 a 30
- [ ] Cada tema tem ID único
- [ ] Não há células vazias

## Próximo Passo

Após popular a aba CRONOGRAMA:

1. **Copie o novo código** do Google Apps Script do site (⚙️ Configuração)
2. **Cole no Apps Script** e salve
3. **Crie novo deployment**
4. **Atualize a URL** no site
5. **Teste o cronograma** - deve carregar os 645 temas!

## Aba CRONOGRAMA_PROGRESSO

**NÃO precisa popular manualmente!** Esta aba será criada automaticamente quando você:
- Marcar um tema como estudado
- Adicionar questões
- Migrar um tema de semana
- Qualquer outra ação no cronograma

O sistema salvará apenas os temas que foram modificados.
