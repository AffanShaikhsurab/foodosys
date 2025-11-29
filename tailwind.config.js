/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#2C3E2E',
          light: '#4A5D4C',
        },
        accent: {
          lime: '#DCEB66',
        },
        text: {
          main: '#1F291F',
          muted: '#889287',
        },
        bg: {
          body: '#FDFDE8',
          card: '#FFFFFF',
          subtle: '#F2F4F2',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': '12px',
        'md': '20px',
        'lg': '28px',
        'xl': '32px',
        'pill': '999px',
      },
      boxShadow: {
        'soft': '0 8px 24px rgba(44, 62, 46, 0.08)',
        'float': '0 10px 30px rgba(44, 62, 46, 0.25)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}