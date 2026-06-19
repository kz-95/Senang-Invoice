import { PageHeader, Button } from 'senanginvoice'

export const Default = () => <PageHeader title="Dashboard" />
export const WithSubtitle = () => <PageHeader title="Invoices" subtitle="42 this month" />
export const WithAction = () => (
  <PageHeader
    title="Invoices"
    subtitle="42 this month"
    action={<Button size="sm">New invoice</Button>}
  />
)
