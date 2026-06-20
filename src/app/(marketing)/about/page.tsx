'use client'
import { useState } from 'react'
import { useT } from '@/hooks/useT'

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? ''

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function AboutPage() {
  const t = useT()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const fieldClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-teal-900">{t('about.title')}</h1>
        <p className="mx-auto max-w-xl text-gray-600 leading-relaxed">{t('about.intro')}</p>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('about.missionTitle')}</h2>
          <p className="text-sm leading-relaxed text-gray-600">{t('about.missionDesc')}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('about.privacyTitle')}</h2>
          <p className="text-sm leading-relaxed text-gray-600">{t('about.privacyDesc')}</p>
        </div>
      </div>

      {/* Contact us */}
      <div className="rounded-2xl bg-teal-50 p-6">
        <h2 className="mb-2 text-center text-lg font-semibold text-teal-900">{t('about.contactTitle')}</h2>
        <p className="mx-auto mb-5 max-w-md text-center text-sm leading-relaxed text-gray-600">
          {t('about.contactDesc')}
          {CONTACT_EMAIL && (
            <>
              {' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800">
                {CONTACT_EMAIL}
              </a>
            </>
          )}
        </p>

        {status === 'success' ? (
          <p role="status" className="rounded-lg bg-success-100 px-4 py-3 text-center text-sm font-medium text-success-800">
            {t('about.formSuccess')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('about.formName')}
              aria-label={t('about.formName')}
              className={fieldClass}
            />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('about.formEmail')}
              aria-label={t('about.formEmail')}
              className={fieldClass}
            />
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('about.formMessage')}
              aria-label={t('about.formMessage')}
              className={`${fieldClass} resize-y`}
            />
            {status === 'error' && (
              <p role="alert" className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-800">
                {t('about.formError')}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="ripple inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-700 px-6 font-medium text-white transition-colors hover:bg-teal-800 active:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? t('about.formSending') : t('about.formSend')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
