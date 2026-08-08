import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const QovaTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F1EBFF',
      100: '#E3D7FE',
      200: '#CBB7FD',
      300: '#B496FB',
      400: '#9F7AEA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      950: '#2D2145',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#7C3AED',
          contrastColor: '#FFFFFF',
          hoverColor: '#6D28D9',
          activeColor: '#5B21B6',
        },
        highlight: {
          background: '#EDE9FE',
          focusBackground: '#E5E1EA',
          color: '#1C1821',
          focusColor: '#1C1821',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F8F7FA',
          100: '#F3F0F8',
          200: '#EDE9FE',
          300: '#E5E1EA',
          400: '#C9C2D1',
          500: '#AAA4B2',
          600: '#928C99',
          700: '#686270',
          800: '#3D3546',
          900: '#1C1821',
          950: '#100D14',
        },
      },
      dark: {
        primary: {
          color: '#8B5CF6',
          contrastColor: '#F5F3F7',
          hoverColor: '#9F7AEA',
          activeColor: '#7C3AED',
        },
        highlight: {
          background: '#2D2145',
          focusBackground: '#302A3B',
          color: '#F5F3F7',
          focusColor: '#F5F3F7',
        },
        surface: {
          0: '#F5F3F7',
          50: '#AAA4B2',
          100: '#77717F',
          200: '#4D4659',
          300: '#3D3549',
          400: '#302A3B',
          500: '#2A2434',
          600: '#211D2A',
          700: '#1C1823',
          800: '#17141D',
          900: '#0D0B12',
          950: '#08070C',
        },
      },
    },
  },
  components: {
    card: {
      colorScheme: {
        light: {
          root: {
            background: '#FFFFFF',
            color: '#1C1821',
          },
        },
        dark: {
          root: {
            background: '#17141D',
            color: '#F5F3F7',
          },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '999px',
          },
        },
        dark: {
          root: {
            borderRadius: '999px',
          },
        },
      },
    },
  },
});
