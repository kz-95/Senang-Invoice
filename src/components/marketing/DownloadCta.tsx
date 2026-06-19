'use client'
import { APK_DOWNLOAD_URL, PLAYSTORE_URL, PLAYSTORE_COMING_SOON } from '@/lib/constants'
import { track } from '@/lib/analytics'
import { useT } from '@/hooks/useT'

const AndroidIcon = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.6 9.48l1.84-3.18a.4.4 0 00-.69-.4l-1.86 3.22a11.4 11.4 0 00-9.78 0L5.25 5.9a.4.4 0 10-.69.4L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)
const PlayIcon = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.6 2.3a1 1 0 00-.6.92v17.56a1 1 0 001.54.84l2.9-1.74L4.9 3.04zm12.9 7.3L7.7 4.4l8.3 8.3 2-2zm3.9 1.5l-2.5-1.5-2.2 2.2 2.2 2.2 2.5-1.5a1 1 0 000-1.4zM7.7 19.6l8.8-5.2-2-2-8.3 8.3z" />
  </svg>
)

/**
 * Desktop landing distribution CTA: download the Android APK now, Play Store soon.
 * Mobile visitors never see this (they get the onboarding carousel instead).
 */
export function DownloadCta() {
  const t = useT()
  const apkReady = !!APK_DOWNLOAD_URL

  return (
    <div className="flex w-full flex-col gap-3">
      {apkReady ? (
        <a
          href={APK_DOWNLOAD_URL}
          download
          onClick={() => track('apk_download_click')}
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-teal-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-700/20 transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {AndroidIcon}
          {t('landing.downloadApk')}
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl bg-gray-200 px-8 py-4 text-lg font-semibold text-gray-500"
        >
          {AndroidIcon}
          {t('landing.apkComingSoon')}
        </span>
      )}

      {PLAYSTORE_COMING_SOON ? (
        <span
          aria-disabled="true"
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-lg font-medium text-gray-400"
        >
          {PlayIcon}
          {t('landing.playstoreSoon')}
        </span>
      ) : (
        <a
          href={PLAYSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('playstore_badge_click')}
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-teal-700 bg-white px-8 py-4 text-lg font-semibold text-teal-700 transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {PlayIcon}
          {t('landing.playstoreGet')}
        </a>
      )}
    </div>
  )
}
