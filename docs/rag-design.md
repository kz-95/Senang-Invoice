# RAG Design - SenangInvoice Ask Feature

**Date:** 2026-06-21

## Overview

The Ask feature provides multilingual Q&A about Malaysian e-invoicing (MyInvois). It uses a basic keyword-overlap RAG pattern to ground LLM responses in official IRBM knowledge. The same retriever now also powers a **non-LLM degraded reply** that is served whenever no LLM key is available **or** a provider returns a rate limit (429/402).

## Scope: RAG ≠ the Magic Auto-Categorizer

This doc covers **only the Ask chatbot's RAG**. The "magic auto-categorizer" is a **separate pipeline**:

- **Categorizer** (`services/ai/extractionService` → `mappingService`): capture → extract raw items (description/qty/price) → map each line to IRBM `classificationCode` + UOM + `taxType` + `taxAmount`.
- **Ask-RAG** (this doc, `services/rag/*`): retrieves IRBM guideline chunks to ground free-text Q&A.

✅ **Status (2026-06-21):** the earlier gaps are closed.
1. `mappingService.mapFields` **is wired** into `/api/extract` (and the on-device `nodejs/index.js` mirror) via `extractAndMap()`, so extracted lines arrive with `classificationCode` + UOM populated.
2. `retriever.retrieveCodes(description, k)` exists and retrieves **candidate codes + classification rule chunks** instead of dumping the whole catalog.

## Magic Auto-Categorizer - RAG Pipeline

The categorizer follows the classic RAG shape **Input → Extract → Retrieve → Analyze → Output**:

```
Input        capture: receipt image | voice transcript | manual entry
  │
  ▼
Extract      extractionService → raw items [{ description, qty, unitPrice }]
  │            (codes intentionally blank)
  ▼            per item.description
Retrieve      retriever.retrieveCodes() over TWO sources:
  │            (a) classification catalog  (code → description)  → top-k candidate codes
  │            (b) IRBM rule chunks (classification, classification-categories,
  │                how-to-choose-code, b2b-b2c-b2g)             → relevant rules
  ▼
Analyze       mappingService (LLM): item + candidate codes + rules
  │            → classificationCode + UOM (UN/ECE) + taxType + taxAmount + confidence
  ▼
Output        categorized line items → Review screen
               (low-confidence lines flagged for the user to confirm)
```

### Component mapping
| Stage | Module | Status |
|-------|--------|--------|
| Input | `CaptureModeSwitcher` + Camera/Voice/Manual | built |
| Extract | `extractionService` (`/api/extract`) | built |
| Retrieve | `retriever.retrieveCodes(description, k)` over catalog + rule chunks | built |
| Analyze | `mappingService` (fed retrieved candidates, emits `confidence`) | built + wired |
| Output | `ExtractedItemsTable` / `LineItemEditor`, confidence flag | built |

### Why retrieve (vs a flat 45-code dump)
- **Ambiguous items** ("catering", "consultation + parts") get the *relevant* codes + the IRBM rule that disambiguates good-vs-service - better accuracy.
- **Scales** if the catalog grows beyond 45 (MSIC, product tariff codes) where a full dump would blow the prompt.
- **Cheaper / sharper prompt** - only candidate codes in context, not the whole list.

## Architecture (Ask)

```
User question (ms/en/zh)
       │
       ▼
┌─────────────────────────────────┐
│  retriever.ts: retrieve(q, k=3) │
│  Keyword-overlap, MIN_SCORE=2   │
└──────────────┬──────────────────┘
               │ top-3 chunks (≥2 term matches)
               ▼
┌─────────────────────────────────┐
│  askService.ts: answer()        │
│  Has LLM client? inject chunks  │
│  No client / 429 → degradedAnswer│
└──────────────┬──────────────────┘
               │ system + context + messages
               ▼
┌─────────────────────────────────┐
│  llmClient (Gemini/DeepSeek)   │
│  Returns answer in detected lang│
└─────────────────────────────────┘
```

## Components

### 1. Knowledge Store (`knowledgeStore.ts`)
- Loads `irbm-knowledge.json` - **36 static chunks** (IRBM regulations, MyInvois procedures, app usage)
- Each chunk: `{ id, topic, text }`
- Imported as a static JSON module, no runtime updates

### 2. Retriever (`retriever.ts`)
- **Algorithm:** Term-overlap scoring
- Tokenizes query: lowercase, split on whitespace, keep terms > 2 chars **or** in the `KEEP_SHORT` allow-list
- `KEEP_SHORT` preserves critical short tokens otherwise dropped by the length filter: `b2b/b2c/b2g`, language codes (`ms/en/zh/my`), `qr/ai/rm/id/tin/sst`, and the two-digit tax/doc-type codes (`01`-`09`)
- Scores each chunk by counting query terms found in `topic + text`
- Returns top-k chunks with **score ≥ `MIN_SCORE` (2)**, sorted by score desc - a single matching term no longer leaks a chunk
- **No** embeddings, vector search, TF-IDF, or BM25
- `retrieveCodes(description, k)` is a separate entry point for the categorizer: scores the classification catalog by keyword, returns top-k candidate codes (normalized 0-1) + the 4 classification rule chunks, always including the `045` general fallback code

### 3. Knowledge Chunks (`irbm-knowledge.json`) - 36 chunks

#### IRBM Regulations (20)
| ID | Topic |
|----|-------|
| exemption | RM1m exemption rule |
| phases | Implementation phases |
| consolidated | Consolidated invoice rules |
| non-consolidatable | Non-consolidatable categories |
| correction | 72-hour correction window |
| penalties | Penalties for non-compliance |
| tin-format | TIN format requirements |
| ubl | UBL 2.1 format |
| qr-code | QR code requirement |
| classification | IRBM classification codes |
| classification-categories | Classification code categories |
| how-to-choose-code | Selecting classification codes |
| b2b-b2c-b2g | B2B vs B2C vs B2G |
| credit-debit-notes | Credit and debit notes |
| self-billed | Self-billed e-invoices |
| common-errors | Common validation errors |
| voluntary-opt-in | Voluntary opt-in |
| foreign-currency | Foreign currency handling |
| record-keeping | Record keeping |
| payment-timeline | Submission timeline |

#### MyInvois Procedures (4)
| ID | Topic |
|----|-------|
| registration-procedure | How to register |
| issuance-workflow | Issuance process |
| portal-usage | MyInvois portal |
| api-integration | API integration |

#### App Usage (12)
| ID | Topic |
|----|-------|
| app-how-to-create | Creating invoices |
| app-capture-modes | Camera/Voice/Manual |
| app-ai-extraction | AI extraction (vision + LLM) |
| app-auto-categorizer | Magic auto-categorizer |
| app-language | Language switching (ms/en/zh) |
| app-numbering-presets | Invoice numbering presets |
| app-seller-profile | Setting up profile |
| app-ask-feature | Ask chat feature |
| app-demo-mode | Demo mode |
| app-llm-keys | Managing LLM keys |
| app-invoice-history | Invoice history |
| app-navigation | Bottom navigation tabs |

### 4. Augmentation (`askService.ts`)
- Retrieves top-3 chunks for the user query
- Formats context: `[topic]: text` per chunk
- Appends to system prompt: `"Knowledge:\n[exemption]: ...\n[phases]: ..."`
- LLM receives the augmented system prompt + conversation history

### 5. Degraded / non-LLM path (`askService.ts:degradedAnswer`)
- Exported pure function that builds a reply **only from retrieved chunks** (no LLM call)
- Used when: (a) no LLM key is configured anywhere, or (b) a provider returns **429/402** - the ask/extract routes and `nodejs/index.js` catch `RateLimitError` (see `llmClient.isRateLimitError`) and serve this immediately instead of rotating keys / retrying
- 0 chunks → a localized "no matching IRBM knowledge" hint; ≥1 chunk → bulleted chunk text + a "add an AI key for a direct answer" footer
- Always returns `{ text, lang, degraded: true }`

### 6. Language Detection (`askService.ts:detectLang`)
- Keyword-based: checks for Malay, Chinese, English word patterns
- Returns: `ms`, `zh`, or `en` (rojak dropped 2026-06-20)

## Limitations

1. **No semantic search** - keyword overlap only; `"cukai"` won't match `"tax"`
2. **No cross-language retrieval** - Malay query only matches Malay chunks
3. **Static knowledge** - 36 chunks, hardcoded in JSON, no update mechanism
4. **Coarse relevance threshold** - `MIN_SCORE=2` blocks single-term leaks but is still a flat count, not a normalized relevance score
5. **No chunk deduplication** - multiple similar chunks can crowd out diverse ones
6. **Length filter needs an allow-list** - short critical terms (`TIN`, `QR`, `B2C`, tax codes) only survive because they are hardcoded in `KEEP_SHORT`; a new short term must be added there manually

## Improvement Opportunities

| Area | Current | Better |
|------|---------|--------|
| Retrieval | Keyword overlap, `MIN_SCORE=2` | TF-IDF, BM25, or embeddings |
| Matching | Exact substring | Stemming, synonyms, BM cross-language |
| Storage | Static JSON, 36 chunks | Indexed by language, updatable |
| Threshold | Flat term count ≥ 2 | Normalized relevance cutoff |
| Short terms | Hardcoded `KEEP_SHORT` allow-list | Stopword-aware tokenizer |
| Query expansion | None | BM/Malay synonym mapping |
