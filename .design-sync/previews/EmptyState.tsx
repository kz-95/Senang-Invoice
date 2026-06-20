import { EmptyState, Button } from 'senanginvoice'

const FileIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

export const WithAction = () => (
  <div style={{ width: 360 }}>
    <EmptyState
      icon={FileIcon}
      title="No invoices yet"
      description="Create your first e-invoice to get started."
      action={<Button variant="primary">New invoice</Button>}
    />
  </div>
)

export const TitleOnly = () => (
  <div style={{ width: 360 }}>
    <EmptyState title="Trash is empty" description="Deleted invoices appear here for 30 days." />
  </div>
)
