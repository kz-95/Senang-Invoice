'use client'
import { useInvoiceStore } from '@/stores/invoiceStore'
import { Button } from '@/components/common/Button'
import { formatMYR } from '@/lib/formatters'
import { useT } from '@/hooks/useT'

export function ExtractedItemsTable() {
  const lines = useInvoiceStore(s => s.lines)
  const removeLine = useInvoiceStore(s => s.removeLine)
  const t = useT()


  if (lines.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="py-2 pr-2">{t('review.item')}</th>
            <th className="py-2 px-2">{t('review.quantity')}</th>
            <th className="py-2 px-2">{t('review.price')}</th>
            <th className="py-2 px-2">{t('review.amount')}</th>
            <th className="py-2 px-2">Confidence</th>
            <th className="py-2 pl-2"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const confidence = typeof line.confidence === 'number' ? line.confidence : 1
            const isLow = confidence < 0.6

            return (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 pr-2">
                  {line.description}
                  {isLow && (
                    <span className="ml-1 text-amber-500 cursor-help inline-flex items-center" title={`Low confidence classification: ${(confidence * 100).toFixed(0)}% - check code ${line.classificationCode || 'N/A'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 tabular-nums">{line.qty}</td>
                <td className="py-2 px-2 tabular-nums">RM {formatMYR(line.unitPrice)}</td>
                <td className="py-2 px-2 font-medium tabular-nums">RM {formatMYR(line.amount)}</td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${isLow ? 'text-amber-600' : 'text-green-600'}`}
                    title={`Classification code: ${line.classificationCode || 'N/A'}, UOM: ${line.uom || 'N/A'}`}
                  >
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-2 pl-2">
                  <Button variant="ghost" size="sm" onClick={() => removeLine(i)} aria-label="Remove item">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
