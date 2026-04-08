import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#F2EDE3',
        'text-primary': '#181008',
        'text-secondary': '#5C4A2A',
        rules: '#2A1F0E',
        accent: '#E5243A',
        'link-color': '#181008',
      },
      fontFamily: {
        quattrocento: ['var(--font-quattrocento)', 'Georgia', 'serif'],
        arvo: ['var(--font-arvo)', 'Georgia', 'serif'],
        // backward-compat aliases — existing classes resolve to new fonts
        playfair: ['var(--font-quattrocento)', 'Georgia', 'serif'],
        lora: ['var(--font-quattrocento)', 'Georgia', 'serif'],
        garamond: ['var(--font-quattrocento)', 'Georgia', 'serif'],
        courier: ['var(--font-arvo)', 'Georgia', 'serif'],
      },
      maxWidth: {
        broadsheet: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
