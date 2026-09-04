/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F6F1',
        ink: '#1A1A1A',
        muted: '#6B6B6B',
        accent: {
          DEFAULT: '#D95A41',
          dark: '#B8472F',
          light: '#E8836B',
        },
        success: '#4CAF50',
        error: '#D32F2F',
        border: '#E8E6E1',
        admin: {
          bg: '#0F0F0F',
          card: '#1A1A1A',
          muted: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        btn: '4px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
