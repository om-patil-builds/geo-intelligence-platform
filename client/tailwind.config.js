/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#06101E',
        'surface': '#0A192F',
        'card': '#112240',
        'dim': '#233554',
        'border-l': '#303C55',
        'border-dim': '#233554',
        'cyan': '#22d3ee',
        'cyan-d': '#164e63',
        'cyan-b': '#0891b2',
        'lead-cyan': '#22d3ee',
        'indigo': '#6366f1',
        'dark': '#06101E',
        't1': '#e2e8f0',
        't2': '#94a3b8',
        't3': '#64748b',
        'bg-hover': '#1e293b',
        'red-d': '#450a0a',
        'lead-red': '#ef4444',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
