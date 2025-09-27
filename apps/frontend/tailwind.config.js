/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
      fontFamily: {
        'bai-jamjuree': ['Bai Jamjuree', 'sans-serif'],
      },
    },
  },
  plugins: [],
}