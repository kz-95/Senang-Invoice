import { Hero } from '@/components/marketing/Hero'
import { PainVsEase } from '@/components/marketing/PainVsEase'
import { TrustRow } from '@/components/marketing/TrustRow'
import { GuideTeaser } from '@/components/marketing/GuideTeaser'
import { CtaFooter } from '@/components/marketing/CtaFooter'

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <PainVsEase />
      <TrustRow />
      <GuideTeaser />
      <CtaFooter />
    </div>
  )
}
