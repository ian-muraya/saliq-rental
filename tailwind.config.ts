// tailwind.config.ts
// Tailwind CSS v3 configuration

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EDF5',
          100: '#C4D0E3',
          200: '#9FB3D1',
          300: '#7A96BF',
          400: '#5579AD',
          500: '#2F5C9B',
          600: '#1A3D6E',
          700: '#102A4A',
          800: '#0A1E35',
          900: '#051221',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FEFDFB',
          200: '#FDFBF7',
          300: '#F5F2EB',
          400: '#EBE5D9',
          500: '#E1D8C7',
        },
        gold: {
          50: '#F8F2E8',
          100: '#EFE0CD',
          200: '#E5CEB2',
          300: '#D8B88F',
          400: '#C5A059',
          500: '#A6843F',
          600: '#87682C',
          700: '#684C1E',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(197, 160, 89, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(197, 160, 89, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

export default config