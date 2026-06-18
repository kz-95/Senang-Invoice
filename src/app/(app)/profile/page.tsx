'use client'
import { SellerProfileForm } from '@/components/profile/SellerProfileForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { useT } from '@/hooks/useT'

export default function ProfilePage() {
  const t = useT()
  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <SellerProfileForm />
    </div>
  )
}
