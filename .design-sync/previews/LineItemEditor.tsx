import { LineItemEditor, useInvoiceStore } from 'senanginvoice'
import { mockLines } from '../fixtures/invoice'

;(useInvoiceStore as { setState: (s: unknown) => void }).setState({ lines: mockLines })

export const Default = () => (
  <div style={{ width: 380 }}>
    <LineItemEditor index={0} />
  </div>
)
