export const SCORE_THRESHOLDS = {
  EXCELLENT: 54,
  GOOD: 48,
  SATISFACTORY: 42,
  NEEDS_IMPROVEMENT: 36,
  POOR: 30,
} as const

export const SCORE_COLORS = {
  [SCORE_THRESHOLDS.EXCELLENT]: 'gold',
  [SCORE_THRESHOLDS.GOOD]: 'green',
  [SCORE_THRESHOLDS.SATISFACTORY]: 'cyan',
  [SCORE_THRESHOLDS.NEEDS_IMPROVEMENT]: 'orange',
  [SCORE_THRESHOLDS.POOR]: 'red',
} as const

export const SCORE_LABELS = {
  [SCORE_THRESHOLDS.EXCELLENT]: '优秀',
  [SCORE_THRESHOLDS.GOOD]: '良好',
  [SCORE_THRESHOLDS.SATISFACTORY]: '中等',
  [SCORE_THRESHOLDS.NEEDS_IMPROVEMENT]: '及格',
  [SCORE_THRESHOLDS.POOR]: '不及格',
} as const

export const COLUMN_COUNT = {
  MIN: 1,
  MAX: 4,
  DEFAULT: 1,
} as const

export const ESSAY_TEXT = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 10000,
} as const

export const STUDENT_ID = {
  LENGTH: 8,
} as const

export const PASSWORD = {
  MIN_LENGTH: 6,
} as const

export const PHONE_NUMBER = {
  PATTERN: /^1\d{10}$/,
} as const

export const API_TIMEOUT = {
  DEFAULT: 10000,
  BATCH_UPLOAD: 180000,
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 15 * 60 * 1000,
  LONG: 60 * 60 * 1000,
} as const

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  USERNAME: 'userName',
  REAL_NAME: 'realName',
  PHONE_NUMBER: 'phoneNumber',
  THEME: 'theme',
} as const

export const ROUTE_NAMES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  STATUS: '/status',
  API_KEYS: '/apikey',
  ASSIGNMENTS: '/assignments',
  CLASSES: '/classes',
  ESSAYS: '/essays',
  ESSAY_UPLOAD: '/essay/upload',
  ESSAY_QUERY: '/essay/query',
  ESSAY_EXPORT: '/essay/export',
  STUDENTS: '/students',
} as const

export const SUBMISSION_STATUS = {
  SUBMITTED: 'Submitted',
  EVALUATING: 'Evaluating',
  EVALUATED: 'Evaluated',
} as const

export const SUBMIT_MODE = {
  IMAGE: 'image',
  TEXT: 'text',
} as const