# AGENTS.md

## Git Workflow

- **Never commit or push directly to `main`.** All work happens on feature branches (`feat/*`, `fix/*`, `chore/*`).
- **`main` is merge-only.** Changes land on `main` exclusively via pull request merges or `git merge` from a feature branch. No direct commits, no `--force` push to `main`.
- Push to the feature branch, then merge to `main` via PR or `git merge`.

## Knowledge Base Maintenance

When you add, remove, or change any feature, flow, or behavior in this app, update the RAG knowledge chunks in `src/data/irbm-knowledge.json` accordingly. Every user-facing change must be reflected so the Ask chat stays accurate.

### Rules

- **Feature changes → update app-* chunks.** If you rename a button, change a flow, add a capture mode, or modify LLM key setup, update the relevant app-* chunk text.
- **IRBM regulation updates → update regulation chunks.** If tax rules, deadlines, thresholds, or codes change, update the relevant regulatory chunks.
- **New features → add new chunks.** When you implement a feature that users will ask about, add app-specific knowledge chunks.
- **Removed features → delete or deprecate chunks.** If a feature is removed (e.g., copilot), remove or mark deprecated its knowledge chunks.
- **Keep topics and ids stable.** The `id` and `topic` fields are the chunk identity — don't rename them unless the topic fundamentally changes. Update `text` in place.

## Knowledge Chunk Index

35 chunks in `src/data/irbm-knowledge.json`.

### IRBM Regulations (20 chunks)

| id | topic | covers |
|----|-------|--------|
| `exemption` | RM1m exemption rule | Turnover threshold, corporate group rule, voluntary opt-in |
| `phases` | Implementation phases | Aug 2024 / Jan 2025 / Jul 2025 rollout |
| `consolidated` | Consolidated invoice rules | B2C only, 7-day window, RM10k limit, code 004 |
| `non-consolidatable` | Non-consolidatable categories | 10 prohibited industries |
| `correction` | 72-hour correction window | Cancel/amend vs credit/debit note |
| `penalties` | Penalties for non-compliance | RM200k fine, 2yr imprisonment |
| `tin-format` | TIN format requirements | Prefix letters, digit count, EI00000000010 |
| `ubl` | UBL 2.1 format | Required fields, JSON structure |
| `qr-code` | QR code requirement | URL format, verification |
| `classification` | IRBM classification codes | 45 codes overview, notable codes |
| `classification-categories` | Classification code categories | Industry groupings, common codes |
| `how-to-choose-code` | Selecting classification codes | Decision guide, common mistakes |
| `b2b-b2c-b2g` | B2B vs B2C vs B2G | Buyer type differences, TIN rules |
| `credit-debit-notes` | Credit and debit notes | Issuance rules, UUID linking |
| `self-billed` | Self-billed e-invoices | Buyer-issued, IRBM approval |
| `common-errors` | Common validation errors | ERR236-ERR500 codes and fixes |
| `voluntary-opt-in` | Voluntary opt-in | Benefits, process, no opt-out |
| `foreign-currency` | Foreign currency handling | MYR conversion, Bank Negara rates |
| `record-keeping` | Record keeping | 7-year retention, audit requirements |
| `payment-timeline` | Submission timeline | 7-day window, validation speed |

### MyInvois Procedures (4 chunks)

| id | topic | covers |
|----|-------|--------|
| `registration-procedure` | How to register | 6-step portal registration |
| `issuance-workflow` | Issuance process | 7-step create→validate→deliver |
| `portal-usage` | MyInvois portal | Manual, spreadsheet, API methods |
| `api-integration` | API integration | OAuth, endpoints, sandbox |

### App Usage (11 chunks)

| id | topic | covers |
|----|-------|--------|
| `app-how-to-create` | Creating invoices | + button, capture, buyer, generate |
| `app-capture-modes` | Camera/Voice/Manual | Three input modes explained |
| `app-ai-extraction` | AI extraction | How AI extracts items and codes |
| `app-seller-profile` | Setting up profile | TIN, SST, MSIC, address fields |
| `app-ask-feature` | Ask chat feature | Multilingual Q&A, scope checker |
| `app-demo-mode` | Demo mode | Unlock, generate, clear sample data |
| `app-llm-keys` | Managing LLM keys | Add/edit/delete/reorder keys |
| `app-invoice-history` | Invoice history | Home screen list, search, filter |
| `app-auto-categorizer` | Auto-categorization | AI assigns classification codes with confidence scores |
| `app-language` | Language settings | EN, MS, ZH, Tamil support |
| `app-numbering-presets` | Numbering presets | Configurable invoice number patterns with custom tokens |

## Related Docs

- `docs/rag-design.md` — RAG architecture, retriever algorithm, limitations
