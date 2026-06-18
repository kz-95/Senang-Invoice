'use client'
import { useState } from 'react'

export interface CredentialHintProps {
  title?: string
  steps: string[]
  guideHref?: string
  guideLabel?: string
}

export function CredentialHint({ title = 'How do I get this?', steps, guideHref, guideLabel = 'Open full guide' }: CredentialHintProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-teal-700"
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
          {title}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {guideHref && (
            <a href={guideHref} className="inline-block text-sm font-medium text-teal-700 underline">
              {guideLabel} →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
