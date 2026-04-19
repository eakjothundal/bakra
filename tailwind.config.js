/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1a1410',
        'bg-stripe': '#251810',
        brass: '#D4A017',
        'brass-dark': '#8B7500',
        rust: '#8B3A1F',
        cream: '#F4E8D0',
        parchment: '#FFF8E7',
      },
      fontFamily: {
        display: ['Rye', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        app: '420px',
      },
      boxShadow: {
        western: '0 5px 0 #8B7500',
        'western-pressed': '0 1px 0 #8B7500',
      },
      keyframes: {
        'goat-bounce': {
          '0%,100%': { transform: 'translateY(0) rotate(-3deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        spin4s: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0) rotate(-30deg)' },
          '60%': { transform: 'scale(1.3) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        'goat-rain': {
          '0%': { transform: 'translate(0,0) rotate(0) scale(0.5)', opacity: '1' },
          '100%': {
            transform:
              'translate(var(--dx,0), 100px) rotate(var(--r,360deg)) scale(1.3)',
            opacity: '0',
          },
        },
        confetti: {
          '0%': { transform: 'translateY(-30px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(900px) rotate(720deg)', opacity: '0' },
        },
      },
      animation: {
        'goat-bounce': 'goat-bounce 1s ease-in-out infinite',
        spin4s: 'spin4s 4s linear infinite',
        'pop-in': 'pop-in 0.6s cubic-bezier(0.22,1.2,0.36,1) both',
      },
    },
  },
  plugins: [],
};
