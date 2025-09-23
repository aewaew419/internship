import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom breakpoints for mobile-first design
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Custom color palette from existing theme
      colors: {
        primary: {
          50: '#ffe6db',
          100: '#ffd1bd',
          200: '#ffc1a8',
          300: '#ffaf92',
          400: '#ff9c7f',
          500: '#f28362',
          600: '#f45626',
          700: '#e44a18',
          800: '#cf4111',
          900: '#4e281c',
        },
        secondary: {
          50: '#ffebcd',
          100: '#ffdfb6',
          200: '#ffd19e',
          300: '#ffc38d',
          400: '#f1b07c',
          500: '#d89967',
          600: '#966033',
          700: '#54371e',
          800: '#482d16',
          900: '#412610',
        },
        bg: {
          100: '#fcfcfd',
          200: '#f8f8fa',
        },
        text: {
          50: '#eceef1',
          100: '#e3e5e9',
          200: '#dbdde2',
          300: '#d2d4db',
          400: '#c6c8d1',
          500: '#b0b3be',
          600: '#80828d',
          700: '#747781',
          800: '#575860',
          900: '#1c1d20',
        },
        error: '#a01f38',
        success: '#2f7b69',
      },
      // Custom font family
      fontFamily: {
        sans: ['Bai Jamjuree', 'sans-serif'],
      },
      // Custom spacing for mobile touch targets
      spacing: {
        'touch': '44px', // Minimum touch target size
      },
      // Custom border radius
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      // Custom shadows for mobile
      boxShadow: {
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      // Custom z-index scale
      zIndex: {
        'modal': '50',
        'overlay': '40',
        'dropdown': '30',
        'header': '20',
        'sidebar': '10',
      },
    },
  },
  plugins: [],
}

export default config