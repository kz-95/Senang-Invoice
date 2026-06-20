'use client'
import Link from 'next/link'
import { APK_DOWNLOAD_URL, PLAYSTORE_URL, PLAYSTORE_COMING_SOON } from '@/lib/constants'
import { track } from '@/lib/analytics'
import { useT } from '@/hooks/useT'

const DownloadIcon = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
)
const PhoneIcon = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
)
const CheckIcon = (
  <svg className="h-4 w-4 text-teal-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
)
const QrIcon = (
  <svg className="h-9 w-9 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm0 3h3v5h-5v-3h2v-2zm-5 0h2v2h-2v-2zm0 3h2v2h-2v-2z" /></svg>
)

export function Hero() {
  const t = useT()
  const apkReady = !!APK_DOWNLOAD_URL

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Left column */}
        <div className="space-y-8">
          {/* Download CTA — primary */}
          <div id="download" className="scroll-mt-20 space-y-6">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 lg:text-6xl">
              {t('landing.downloadAppNow')}
            </h1>
            <div className="flex flex-col gap-4 sm:flex-row">
              {apkReady ? (
                <a
                  href={APK_DOWNLOAD_URL}
                  download
                  onClick={() => track('apk_download_click')}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-700 px-12 py-7 text-xl font-semibold text-white shadow-cta transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  {DownloadIcon}
                  {t('landing.downloadApkShort')}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl bg-gray-200 px-12 py-7 text-xl font-semibold text-gray-500"
                >
                  {DownloadIcon}
                  {t('landing.apkComingSoon')}
                </span>
              )}

              {PLAYSTORE_COMING_SOON ? (
                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 px-12 py-7 text-xl font-semibold text-gray-400"
                >
                  {PhoneIcon}
                  {t('landing.playStoreComingSoon')}
                </span>
              ) : (
                <a
                  href={PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('playstore_badge_click')}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-teal-700 px-12 py-7 text-xl font-semibold text-teal-700 transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  {PhoneIcon}
                  {t('landing.playstoreGet')}
                </a>
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 lg:text-5xl">
              {t('landing.heroMainTitle')}
              <span className="block text-teal-700">{t('landing.heroMainTitleAccent')}</span>
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-gray-600">
              {t('landing.heroDescription')}
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[t('landing.featurePillCompliant'), t('landing.featurePillQr'), t('landing.featurePillInstant')].map(label => (
              <div key={label} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
                {CheckIcon}
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </div>
            ))}
          </div>

          {/* Secondary CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/guide/do-i-need-einvoice"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-teal-700 px-8 py-3 font-semibold text-teal-700 transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {t('landing.heroCtaScope')}
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center justify-center rounded-2xl bg-teal-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {t('landing.viewGuide')}
            </Link>
          </div>
        </div>

        {/* Right column — phone mockup */}
        <div className="relative flex items-center justify-center">
          <div aria-hidden className="absolute h-96 w-96 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 opacity-60 blur-3xl" />

          <div className="relative z-10 w-full max-w-sm">
            <div className="relative aspect-[9/19] overflow-hidden rounded-[3rem] border-8 border-gray-900 bg-white shadow-2xl">
              {/* notch */}
              <div className="absolute left-1/2 top-0 z-20 h-7 w-40 -translate-x-1/2 rounded-b-3xl bg-gray-900" />

              <div className="h-full bg-gradient-to-br from-teal-50 to-white p-6 pt-12">
                {/* invoice preview */}
                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Invoice #</p>
                      <p className="text-lg font-bold text-gray-900">INV-2024-001</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-teal-700">
                      {QrIcon}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold tabular-nums">RM 1,250.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">SST (6%)</span>
                      <span className="font-semibold tabular-nums">RM 75.00</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                      <span>Total</span>
                      <span className="text-teal-700 tabular-nums">RM 1,325.00</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-teal-50 p-3">
                    {CheckIcon}
                    <p className="text-xs font-medium text-teal-700">{t('landing.lhdnQrVerified')}</p>
                  </div>
                </div>

                {/* bottom action */}
                <div className="absolute inset-x-6 bottom-6">
                  <div className="rounded-2xl bg-teal-700 py-4 text-center font-semibold text-white shadow-lg">
                    Generate Invoice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
