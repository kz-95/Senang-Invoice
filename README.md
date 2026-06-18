# Senang Invoice

E-invoicing made easy for Malaysian small businesses. Snap a receipt, speak items, or type manually — AI does the rest.

MyInvois requires every business above RM1m turnover to submit UBL 2.1 e-invoices with classification codes, TIN validation, and QR codes. The government portal is desktop-only, technical, and doesn't produce PDFs. SenangInvoice is a phone-first PWA that closes this gap.

## What it does

| Step | How |
|------|-----|
| **Capture** | Snap a receipt photo, speak items in any language, or type manually |
| **Extract** | AI reads the receipt/transcript and pulls out line items, quantities, prices |
| **Classify** | AI auto-maps each item to the correct IRBM classification code (45 codes) and UN/ECE unit of measure |
| **Generate** | Builds a UBL 2.1 JSON e-invoice, mocks MyInvois validation, renders a branded PDF with QR code |
| **Ask** | Multilingual chat (Malay, English, Mandarin, rojak) answers e-invoicing questions using IRBM guidelines |
| **Check** | Built-in scope checker tells you if your business falls under mandatory e-invoicing (RM1m threshold) |

## Who it's for

- **Kedai kopi**, food stalls, caterers — snap receipts, instant invoices
- **Freelancers, contractors** — speak "consulting 5 hours RM200" and get an invoice
- **Small retailers** — consolidated B2C invoices with General Public TIN
- **Anyone new to e-invoicing** — the Ask feature explains rules in plain language

## Key features

- **3 capture modes:** camera, voice, manual
- **Multi-provider AI:** Gemini, DeepSeek, Anthropic, OpenAI-compatible with key rotation and fallback
- **Full UBL 2.1 compliance** — schema-valid JSON output
- **Branded PDF** with embedded QR code — the government portal can't export PDF
- **Multilingual RAG chat** — ask e-invoicing questions in Malay, English, Mandarin, or rojak
- **Local-first** — all data stays on-device in IndexedDB, no server, no account needed
- **Offline PWA** — install on phone, works without internet
- **Optional Google Drive backup** — push invoices to your own Drive

## Demo

Unlock demo mode in Settings (password: `unlock`) to explore with sample invoices from Kedai Kopi Senang — Nasi Lemak, Teh Tarik, and a catering invoice.

## Docs

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [RAG Design](docs/rag-design.md)
