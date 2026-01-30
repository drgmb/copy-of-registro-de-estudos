export interface StudySession {
  topicId: string;
  topic: string;
  details: string;
  difficulty: string;
  isClass: boolean;
  isQuestions: boolean;
  totalQuestions: number;
  correctQuestions: number;
  date: string;
}

export interface SimuladoSession {
  id: string;
  description: string;
  totalQuestionsGeneral: number;
  clinicaQuestions: number;
  clinicaCorrect: number;
  cirurgiaQuestions: number;
  cirurgiaCorrect: number;
  preventivaQuestions: number;
  preventivaCorrect: number;
  pediatriaQuestions: number;
  pediatriaCorrect: number;
  ginecologiaQuestions: number;
  ginecologiaCorrect: number;
  date: string;
}

export interface ChangeLogEntry {
  type: string;
  action: string;
  date?: string;
  oldDate?: string;
  newDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  timing?: string;
  daysDifference?: number;
  adjustment?: string;
  reason?: string;
  note?: string;
  reviewNumber?: number;
  daysFromEntry?: number;
  wouldBeDate?: string;
  count?: number;
  canceledCount?: number;
  percentage?: string;
  originalIntervals?: string;
  adjustedIntervals?: string;
  newIntervals?: string;
  topic?: string;
}

export interface SheetResponse {
  status: 'success' | 'error';
  message?: string;
  changeLog?: ChangeLogEntry[];
  code?: string;
}

export interface DiaryReview {
  id: string;
  tema: string;
  acao: string;
  dataAgendada: string;
  status: boolean;
  isToday: boolean;
  isOverdue: boolean;
  isUpcoming: boolean;
  daysDiff: number;
}

export interface TodayData {
  date: string;
  reviews: DiaryReview[];
  completed: DiaryReview[];
  total: number;
  completedCount: number;
  pendingCount: number;
}

export interface DiaryStatistics {
  completedToday: number;
  completedThisMonth: number;
  totalCompleted: number;
  overdueCount: number;
  upcomingCount: number;
}

export interface DiaryData {
  today: TodayData;
  statistics: DiaryStatistics;
  overdue: DiaryReview[];
  upcoming: DiaryReview[];
  allActiveReviews: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Cronograma - Sistema de 30 Semanas
export type CorRelevancia = 'VERDE' | 'AMARELO' | 'VERMELHO' | 'ROXO';

export interface TemaEstudo {
  id: string; // UUID
  nome: string;
  cor: CorRelevancia;

  // Posicionamento
  semanaOriginal: number; // 1-30
  semanaAtual: number; // 1-30

  // Status básico
  estudado: boolean;
  primeiraVisualizacao: string | null; // ISO date

  // Tipo de estudo
  apenasAula: boolean;
  aulaERevisao: boolean;
  apenasRevisao: boolean;
  datasEstudos: string[]; // Array de ISO dates

  // Revisões
  revisoesTotal: number;
  revisoesConcluidas: number;
  datasRevisoes: string[]; // ISO dates

  // Questões
  questoesFeitas: number;
  questoesCorretas: number;
  questoesErradas: number;

  // Avaliação subjetiva
  grauDificuldade: 1 | 2 | 3 | 4 | 5 | null;

  // Histórico
  logMigracoes: {
    de: number;
    para: number;
    data: string; // ISO date
  }[];

  // Tema Composto (quando múltiplos temas são estudados juntos)
  isComposto?: boolean;
  temasOriginais?: string[]; // IDs dos temas originais que foram unidos
}

export interface SemanaEstudo {
  numero: number; // 1-30
  dataInicio: string; // ISO date
  dataTermino: string; // ISO date
  temas: TemaEstudo[];
}

export interface CronogramaState {
  semanas: SemanaEstudo[];
  dataInicialCronograma: string; // ISO date - quando o cronograma foi criado
  ultimaAtualizacao: string; // ISO date
  temasCompostos?: TemaCompostoInfo[]; // Lista de temas compostos criados
}

// Informação sobre tema composto para persistência
export interface TemaCompostoInfo {
  id: string; // ID do tema composto
  nome: string; // Nome composto (ex: "AVC Isquêmico I + AVC Isquêmico II")
  temasOriginaisIds: string[]; // IDs dos temas originais
  temasOriginaisNomes: string[]; // Nomes dos temas originais
  cor: CorRelevancia; // Cor do primeiro tema
  dataCriacao: string; // ISO date
}

// Tipos antigos mantidos para compatibilidade (deprecated)
export interface CronogramaTema {
  tema: string;
  cor: 'VERDE' | 'AMARELO' | 'VERMELHO' | 'ROXO';
  status: 'Pendente' | 'Estudado';
  dataEstudo?: string;
  semana: number;
}

export interface CronogramaData {
  temasPorSemana: { [semana: number]: CronogramaTema[] };
  progressoGeral: {
    totalPrevisto: number; // X
    totalRealizado: number; // Y
    percentual: number;
  };
}

// Visão Geral
export type PeriodoFilter = 'dia' | 'semana' | 'mes' | 'trimestre';

export interface MetricasPeriodo {
  questoesRealizadas: number;
  acertos: number;
  temasEstudados: number; // primeira vez
  temasRevisados: number;
}

export interface VisaoGeralData {
  metricas: MetricasPeriodo;
  periodo: PeriodoFilter;
}

// Lista Mestra de Temas
export interface RevisaoDetalhe {
  data: string;
  remarcada: boolean;
  dataOriginal?: string;
}

export interface TemaDetalhado {
  tema: string;
  dataPrimeiroEstudo: string;
  totalQuestoes: number;
  totalAcertos: number;
  quantidadeRevisoes: number;
  revisoes: RevisaoDetalhe[];
}

// Aba HOJE - Dashboard de Atividades Diárias
export type StatusAtividade = 'CONCLUIDO' | 'PENDENTE' | 'ATRASADO' | 'FORA_PROGRAMADO';
export type TipoAtividade = 'PRIMEIRA_VEZ' | 'REVISAO';
export type TipoForaPrograma = 'ANTECIPADO' | 'ATRASADO_CONCLUIDO' | 'EXTRA';

export interface AtividadeDia {
  // Identificação
  id: string;
  temaId: string;
  temaNome: string;
  temaCor: CorRelevancia;

  // Tipo e Status
  tipo: TipoAtividade;
  numeroRevisao?: number;
  status: StatusAtividade;

  // Datas e Timing
  dataProgramada: Date;
  dataRealizada?: Date;
  horaRealizada?: string;
  diasDeAtraso?: number; // Positivo = atrasado, Negativo = antecipado

  // Performance (se aplicável)
  questoesFeitas?: number;
  questoesCorretas?: number;
  percentualAcerto?: number;

  // Categorização especial
  foraPrograma?: {
    tipo: TipoForaPrograma;
    diasDiferenca: number;
    dataOriginal?: Date;
  };

  // Origem dos dados
  origem: {
    diario: boolean;
    dataEntry: boolean;
  };
}

export interface EstatisticasDia {
  totalProgramadas: number;
  totalRealizadas: number;
  taxaConclusao: number; // 0-100
  performanceMedia: number; // 0-100

  // Breakdown por tipo
  primeiraVez: {
    programadas: number;
    concluidas: number;
  };
  revisoes: {
    programadas: number;
    concluidas: number;
  };
}

export interface EstadoAbaHoje {
  dataAtual: Date;
  concluidos: AtividadeDia[];
  pendentes: AtividadeDia[];
  atrasados: AtividadeDia[];
  foraPrograma: AtividadeDia[]; // Apenas revisões não programadas
  temasVistosHoje: AtividadeDia[]; // Primeiro Contato feito hoje
  stats: EstatisticasDia;
}

// Estrutura do DIÁRIO na planilha
export interface RegistroDiario {
  data: string; // ISO date
  tema: string;
  acao: string; // "Primeira vez" ou "Revisão"
  semana?: number;
}