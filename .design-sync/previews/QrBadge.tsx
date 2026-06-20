import { QrBadge } from 'senanginvoice'

// A small static QR-like SVG as a data URL (real component just renders the image).
const qr =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 7 7" shape-rendering="crispEdges">
      <rect width="7" height="7" fill="#fff"/>
      <g fill="#0f766e">
        <rect x="0" y="0" width="3" height="1"/><rect x="0" y="0" width="1" height="3"/><rect x="2" y="0" width="1" height="3"/><rect x="0" y="2" width="3" height="1"/>
        <rect x="4" y="0" width="3" height="1"/><rect x="6" y="0" width="1" height="3"/><rect x="4" y="0" width="1" height="3"/><rect x="4" y="2" width="3" height="1"/>
        <rect x="0" y="4" width="3" height="1"/><rect x="0" y="4" width="1" height="3"/><rect x="2" y="4" width="1" height="3"/><rect x="0" y="6" width="3" height="1"/>
        <rect x="4" y="4" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/>
      </g>
    </svg>`
  )

export const Default = () => <QrBadge qrDataUrl={qr} />
