import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf4ff',
          100: '#d3e4ff',
          500: '#2563eb',
          600: '#1d4ed8',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'inner-glow': 'inset 0 0 25px rgba(37, 99, 235, 0.15)'
      }
    }
  },
  plugins: []
} satisfies Config;
