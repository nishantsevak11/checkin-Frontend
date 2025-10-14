export const APP_NAME = 'TimeTracker';

export const DEFAULT_WORK_DURATION_MINUTES = 555; // 9h 15m

export const DATE_FORMATS = {
  display: 'EEEE, MMMM d, yyyy',
  short: 'MMM d, yyyy',
  time: 'h:mm a',
};

export const STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  MANUAL: 'manual',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  PROFILE: '/profile',
} as const;
