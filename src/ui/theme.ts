import { useColorScheme } from 'react-native';

const light = {
  bg: '#f1f4f2',
  surface: '#ffffff',
  surfaceAlt: '#eef2f0',
  ink: '#13201b',
  muted: '#62716b',
  line: '#dfe6e2',
  heroA: '#0f5446',
  heroB: '#1d8a6f',
  onHero: '#f2fbf7',
  mint: '#7ce3c2',
  accent: '#1a7a62',
  accentSoft: '#dcf1ea',
  spend: '#c2473b',
  spendSoft: '#fbe5e1',
  warn: '#b4720f',
  warnSoft: '#fbefd9',
};

const dark: typeof light = {
  bg: '#0c1210',
  surface: '#161f1c',
  surfaceAlt: '#1d2824',
  ink: '#e7efec',
  muted: '#93a49d',
  line: '#26322e',
  heroA: '#0b3d33',
  heroB: '#14705a',
  onHero: '#eefaf5',
  mint: '#7ce3c2',
  accent: '#5ccaa8',
  accentSoft: '#183a31',
  spend: '#f08a7e',
  spendSoft: '#3b2220',
  warn: '#e6a84d',
  warnSoft: '#3a2d17',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 12, md: 16, lg: 22, xl: 26 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
