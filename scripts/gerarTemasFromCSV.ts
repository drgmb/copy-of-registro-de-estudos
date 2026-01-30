import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Ler CSV e gerar arquivo TypeScript com temas centralizados

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '..', 'temas_cronograma.csv');
const outputPath = path.join(__dirname, '..', 'temasCentralizados.ts');

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Pular cabeçalho e linhas de total
const dataLines = lines.slice(1).filter(line => !line.startsWith('Total'));

interface TemaData {
  id: string;
  nome: string;
  cor: 'VERDE' | 'AMARELO' | 'VERMELHO' | 'ROXO';
  semanaOriginal: number;
}

const temas: TemaData[] = [];

dataLines.forEach(line => {
  const parts = line.split(',');
  if (parts.length >= 4) {
    temas.push({
      id: parts[0].trim(),
      nome: parts[1].trim(),
      cor: parts[2].trim() as 'VERDE' | 'AMARELO' | 'VERMELHO' | 'ROXO',
      semanaOriginal: parseInt(parts[3].trim())
    });
  }
});

// Gerar arquivo TypeScript
const tsContent = `// ==========================================
// TEMAS CENTRALIZADOS - FONTE ÚNICA DE VERDADE
// Gerado automaticamente do CSV exportado da planilha
// NÃO EDITE MANUALMENTE - Use o CSV como fonte
// ==========================================

export type CorRelevancia = 'VERDE' | 'AMARELO' | 'VERMELHO' | 'ROXO';

export interface TemaBase {
  id: string;
  nome: string;
  cor: CorRelevancia;
  semanaOriginal: number;
}

// Significado das Cores:
// VERDE = Importante (regime de revisão padrão)
// AMARELO = Médio (regime de revisão padrão)
// VERMELHO = Baixo (regime de revisão diferenciado)
// ROXO = Extra (regime de revisão padrão)

// Total de temas: ${temas.length}
export const TEMAS_BASE: TemaBase[] = ${JSON.stringify(temas, null, 2)};

// Mapa de cores para acesso rápido (backward compatibility)
export const TEMAS_CORES: Record<string, CorRelevancia> = {
${temas.map(t => `  '${t.nome}': '${t.cor}'`).join(',\n')}
};

// Mapa de IDs para acesso rápido
export const TEMAS_POR_ID: Record<string, TemaBase> = {
${temas.map(t => `  '${t.id}': ${JSON.stringify(t)}`).join(',\n')}
};

// Mapa de nomes para IDs
export const NOME_PARA_ID: Record<string, string> = {
${temas.map(t => `  '${t.nome}': '${t.id}'`).join(',\n')}
};

// Estatísticas
export const ESTATISTICAS_TEMAS = {
  total: ${temas.length},
  porCor: {
    VERDE: ${temas.filter(t => t.cor === 'VERDE').length},
    AMARELO: ${temas.filter(t => t.cor === 'AMARELO').length},
    VERMELHO: ${temas.filter(t => t.cor === 'VERMELHO').length},
    ROXO: ${temas.filter(t => t.cor === 'ROXO').length}
  },
  porSemana: {
${Array.from({length: 30}, (_, i) => i + 1).map(sem =>
  `    semana${sem}: ${temas.filter(t => t.semanaOriginal === sem).length}`
).join(',\n')}
  }
};
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');

console.log(`✅ Arquivo gerado: ${outputPath}`);
console.log(`📊 Total de temas: ${temas.length}`);
console.log(`🎨 Cores:`);
console.log(`   VERDE: ${temas.filter(t => t.cor === 'VERDE').length}`);
console.log(`   AMARELO: ${temas.filter(t => t.cor === 'AMARELO').length}`);
console.log(`   VERMELHO: ${temas.filter(t => t.cor === 'VERMELHO').length}`);
console.log(`   ROXO: ${temas.filter(t => t.cor === 'ROXO').length}`);
