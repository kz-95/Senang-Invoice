'use client'
import Link from 'next/link'

export interface Block {
  type: string
  text?: string
  tone?: 'info' | 'warn' | 'tip'
  items?: string[]
  src?: string
  alt?: string
  label?: string
  href?: string
}

const toneStyles: Record<string, string> = {
  info: 'border-l-blue-500 bg-blue-50 text-blue-900',
  warn: 'border-l-amber-500 bg-amber-50 text-amber-900',
  tip: 'border-l-green-500 bg-green-50 text-green-900',
}

function renderBlock(block: Block, index: number, isFirstHeading: boolean) {
  switch (block.type) {
    case 'heading': {
      if (isFirstHeading) {
        return <h2 key={index} className="text-xl font-bold text-teal-900 mt-8 mb-3">{block.text}</h2>
      }
      return <h3 key={index} className="text-lg font-semibold text-teal-800 mt-6 mb-2">{block.text}</h3>
    }
    case 'paragraph':
      return <p key={index} className="text-gray-700 leading-relaxed mb-4">{block.text}</p>
    case 'callout': {
      const style = toneStyles[block.tone ?? 'info']
      return (
        <div key={index} className={`border-l-4 rounded-r-lg p-4 mb-4 ${style}`}>
          <p className="text-sm">{block.text}</p>
        </div>
      )
    }
    case 'steps':
      return (
        <ol key={index} className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
          {block.items?.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ol>
      )
    case 'image':
      return (
        <div key={index} className="my-4">
          <img
            src={block.src}
            alt={block.alt ?? ''}
            className="rounded-lg border border-gray-200 max-w-full"
          />
        </div>
      )
    case 'cta':
      return (
        <div key={index} className="my-6">
          <Link
            href={block.href ?? '#'}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors"
          >
            {block.label}
          </Link>
        </div>
      )
    default:
      return null
  }
}

export function ArticleRenderer({ blocks }: { blocks: Block[] }) {
  let firstHeading = true

  return (
    <div className="prose max-w-none">
      {blocks.map((block, i) => {
        const isFirst = block.type === 'heading' && firstHeading
        if (block.type === 'heading' && firstHeading) {
          firstHeading = false
        }
        return renderBlock(block, i, isFirst)
      })}
    </div>
  )
}
