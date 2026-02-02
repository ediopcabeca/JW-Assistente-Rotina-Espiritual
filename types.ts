export interface ScheduleItem {
  day: string;
  activity: string;
  focus: string;
  completed?: boolean;
  notificationTime?: string; // Formato "HH:MM"
  notificationEnabled?: boolean;
}

export interface MinistryRequest {
  topic: string;
  situation: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCHEDULE = 'SCHEDULE',
  MINISTRY = 'MINISTRY',
  BIBLE = 'BIBLE',
  TRANSCRIPTION = 'TRANSCRIPTION',
  STUDY_QUESTIONS = 'STUDY_QUESTIONS',
  ILLUSTRATIONS = 'ILLUSTRATIONS',
  ADMIN = 'ADMIN'
}