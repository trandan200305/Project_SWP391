
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#1E3A8A', 
          light: '#3B82F6',
          dark: '#172554',
        },
        secondary: {
          DEFAULT: '#06B6D4', 
          dark: '#0891B2',
          light: '#ECFEFF',
          container: '#E0F7FA',
        },
        accent: {
          DEFAULT: '#F59E0B', 
          dark: '#D97706',
          light: '#FEF3C7',
        },
        muted: {
          DEFAULT: '#64748B',
          light: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        'large': '1rem',
        'xlarge': '1.5rem',
      },
      boxShadow: {
        'level-1': '0px 4px 20px rgba(15, 23, 42, 0.05)',
        'level-2': '0px 10px 30px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
}
