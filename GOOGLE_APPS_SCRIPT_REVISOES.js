// ==========================================
// GOOGLE APPS SCRIPT - SISTEMA DE REVISÕES
// Código para adicionar ao seu Google Apps Script
// ==========================================

// INTERVALOS PADRÃO DE REVISÃO (em dias)
const INTERVALOS_PADRAO = [1, 7, 15, 30, 60, 90];

/**
 * Calcular fator de ajuste baseado no percentual de acerto
 */
function calcularFatorAjuste(percentualAcerto) {
  if (percentualAcerto >= 90) return 1.25; // +25%
  if (percentualAcerto >= 80) return 1.10; // +10%
  if (percentualAcerto >= 70) return 1.0;  // sem ajuste
  if (percentualAcerto >= 60) return 0.85; // -15%
  return 0.70; // -30%
}

/**
 * Ajustar intervalos baseado em performance
 */
function ajustarIntervalosPorPerformance(intervalos, percentualAcerto) {
  const fator = calcularFatorAjuste(percentualAcerto);
  return intervalos.map(function(intervalo) {
    return Math.round(intervalo * fator);
  });
}

/**
 * Calcular diferença em dias entre duas datas
 */
function calcularDiferencaDias(dataEsperada, dataRealizada) {
  const esperada = new Date(dataEsperada);
  const realizada = new Date(dataRealizada);

  esperada.setHours(0, 0, 0, 0);
  realizada.setHours(0, 0, 0, 0);

  const diffMs = realizada.getTime() - esperada.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Aplicar ajuste temporal a todas as revisões futuras
 */
function aplicarAjusteTemporalEmTodasRevisoes(revisoes, revisaoIndex, diasDiferenca) {
  const novasRevisoes = [];

  for (var i = 0; i < revisoes.length; i++) {
    if (i <= revisaoIndex) {
      // Revisões passadas e atual não mudam
      novasRevisoes.push(revisoes[i]);
    } else {
      // Revisões futuras: adicionar diasDiferenca
      var revisao = revisoes[i];
      var dataOriginal = new Date(revisao.data);
      dataOriginal.setDate(dataOriginal.getDate() + diasDiferenca);

      novasRevisoes.push({
        data: Utilities.formatDate(dataOriginal, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        tema: revisao.tema,
        acao: revisao.acao,
        semana: revisao.semana
      });

      Logger.log('  ✅ Revisão ' + (i + 1) + ': ' + revisao.data + ' → ' + Utilities.formatDate(dataOriginal, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    }
  }

  return novasRevisoes;
}

/**
 * Recalcular todas as revisões futuras com novos intervalos
 */
function recalcularRevisoesFuturasComNovosIntervalos(revisoes, revisaoIndex, novosIntervalos, dataBase) {
  const novasRevisoes = [];
  var dataReferencia = new Date(dataBase);
  dataReferencia.setHours(0, 0, 0, 0);

  Logger.log('📊 Recalculando revisões futuras com novos intervalos: [' + novosIntervalos.join(', ') + ']');

  for (var i = 0; i < revisoes.length; i++) {
    if (i <= revisaoIndex) {
      // Revisões passadas e atual não mudam
      novasRevisoes.push(revisoes[i]);
    } else {
      // Revisões futuras: recalcular com novos intervalos
      var indiceIntervalo = i - revisaoIndex - 1;
      var intervalo = indiceIntervalo < novosIntervalos.length
        ? novosIntervalos[indiceIntervalo]
        : novosIntervalos[novosIntervalos.length - 1];

      var novaData = new Date(dataReferencia);
      novaData.setDate(novaData.getDate() + intervalo);

      var revisao = revisoes[i];
      novasRevisoes.push({
        data: Utilities.formatDate(novaData, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        tema: revisao.tema,
        acao: revisao.acao,
        semana: revisao.semana
      });

      Logger.log('  ✅ Revisão ' + (i + 1) + ': ' + revisao.data + ' → ' + Utilities.formatDate(novaData, Session.getScriptTimeZone(), 'yyyy-MM-dd') + ' (+' + intervalo + ' dias)');

      dataReferencia = novaData;
    }
  }

  return novasRevisoes;
}

/**
 * Processar revisão com ajustes propagados
 */
function processarRevisaoComAjustes(revisoes, revisaoIndex, dataRealizacao, resultado) {
  var log = [];
  var novasRevisoes = revisoes;
  var intervalosAtuais = INTERVALOS_PADRAO.slice(); // copiar array

  // 1. Verificar ajuste temporal
  var revisaoAtual = revisoes[revisaoIndex];
  var diasDiferenca = calcularDiferencaDias(revisaoAtual.data, dataRealizacao);

  if (diasDiferenca !== 0) {
    var tipo = diasDiferenca > 0 ? 'atrasado' : 'antecipado';
    log.push('Ajuste temporal: ' + Math.abs(diasDiferenca) + ' dias (' + tipo + ')');
    Logger.log('📅 Ajuste temporal detectado: ' + diasDiferenca + ' dias (' + tipo + ')');

    novasRevisoes = aplicarAjusteTemporalEmTodasRevisoes(novasRevisoes, revisaoIndex, diasDiferenca);
  }

  // 2. Ajustar intervalos baseado em performance
  if (resultado && resultado.total > 0) {
    var percentual = (resultado.corretas / resultado.total) * 100;
    log.push('Performance: ' + percentual.toFixed(1) + '% de acerto');

    intervalosAtuais = ajustarIntervalosPorPerformance(intervalosAtuais, percentual);
    log.push('Intervalos ajustados: [' + intervalosAtuais.join(', ') + ']');

    novasRevisoes = recalcularRevisoesFuturasComNovosIntervalos(
      novasRevisoes,
      revisaoIndex,
      intervalosAtuais,
      dataRealizacao
    );
  }

  return {
    novasRevisoes: novasRevisoes,
    intervalosAjustados: intervalosAtuais,
    log: log
  };
}

/**
 * Buscar revisões de um tema no DIÁRIO
 */
function buscarRevisoesTema(temaNome) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetDiario = ss.getSheetByName('DIÁRIO');

  if (!sheetDiario) {
    Logger.log('⚠️ Aba DIÁRIO não encontrada');
    return [];
  }

  var data = sheetDiario.getDataRange().getValues();
  var revisoes = [];

  // Assumindo estrutura: Data | Tema | Ação | Semana
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1] === temaNome && row[2].toLowerCase().includes('revisão')) {
      revisoes.push({
        data: Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        tema: row[1],
        acao: row[2],
        semana: row[3],
        rowIndex: i + 1 // +1 porque arrays começam em 0 mas linhas em 1
      });
    }
  }

  return revisoes;
}

/**
 * Atualizar revisões no DIÁRIO
 */
function atualizarRevisoesDiario(novasRevisoes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetDiario = ss.getSheetByName('DIÁRIO');

  if (!sheetDiario) {
    Logger.log('⚠️ Aba DIÁRIO não encontrada');
    return;
  }

  novasRevisoes.forEach(function(revisao) {
    if (revisao.rowIndex) {
      // Atualizar apenas a data (coluna A)
      sheetDiario.getRange(revisao.rowIndex, 1).setValue(new Date(revisao.data));
      Logger.log('✅ Atualizada revisão na linha ' + revisao.rowIndex + ': ' + revisao.data);
    }
  });
}

/**
 * FUNÇÃO PRINCIPAL - Processar registro de revisão
 * Chamada quando uma revisão é registrada no DATA ENTRY
 */
function processarRegistroRevisao(temaNome, dataRealizacao, totalQuestoes, questoesCorretas) {
  Logger.log('\n=== PROCESSANDO REVISÃO ===');
  Logger.log('Tema: ' + temaNome);
  Logger.log('Data Realização: ' + dataRealizacao);
  Logger.log('Questões: ' + questoesCorretas + '/' + totalQuestoes);

  // 1. Buscar revisões programadas do tema
  var revisoes = buscarRevisoesTema(temaNome);

  if (revisoes.length === 0) {
    Logger.log('⚠️ Nenhuma revisão programada encontrada para ' + temaNome);
    return;
  }

  Logger.log('📋 Encontradas ' + revisoes.length + ' revisões programadas');

  // 2. Encontrar qual revisão foi realizada (a mais próxima da data)
  var revisaoIndex = -1;
  var menorDiff = Infinity;

  for (var i = 0; i < revisoes.length; i++) {
    var diff = Math.abs(calcularDiferencaDias(revisoes[i].data, dataRealizacao));
    if (diff < menorDiff) {
      menorDiff = diff;
      revisaoIndex = i;
    }
  }

  if (revisaoIndex === -1) {
    Logger.log('⚠️ Não foi possível identificar qual revisão foi realizada');
    return;
  }

  Logger.log('✅ Identificada: ' + revisoes[revisaoIndex].acao + ' (índice ' + revisaoIndex + ')');

  // 3. Preparar resultado de questões (se houver)
  var resultado = null;
  if (totalQuestoes > 0) {
    resultado = {
      total: totalQuestoes,
      corretas: questoesCorretas,
      percentualAcerto: (questoesCorretas / totalQuestoes) * 100
    };
  }

  // 4. Processar ajustes
  var resultado = processarRevisaoComAjustes(
    revisoes,
    revisaoIndex,
    dataRealizacao,
    resultado
  );

  Logger.log('\n=== RESULTADO ===');
  Logger.log('Intervalos ajustados: [' + resultado.intervalosAjustados.join(', ') + ']');
  Logger.log('Log de mudanças:');
  resultado.log.forEach(function(linha) {
    Logger.log('  • ' + linha);
  });

  // 5. Atualizar DIÁRIO
  atualizarRevisoesDiario(resultado.novasRevisoes);

  Logger.log('\n✅ Processamento concluído!');

  return {
    status: 'success',
    message: 'Revisões ajustadas com sucesso',
    log: resultado.log,
    intervalosAjustados: resultado.intervalosAjustados
  };
}

/**
 * EXEMPLO DE USO
 * Cole essa função no seu Google Apps Script e chame quando necessário
 */
function exemploUso() {
  // Exemplo: Processar uma revisão do tema "AVC Isquêmico I"
  // Realizada em 2026-02-12, com 18 acertos em 20 questões
  var resultado = processarRegistroRevisao(
    'AVC Isquêmico I',  // Nome do tema
    '2026-02-12',       // Data em que foi realizada
    20,                 // Total de questões
    18                  // Questões corretas
  );

  Logger.log(JSON.stringify(resultado, null, 2));
}

/**
 * INTEGRAÇÃO COM doPost
 * Adicione isso ao seu método doPost existente
 */
function integrarComDoPost(e) {
  var action = e.parameter.action;

  if (action === 'registrarRevisao') {
    var temaNome = e.parameter.tema;
    var dataRealizacao = e.parameter.data;
    var totalQuestoes = parseInt(e.parameter.totalQuestoes) || 0;
    var questoesCorretas = parseInt(e.parameter.questoesCorretas) || 0;

    var resultado = processarRegistroRevisao(
      temaNome,
      dataRealizacao,
      totalQuestoes,
      questoesCorretas
    );

    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ... outras ações existentes ...
}
