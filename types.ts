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

export interface SheetResponse {
  status: 'success' | 'error';
  message: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}