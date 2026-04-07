import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#F5F0E8',
        'text-primary': '#1A1209',
        'text-secondary': '#5C4A2A',
        rules: '#2A1F0E',
        accent: '#8B0000',
        'link-color': '#1A1209',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
        garamond: ['var(--font-garamond)', 'Georgia', 'serif'],
        courier: ['var(--font-courier)', 'Courier New', 'monospace'],
      },
      maxWidth: {
        broadsheet: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
