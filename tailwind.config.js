/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'taskman-blue': {
          10: '#e6f1fe',
          100: '#cce3fd',
          200: '#99c7fb',
          300: '#66abf9',
          400: '#338ff7',
          600: '#0073f5', // Primary blue
          700: '#005cc4',
          800: '#004593',
          900: '#002e62',
          990: '#001731',
        },
        'taskman-green': {
          10: '#e6f9f0',
          100: '#f7fff8',
          200: '#99e7c3',
          300: '#66dba5',
          400: '#33cf87',
          500: '#00c369', // Primary green
          600: '#009c54',
          700: '#00753f',
          900: '#004e2a',
          990: '#013220',
        },
        'taskman-cyan': {
          0: '#e6fbfd',
          20: '#ccf7fb',
          200: '#99eff7',
          300: '#66e7f3',
          400: '#33dfef',
          500: '#00d7eb', // Primary cyan
          600: '#00acbc',
          700: '#00818d',
          800: '#00565e',
          900: '#002b2f',
        }
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'header': '0 1px 3px 0 rgba(0, 0, 0, 0.01), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      ringColor: {
        DEFAULT: 'rgb(59 130 246 / 0.015)',
      },
      dropShadow: {
        'sm': '0 1px 1px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 2px rgba(0, 0, 0, 0.01)',
        'md': '0 4px 3px rgba(0, 0, 0, 0.01), 0 2px 2px rgba(0, 0, 0, 0.01)',
        'lg': '0 10px 8px rgba(0, 0, 0, 0.01), 0 4px 3px rgba(0, 0, 0, 0.01)',
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '0.01' }
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out'
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      }
    },
  },
  plugins: [],
};
