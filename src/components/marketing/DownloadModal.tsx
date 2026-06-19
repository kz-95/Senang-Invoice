'use client'
import { Modal } from '@/components/common/Modal'
import { APK_DOWNLOAD_URL, PLAYSTORE_URL, PLAYSTORE_COMING_SOON } from '@/lib/constants'
import { track } from '@/lib/analytics'
import { useT } from '@/hooks/useT'

const PlayIcon = (
  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l9.1-9.6-9.1-9.6zm12.2 6.3L5.9 3.1l9.6 9.6 2.4-2.5-2.1-1.5zm3.9 2.2l-2.4-1.4-2.6 2.7 2.6 2.7 2.4-1.4c.7-.4 1.1-.9 1.1-1.3s-.4-.9-1.1-1.3zm-6 4.4l-9.8 5.6 9.6-9.6 2.6 2.7-2.4 1.3z" /></svg>
)
const ApkIcon = (
  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
)
const ChevronIcon = (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
)

interface DownloadModalProps {
  open: boolean
  onClose: () => void
}

export function DownloadModal({ open, onClose }: DownloadModalProps) {
  const t = useT()
  const apkReady = !!APK_DOWNLOAD_URL
  const playstoreReady = !PLAYSTORE_COMING_SOON && !!PLAYSTORE_URL

  return (
    <Modal open={open} onClose={onClose} title={t('landing.downloadChooseTitle')}>
      <div className="flex flex-col gap-3">
        {/* Play Store option */}
        {playstoreReady ? (
          <a
            href={PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { track('playstore_badge_click'); onClose() }}
            className="group flex items-center gap-4 rounded-xl border-2 border-teal-700 px-5 py-4 text-left transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <span className="text-teal-700">{PlayIcon}</span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-gray-900">{t('landing.downloadViaPlaystore')}</span>
              <span className="block text-sm text-gray-500">{t('landing.downloadViaPlaystoreDesc')}</span>
            </span>
            {ChevronIcon}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-4 rounded-xl border-2 border-gray-200 px-5 py-4 text-left"
          >
            <span className="text-gray-400">{PlayIcon}</span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-gray-500">{t('landing.downloadViaPlaystore')}</span>
              <span className="block text-sm text-gray-400">{t('landing.playStoreComingSoon')}</span>
            </span>
          </span>
        )}

        {/* Standalone APK option */}
        {apkReady ? (
          <a
            href={APK_DOWNLOAD_URL}
            download
            onClick={() => { track('apk_download_click'); onClose() }}
            className="group flex items-center gap-4 rounded-xl bg-teal-700 px-5 py-4 text-left text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <span>{ApkIcon}</span>
            <span className="flex-1">
              <span className="block text-base font-semibold">{t('landing.downloadViaApk')}</span>
              <span className="block text-sm text-teal-100">{t('landing.downloadViaApkDesc')}</span>
            </span>
            <svg className="h-5 w-5 text-teal-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-4 rounded-xl border-2 border-gray-200 px-5 py-4 text-left"
          >
            <span className="text-gray-400">{ApkIcon}</span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-gray-500">{t('landing.downloadViaApk')}</span>
              <span className="block text-sm text-gray-400">{t('landing.apkComingSoon')}</span>
            </span>
          </span>
        )}
      </div>
    </Modal>
  )
}
