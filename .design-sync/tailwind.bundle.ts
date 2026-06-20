// design-sync bundle Tailwind config.
// Derives from the REAL app theme (../tailwind.config.ts) so the design-system
// bundle ships the full brand palette — not just the utility classes the synced
// components happen to use. The plain `compiled.css` JIT output only contained
// used classes (e.g. success/warning/danger never shipped); the `safelist` below
// forces the complete brand scales into _ds_bundle.css so the design agent can
// build with the whole theme.
import type { Config } from 'tailwindcss'
import base from '../tailwind.config'

const config: Config = {
  ...base,
  // Scan src for hand-written classes (ripple, component utilities) as before.
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  safelist: [
    // Brand color scales on the core utilities a design composes with.
    // Bounded on purpose (no gradient stops / divide / placeholder) so the
    // bundle stays small; full token values also ship as CSS vars in tokens.css.
    {
      pattern: /(bg|text|border|ring)-(teal|success|warning|danger)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus'],
    },
    // Brand-tinted elevation + brand font.
    'shadow-cta',
    'font-sans',
  ],
}

export default config
