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

// Cronograma
export interface CronogramaTema {
  tema: string;
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