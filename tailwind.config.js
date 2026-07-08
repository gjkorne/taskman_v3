/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Libre Franklin"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        // K Windows brand palette
        kw: {
          navy: '#2F4866',       // primary — buttons, links, accents
          'navy-deep': '#20344B', // stats bar, dark headings
          'navy-dark': '#18283C', // footer background
          ink: '#1B2D43',        // h1/h2 heading text
          text: '#2B3340',       // default body text
          body: '#4A525E',       // secondary body text
          label: '#6E8199',      // eyebrow labels, muted UI
          muted: '#8A93A0',      // lighter muted text
          subtle: '#9CABBC',     // footer links, very muted
          dim: '#8595A8',        // footer body copy
          nav: '#3A4250',        // nav link color
          cream: '#F6F4EF',      // alternate section background
          'cream-light': '#FBFAF7', // card background
          border: '#ECE8E0',     // dividers, nav borders
          'border-card': '#E7E2D8', // card borders
          step: '#C3CAD3',       // step numbers, decorative
          rule: '#B7BCC4',       // horizontal rules in logo
        },
        // Legacy alias kept for backward compat during migration
        'taskman-blue': {
          50: '#e6edf4',
          100: '#cddae9',
          200: '#9ab5d3',
          300: '#6890bd',
          400: '#3a6ba0',
          500: '#2F4866',
          600: '#264057',
          700: '#1d3047',
          800: '#18283C',
          900: '#0f1a28',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.10), 0 12px 40px -16px rgba(31,49,75,.18)',
        'card-hover': '0 4px 12px rgba(0,0,0,.12), 0 16px 48px -12px rgba(31,49,75,.24)',
        header: '0 1px 3px 0 rgba(0,0,0,.08)',
        dropdown: '0 4px 12px rgba(0,0,0,.12)',
      },
      ringColor: {
        DEFAULT: 'rgba(47,72,102,0.35)',
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '4px',
        xl: '6px',
      },
      dropShadow: {
        sm: '0 1px 1px rgba(0,0,0,.05)',
        DEFAULT: '0 1px 2px rgba(0,0,0,.10)',
        md: '0 4px 3px rgba(0,0,0,.07)',
        lg: '0 8px 8px rgba(0,0,0,.06)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },
    },
  },
  plugins: [],
};
