import QRCode from 'qrcode'

export async function toQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { type: 'image/png', width: 200, margin: 1 })
}
