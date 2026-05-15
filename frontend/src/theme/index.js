import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 380;

// ─── Color Palette ───────────────────────────────────────────────
const colors = {
  // Primary
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  // Accent
  accent: '#F59E0B',
  accentLight: '#FCD34D',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  favorite: '#F43F5E',
  favoriteLight: '#FFE4E6',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  black: '#000000',

  // Surface
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderFocus: '#6366F1',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',

  // Gradients
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  gradientAccent: '#F59E0B',
};

// ─── Typography ──────────────────────────────────────────────────
const typography = {
  h1: {
    fontSize: isSmallDevice ? 28 : 32,
    fontWeight: '800',
    lineHeight: isSmallDevice ? 34 : 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: '700',
    lineHeight: isSmallDevice ? 28 : 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    lineHeight: isSmallDevice ? 24 : 28,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  small: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  button: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};

// ─── Spacing ─────────────────────────────────────────────────────
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  page: 20,
};

// ─── Border Radius ───────────────────────────────────────────────
const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ─── Shadows ─────────────────────────────────────────────────────
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  primary: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Layout ──────────────────────────────────────────────────────
const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice,
  headerHeight: Platform.OS === 'ios' ? 100 : 80,
  tabBarHeight: 60,
  cardWidth: (SCREEN_WIDTH - 45) / 2,
  cardHeight: 220,
};

// ─── Animation ───────────────────────────────────────────────────
const animation = {
  spring: {
    damping: 15,
    stiffness: 100,
    mass: 0.5,
  },
  timing: {
    fast: 200,
    normal: 350,
    slow: 500,
  },
};

// ─── Gradients ───────────────────────────────────────────────────
const gradients = {
  primary: [colors.primary, colors.primaryDark],
  accent: [colors.accent, '#D97706'],
  success: [colors.success, '#059669'],
  error: [colors.error, '#DC2626'],
  dark: [colors.gray800, colors.gray900],
  light: ['#F1F5F9', '#E2E8F0'],
  subtle: [colors.white, colors.gray50],
  hero: ['#6366F1', '#8B5CF6', '#D946EF'],
  glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
};

export {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
  animation,
  gradients,
};

export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
  animation,
  gradients,
};