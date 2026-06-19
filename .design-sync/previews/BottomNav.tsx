import { BottomNav } from 'senanginvoice'

// Fixed bottom bar — render in a positioned frame so it sits inside the card.
export const Default = () => (
  <div style={{ position: 'relative', height: 88, width: 420, background: '#f9fafb', borderRadius: 12, overflow: 'hidden' }}>
    <BottomNav />
  </div>
)
