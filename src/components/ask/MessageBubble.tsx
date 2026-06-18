import type { ReactNode } from 'react'
import type { AskMessage } from '@/lib/types'

interface MessageBubbleProps { message: AskMessage }

/** Render inline **bold** and `code` spans inside a single text line. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++} className="font-semibold">{token.slice(2, -2)}</strong>)
    } else {
      nodes.push(
        <code key={key++} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Lightweight markdown: paragraphs, bullet and numbered lists, bold, inline code. */
function renderRichText(text: string): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let key = 0

  const flushList = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)
    blocks.push(
      list.ordered
        ? <ol key={key++} className="ml-4 list-decimal space-y-1">{items}</ol>
        : <ul key={key++} className="ml-4 list-disc space-y-1">{items}</ul>,
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/)
    if (bullet) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }
      list.items.push(bullet[1])
    } else if (numbered) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }
      list.items.push(numbered[1])
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(<p key={key++}>{renderInline(line)}</p>)
    }
  }
  flushList()
  return <div className="space-y-2">{blocks}</div>
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-teal-700 text-white rounded-br-sm'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          renderRichText(message.text)
        )}
        <p className={`mt-1.5 text-[11px] tabular-nums ${isUser ? 'text-teal-200' : 'text-gray-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
