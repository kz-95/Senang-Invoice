import { DateFilter } from 'senanginvoice'

const noop = () => {}

export const Empty = () => (
  <div style={{ width: 300 }}>
    <DateFilter fromDate="" toDate="" onFromChange={noop} onToChange={noop} onClear={noop} />
  </div>
)

export const WithRange = () => (
  <div style={{ width: 300 }}>
    <DateFilter fromDate="2026-06-01" toDate="2026-06-30" onFromChange={noop} onToChange={noop} onClear={noop} />
  </div>
)
