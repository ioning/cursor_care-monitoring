export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.caremonitoring.com/api/v1';

export const COLORS = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
  info: '#2196F3',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#dddddd',
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

