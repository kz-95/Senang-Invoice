import { StatTile } from 'senanginvoice'

export const Default = () => <StatTile label="This month" value="RM 12,480" />
export const WithCount = () => <StatTile label="Invoices" value={42} />
export const Grid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: 360 }}>
    <StatTile label="This month" value="RM 12,480" />
    <StatTile label="Invoices" value={42} />
    <StatTile label="Synced" value={38} />
  </div>
)
