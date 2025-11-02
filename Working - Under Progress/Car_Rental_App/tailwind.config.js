/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa', // blue-400
          DEFAULT: '#3b82f6', // blue-500
          dark: '#2563eb', // blue-600
        },
        secondary: {
          light: '#fcd34d', // amber-300
          DEFAULT: '#f59e0b', // amber-500
          dark: '#d97706', // amber-600
        },
        neutral: {
          light: '#f1f5f9', // slate-100
          DEFAULT: '#64748b', // slate-500
          dark: '#1e293b', // slate-800
        },
        success: '#10b981', // emerald-500
        danger: '#ef4444', // red-500
        warning: '#f97316', // orange-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
