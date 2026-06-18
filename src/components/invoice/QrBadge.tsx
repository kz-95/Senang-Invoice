'use client'
import { useT } from '@/hooks/useT'

interface QrBadgeProps { qrDataUrl: string }

export function QrBadge({ qrDataUrl }: QrBadgeProps) {
  const t = useT()
  return (
    <div className="flex flex-col items-center gap-1">
      <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 rounded-lg border" />
      <span className="text-xs text-gray-500">{t('invoice.scanToVerify')}</span>
    </div>
  )
}
