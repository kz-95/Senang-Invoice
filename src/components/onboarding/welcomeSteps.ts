// Plain (non-'use client') module so the count is usable in Server Components.
// Importing a value from the 'use client' WelcomeFlow into a server page yields a
// client-reference proxy, not the number — which breaks generateStaticParams()
// under `output: export`. Keep this in sync with STEPS in WelcomeFlow.tsx.
export const WELCOME_STEPS = 3
