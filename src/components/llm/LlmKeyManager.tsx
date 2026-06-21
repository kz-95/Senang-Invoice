'use client'
import { useState } from 'react'

export function LlmKeyManager() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 opacity-60 pointer-events-none select-none">
      {/* Section header — still clickable for visual feedback but does nothing */}
      <div className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-400">LLM API Keys</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0">
            Coming Soon
          </span>
        </div>
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <p className="text-xs text-gray-400">
        Bring your own AI key (Anthropic, OpenAI, DeepSeek, Gemini, Ollama) — launching soon.
      </p>
      <p className="text-xs text-gray-400">
        A built-in Gemini key is active so extraction and chat work out of the box.
      </p>
    </section>
  )
}
