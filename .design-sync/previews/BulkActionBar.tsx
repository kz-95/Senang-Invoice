import { BulkActionBar } from 'senanginvoice'

const noop = () => {}

// Fixed bottom bar — render inside a positioned frame so it sits in the card.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 80, width: 420, background: '#f9fafb', borderRadius: 12, overflow: 'hidden' }}>
    {children}
  </div>
)

export const Active = () => (
  <Frame>
    <BulkActionBar selectedCount={3} mode="active" onArchive={noop} onDelete={noop} onCancel={noop} />
  </Frame>
)

export const Trash = () => (
  <Frame>
    <BulkActionBar selectedCount={2} mode="trash" onRestore={noop} onDelete={noop} onArchive={noop} onCancel={noop} />
  </Frame>
)
