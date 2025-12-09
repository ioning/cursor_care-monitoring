export const colors = {
  background: '#F2F4F7',
  surface: '#FFFFFF',
  primary: '#2B7FFF',
  primaryDark: '#103B8C',
  secondary: '#0C1B33',
  accent: '#FF6B6B',
  success: '#1DBA73',
  warning: '#F4A100',
  info: '#2EC5F6',
  danger: '#F04438',
  text: '#0F172A',
  textMuted: '#475467',
  divider: '#E4E7EC',
  guardianSurface: '#101828',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 28,
  circle: 999,
};

export const typography = {
  hero: 34,
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 14,
  tiny: 12,
};

export const shadows = {
  soft: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};

export const statusPalette = {
  safe: '#1DBA73',
  caution: '#FFB020',
  alert: '#F04438',
} as const;

export type StatusTone = keyof typeof statusPalette;

export const getStatusColor = (tone: StatusTone) => statusPalette[tone] ?? colors.info;


