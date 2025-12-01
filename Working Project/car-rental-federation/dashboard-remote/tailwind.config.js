/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,ts,tsx,js,jsx}',
        './public/**/*.html',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                ],
            },
            colors: {
                primary: {
                    DEFAULT: '#4f46e5',
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                neutral: {
                    light: '#f8fafc',
                    DEFAULT: '#64748b',
                    dark: '#0f172a',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                success: {
                    DEFAULT: '#10b981',
                    600: '#059669',
                    700: '#047857',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                },
                info: {
                    DEFAULT: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
            },
            boxShadow: {
                soft: '0 2px 8px -2px rgb(0 0 0 / 0.1)',
                card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                elevated: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                'glow-primary': '0 0 20px -5px rgba(79, 70, 229, 0.5)',
                'inner-soft': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
            },
            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scale-in': 'scaleIn 0.25s ease-out forwards',
                'slide-in-right': 'slideInRight 0.3s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    safelist: [
        'bg-primary/10',
        'text-primary',
        'border-primary',
        'bg-danger',
        'text-danger',
        'border-danger',
        'bg-success',
        'text-success',
        'bg-warning',
        'text-warning',
    ],
    darkMode: 'class',
    plugins: [],
    corePlugins: {
        preflight: true,
    },
};
