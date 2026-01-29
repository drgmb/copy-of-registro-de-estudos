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

export enum AppStatus {
  IDLE = 'IDLE',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}