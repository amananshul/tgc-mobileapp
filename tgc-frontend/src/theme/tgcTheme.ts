export const TGC_COLORS = {
  bgPrimary: '#FDFCFA',
  bgSecondary: '#F9F8F6',
  bgTertiary: '#FFF5F2',
  bgHover: '#F5F4F2',
  card: '#FFFFFF',
  border: '#E8E5E1',
  textPrimary: '#2D2A26',
  textSecondary: '#5A5651',
  textTertiary: '#9B968F',
  coral: '#FF8B7B',
  coralLight: '#FFB3A7',
  coralLighter: '#FFC9C1',
  mint: '#7DD3C0',
  mintLight: '#A7E6D7',
  lavender: '#C8B6FF',
  lavenderLight: '#E0D5FF',
  white: '#FFFFFF',
  successGreen: '#26C281',
} as const;

export const TGC_GRADIENTS = {
  onboardingHeader: ['#C8B6FF', '#E0D5FF'] as const,
  authHeader: ['#FF8B7B', '#FFB3A7'] as const,
  dashboardHeader: ['#7DD3C0', '#A7E6D7'] as const,
  profileHeader: ['#FF8B7B', '#FFB3A7'] as const,
  hostHeader: ['#7DD3C0', '#A7E6D7'] as const,
  cta: ['#FF8B7B', '#FFB3A7'] as const,
  mint: ['#7DD3C0', '#A7E6D7'] as const,
  lavender: ['#C8B6FF', '#E0D5FF'] as const,
} as const;

export const TGC_SPACING = {
  pageHorizontal: 24,
  cardPadding: 24,
  sectionGap: 16,
  sectionLargeGap: 24,
} as const;

export const TGC_RADIUS = {
  card: 24,
  button: 18,
  input: 18,
  section: 28,
  chip: 999,
} as const;

export const TGC_SHADOWS = {
  card: {
    shadowColor: '#B8ACA0',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
  },
  soft: {
    shadowColor: '#C9C1B8',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  cta: {
    shadowColor: '#FF8B7B',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
  },
} as const;
