import { LangToggle } from 'senanginvoice'

// The default toggle is white-on-brand (lives in the teal TopBar), so preview it
// on a brand-colored surface.
export const OnBrand = () => (
  <div style={{ background: '#0f766e', padding: 12, borderRadius: 12, display: 'inline-block' }}>
    <LangToggle />
  </div>
)

export const CustomClasses = () => <LangToggle className="bg-teal-100 text-teal-800" />
