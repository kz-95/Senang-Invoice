import { redirect } from 'next/navigation'
import { WelcomeFlow } from '@/components/onboarding/WelcomeFlow'
import { WELCOME_STEPS } from '@/components/onboarding/welcomeSteps'

// Required for `output: export` (APK build): pre-render every step, no on-demand params.
export const dynamicParams = false

export function generateStaticParams() {
  return Array.from({ length: WELCOME_STEPS }, (_, i) => ({ step: String(i + 1) }))
}

interface WelcomePageProps {
  params: Promise<{ step: string }>
}

export default async function WelcomeStepPage({ params }: WelcomePageProps) {
  const { step } = await params
  const n = Number(step)

  if (!Number.isInteger(n) || n < 1 || n > WELCOME_STEPS) {
    redirect('/welcome/1')
  }

  return <WelcomeFlow step={n} />
}
