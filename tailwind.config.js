/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F6F4F0',
        surface: '#FFFCF8',
        border: '#D9D2C8',
        muted: '#EEE8DE',
        'muted-foreground': '#6F665B',
        foreground: '#161311',
        primary: {
          DEFAULT: '#161311',
          foreground: '#FFFCF8',
        },
        accent: {
          DEFAULT: '#F1EBE2',
          foreground: '#161311',
        },
        positive: '#16A34A',
        negative: '#DC2626',
        warning: '#D97706',
        brand: {
          DEFAULT: '#6F8263',
          soft: '#E2E8DB',
          deep: '#5D6D53',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Georgia', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        subtle: '0 1px 2px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
