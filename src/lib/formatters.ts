export function formatMYR(amount: number): string {
  return amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatMYRWhole(amount: number): string {
  return amount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
