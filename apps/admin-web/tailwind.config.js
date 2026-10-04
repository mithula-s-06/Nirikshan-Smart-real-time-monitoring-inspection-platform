import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'tailwindcss/colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DoSJE government-portal theme (white surfaces, navy primary, orange accent).
 *
 * The existing components were written against a dark palette
 * (bg-slate-950 page, bg-slate-900 cards, text-slate-100 headings, text-*-400 accents).
 * Rather than rewrite hundreds of class names, the scales are re-mapped so the SAME
 * class names resolve to the light-portal equivalents:
 *   slate-950/900 -> page grey / white cards,  slate-100..400 -> navy..grey text,
 *   <status>-950/900 -> pale tint,  <status>-400/300 -> readable dark accent text.
 */
const lightSlate = {
  50: '#0a1a3a',
  100: '#0f2147', // primary text (navy)
  200: '#1c2f58',
  300: '#324568',
  400: '#4d5d7c',
  500: '#6b7a96',
  600: '#8a97ae',
  700: '#b7c3d8',
  800: '#d6deec', // borders
  850: '#e6ecf6',
  900: '#ffffff', // cards
  950: '#f3f6fb', // page / inputs
};

// Navy primary (replaces indigo): 600 stays dark enough for white button text.
const navy = {
  50: '#0a1a3a',
  100: '#0a1f52',
  200: '#0b2a6b',
  300: '#0f3a8f',
  400: '#1546ab',
  500: '#1d4fb8',
  600: '#0b2a6b',
  700: '#9db6e6',
  800: '#c3d3f1',
  900: '#dbe5f7',
  950: '#eaf0fb',
};

// Status families: dark text on pale tint backgrounds.
const invert = (c) => ({
  50: c[950],
  100: c[900],
  200: c[800],
  300: c[700],
  400: c[600],
  500: c[500],
  600: c[600],
  700: c[300],
  800: c[200],
  900: c[100],
  950: c[50],
});

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-portal-navy',
    'bg-portal-navyDark',
    'bg-portal-orange',
    'bg-portal-orangeDark',
    'bg-portal-sage',
    'bg-portal-teal',
    'bg-portal-sky',
    'bg-portal-sand',
    'text-portal-navy',
    'text-portal-orange',
    'text-portal-teal',
    'text-portal-sage',
    'border-portal-navy',
    'border-portal-orange',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      slate: lightSlate,
      gray: lightSlate,
      zinc: lightSlate,
      neutral: lightSlate,
      indigo: navy,
      blue: navy,
      emerald: invert(colors.emerald),
      green: invert(colors.green),
      red: invert(colors.red),
      rose: invert(colors.rose),
      amber: invert(colors.amber),
      yellow: invert(colors.yellow),
      orange: invert(colors.orange),
      sky: invert(colors.sky),
      cyan: invert(colors.cyan),
      teal: invert(colors.teal),
      purple: invert(colors.purple),
      violet: invert(colors.violet),
      portal: {
        navy: '#0b2a6b',
        navyDark: '#071d4d',
        navyLight: '#1d4fb8',
        orange: '#f58a3c',
        orangeDark: '#e0701f',
        sage: '#7fb5a4',
        teal: '#4a97ab',
        sky: '#bcd4fb',
        sand: '#fff7ec',
      },
      brand: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
    },
    extend: {
      boxShadow: {
        portal: '0 10px 24px -8px rgba(11, 42, 107, 0.35)',
      },
    },
  },
  plugins: [],
};
