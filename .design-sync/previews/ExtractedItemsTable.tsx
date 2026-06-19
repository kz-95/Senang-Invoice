import { ExtractedItemsTable, useInvoiceStore } from 'senanginvoice'
import { mockLines } from '../fixtures/invoice'

// Seed the SAME store instance the bundled component reads from (the store is
// exported on the global). Runs at module load, before React mounts the cell.
;(useInvoiceStore as { setState: (s: unknown) => void }).setState({ lines: mockLines })

export const WithItems = () => <ExtractedItemsTable />
