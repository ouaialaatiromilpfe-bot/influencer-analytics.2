import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#FBFAFF',
          100: '#F3E8FF',
          200: '#E6E6FA',
          300: '#D8B4FE',
          400: '#C79CFA',
          500: '#A855F7',
          600: '#8B32E0'
        },
        ink: '#2E2245'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace']
      },
      borderRadius: {
        card: '1.25rem'
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(139, 50, 224, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
