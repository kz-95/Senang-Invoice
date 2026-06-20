import { StatusPill } from 'senanginvoice'

export const Draft = () => <StatusPill status="draft" />
export const Validated = () => <StatusPill status="validated" />
export const Synced = () => <StatusPill status="synced" />

export const AllStates = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <StatusPill status="draft" />
    <StatusPill status="validated" />
    <StatusPill status="synced" />
  </div>
)
