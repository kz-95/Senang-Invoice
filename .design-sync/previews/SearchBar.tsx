import { SearchBar } from 'senanginvoice'

const noop = () => {}

export const Default = () => (
  <div style={{ width: 360 }}>
    <SearchBar query="" onQueryChange={noop} sortField="date" onSortFieldChange={noop} sortDir="desc" onSortDirToggle={noop} />
  </div>
)

export const WithQuery = () => (
  <div style={{ width: 360 }}>
    <SearchBar query="Awesome Retail" onQueryChange={noop} sortField="amount" onSortFieldChange={noop} sortDir="asc" onSortDirToggle={noop} />
  </div>
)
