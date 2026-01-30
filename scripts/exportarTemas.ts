import { TEMAS_CORES } from '../temasColors';

// Script para exportar os 645 temas em formato CSV para Google Sheets

function exportarTemasCSV() {
  const temas = Object.entries(TEMAS_CORES);
  const totalTemas = temas.length;
  const TOTAL_SEMANAS = 30;
  const temasPorSemana = Math.ceil(totalTemas / TOTAL_SEMANAS);

  console.log('ID,TEMA,COR,SEMANA_ORIGINAL');

  temas.forEach(([nome, cor], index) => {
    const id = index + 1;
    const semana = Math.floor(index / temasPorSemana) + 1;
    console.log(`${id},${nome},${cor},${semana}`);
  });

  console.log(`\nTotal de temas: ${totalTemas}`);
  console.log(`Temas por semana: ${temasPorSemana}`);
}

// Executar
exportarTemasCSV();
