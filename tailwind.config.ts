import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter, self-hosted via next/font (see src/app/layout.tsx).
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Brand — teal is the primary palette.
        teal: {
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf',
          '500': '#14b8a6',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
        },
        // Semantic tokens — use these (not raw green/amber/red) for status/feedback.
        success: { '50': '#f0fdf4', '100': '#dcfce7', '600': '#16a34a', '700': '#15803d', '800': '#166534' },
        warning: { '50': '#fffbeb', '100': '#fef3c7', '600': '#d97706', '700': '#b45309', '800': '#92400e' },
        danger: { '50': '#fef2f2', '100': '#fee2e2', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b' },
      },
      boxShadow: {
        // Brand-tinted elevation for hero / primary CTAs. One consistent value.
        cta: '0 10px 25px -5px rgb(15 118 110 / 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
