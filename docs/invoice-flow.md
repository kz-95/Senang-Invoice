# Senang-Invoice Flow Diagrams

> Auto-generated 2026-06-21 from source code analysis.

---

## 1. Invoice Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> draft: Create invoice

    state draft {
        [*] --> Pending: status = "draft"
    }

    draft --> validated: MyInvois validation succeeds
    draft --> draft: Re-edit & re-submit

    state validated {
        [*] --> Validated: status = "validated"
    }

    validated --> synced: Google Drive sync succeeds
    validated --> archived: User archives
    validated --> trash: User soft-deletes

    state synced {
        [*] --> Synced: status = "synced"
    }

    synced --> archived: User archives
    synced --> trash: User soft-deletes

    state archived {
        [*] --> Archived: archived = true
    }

    archived --> validated: User unarchives

    state trash {
        [*] --> Trash: deletedAt set
        [*] --> Purged: 30-day auto-purge
    }

    trash --> validated: User restores
    trash --> [*]: Hard delete / auto-purge

    note right of validated: UUID, longId, qrLink stored
```

### State Definitions

| Field | Values | Purpose |
|-------|--------|---------|
| `status` | `draft` / `validated` / `synced` | Core lifecycle |
| `archived` | `boolean` | Manual archive flag |
| `deletedAt` | `string` (ISO) or `undefined` | Soft-delete timestamp |

### Tab → Filter Mapping

| Tab | Filter |
|-----|--------|
| Pending | `status === 'draft'` AND `!archived` AND `!deletedAt` |
| Validated | `status === 'validated'` AND `!archived` AND `!deletedAt` |
| Synced | `status === 'synced'` AND `!archived` AND `!deletedAt` |
| Archived | `archived === true` AND `!deletedAt` |
| Trash | `deletedAt` is truthy |

---

## 2. Full Invoice Creation Flow

```mermaid
flowchart TD
    OPEN["Open Create Page<br/>src/app/(app)/create/page.tsx"] --> MODE["Choose Capture Mode<br/>CaptureModeSwitcher"]

    MODE --> CAM["📷 Camera<br/>CameraCapture.tsx<br/>Native: capacitor/camera<br/>Web: getUserMedia + file picker"]
    MODE --> VOICE["🎤 Voice<br/>VoiceCapture.tsx<br/>Native: capacitor-community/speech-recognition<br/>Web: SpeechRecognition API<br/>60s limit"]
    MODE --> MANUAL["✏️ Manual<br/>ManualEntryForm.tsx<br/>Description + qty + unitPrice"]

    CAM --> EXTRACT["useExtraction().extract()<br/>POST /api/extract"]
    VOICE --> EXTRACT
    MANUAL --> STORE["Add directly to invoiceStore.lines[]"]

    subgraph AI_PIPELINE["AI Extraction Pipeline"]
        EXTRACT --> S1["Stage 1: extractLineItems()<br/>LLM vision/text → raw items<br/>{description, qty, unitPrice}"]
        S1 --> S2["Stage 2: mapFields()<br/>RAG retriever + LLM →<br/>classificationCode, uom, taxType, confidence"]
    end

    S2 --> STORE
    STORE --> REVIEW["Review & Edit"]
    REVIEW --> TABLE["ExtractedItemsTable<br/>confidence scores"]
    REVIEW --> EDITOR["LineItemEditor<br/>classification, UOM, tax, qty, price"]
    REVIEW --> BUYER["BuyerSelector<br/>General (B2C) / Named (B2B + TIN)"]
    REVIEW --> NUMBER["Invoice Numbering<br/>preset + custom token + live preview"]
    REVIEW --> ADVANCED["Advanced Options (collapsible)<br/>discount, payment, due date, notes"]

    ADVANCED --> GENERATE["Click 'Generate Invoice'"]

    GENERATE --> FINALIZE["useInvoice().finalize()<br/>src/hooks/useInvoice.ts"]
    FINALIZE --> VALIDATE_CHECK["validate(): profile exists, ≥1 line item"]
    VALIDATE_CHECK --> FORMAT["formatInvoiceNumber(): auto-increment seq"]
    FORMAT --> UBL["buildUBL21(): UBL 2.1 JSON<br/>src/services/invoice/ublBuilder.ts"]

    UBL --> SUBMIT_MODE{"MyInvois credentials?"}
    SUBMIT_MODE -->|No| MOCK["Mock Validation<br/>validationService.mockValidate()<br/>→ fake UUID, longId, QR"]
    SUBMIT_MODE -->|Yes| SANDBOX["Sandbox Mode<br/>myInvoisClient.ts"]

    subgraph SANDBOX_FLOW["Real MyInvois Sandbox Flow"]
        SANDBOX --> OAUTH["OAuth2: POST /connect/token<br/>client_credentials"]
        OAUTH --> SUBMIT["POST /documentsubmissions<br/>base64(UBL) + SHA-256 hash"]
        SUBMIT --> POLL["Poll 8× at 4s intervals<br/>GET /documentsubmissions/{uid}"]
        POLL --> POLL_RESULT{"Result?"}
        POLL_RESULT -->|Valid| DETAILS["GET /documents/{uuid}/details<br/>→ longId, QR link"]
        POLL_RESULT -->|Invalid| REJECTIONS["rejections[] returned"]
        POLL_RESULT -->|Timeout| PENDING["status = 'pending'"]
    end

    MOCK --> DETERMINE{"Final status"}
    SANDBOX_FLOW --> DETERMINE
    DETERMINE -->|Success| VALIDATED["status = 'validated'"]
    DETERMINE -->|Fail| DRAFT["status = 'draft' (Pending tab)"]

    VALIDATED --> SAVE["Save to IndexedDB<br/>invoiceRepository.save()"]
    DRAFT --> SAVE
    SAVE --> DRIVE_SYNC["Background: Google Drive sync<br/>syncRepository.pushToDrive()"]
    DRIVE_SYNC --> NAV["Reset store + navigate to<br/>/invoice?id=..."]

    style OPEN fill:#4CAF50,color:#fff
    style GENERATE fill:#FF9800,color:#fff
    style VALIDATED fill:#4CAF50,color:#fff
    style DRAFT fill:#f44336,color:#fff
```

---

## 3. AI Extraction Architecture

```mermaid
flowchart TD
    subgraph BROWSER["Browser"]
        HOOK["useExtraction() hook<br/>src/hooks/useExtraction.ts"]
        STORE_Z["Zustand invoiceStore<br/>lines[]"]
    end

    subgraph API["Next.js API Route<br/>src/app/api/extract/route.ts"]
        ORCH["Orchestrator"]
        ORCH --> ES["extractionService.ts<br/>LLM Client (Gemini/DeepSeek)<br/>Gemini vision for images<br/>DeepSeek text for transcripts"]
        ORCH --> MS["mappingService.ts<br/>LLM Client + RAG Retriever"]
    end

    subgraph RAG["RAG System"]
        RET["retriever.ts<br/>Keyword-overlap matching<br/>MIN_SCORE=2 threshold<br/>KEEP_SHORT token set"]
        KB["irbm-knowledge.json<br/>36 chunks<br/>20 regulation + 4 MyInvois + 11 app + 1 taxonomy"]
        RET --> KB
    end

    subgraph LLM["LLM Providers"]
        GEMINI["Google Gemini<br/>gemini-2.5-flash"]
        DEEPSEEK["DeepSeek<br/>deepseek-v4-flash"]
        LLM_CLIENT["llmClient.ts<br/>Multi-provider factory<br/>Key rotation + cooldown<br/>Model fallback"]
    end

    HOOK -->|"POST<br/>x-llm-key (BYO, optional)<br/>x-llm-model<br/>x-llm-provider"| ORCH
    ES --> LLM_CLIENT --> GEMINI
    ES --> LLM_CLIENT --> DEEPSEEK
    MS --> LLM_CLIENT
    MS --> RAG
    ORCH -->|"MappedItems[]\nwith confidence 0-1"| HOOK
    HOOK --> STORE_Z

    style HOOK fill:#4CAF50,color:#fff
    style ORCH fill:#FF9800,color:#fff
    style RET fill:#00BCD4,color:#fff
    style LLM_CLIENT fill:#9C27B0,color:#fff
```

### LLM Key Flow

```
User BYO key (IndexedDB llmKeys table)
  ↓ sent as x-llm-key header
  ↓
/api/extract route
  ↓ tries user key first
  ↓ on 401/402/429 → falls back to server env SENANG_LLM_KEYS
  ↓
llmClient.failover()
  ↓ rotates through providers in priority order
  ↓ cooldowns rate-limited keys for 60s
  ↓
Returns result from first successful provider
```

---

## 4. Invoice History & Management Flow

```mermaid
flowchart TD
    DASH["Dashboard Page<br/>src/app/(app)/dashboard/page.tsx<br/>Route: /"] --> LOAD["useInvoiceList(): auto-refresh<br/>+ purgeExpired() 30-day trash"]
    LOAD --> STATS["Stats: total count, validated, RM amount"]
    STATS --> FILTERS["DateFilter + SearchBar + Sort"]
    FILTERS --> TABS{"Active Tab"}

    TABS -->|Pending| P["Filter: draft + active"]
    TABS -->|Validated| V["Filter: validated + active"]
    TABS -->|Synced| S["Filter: synced + active"]
    TABS -->|Archived| A["Filter: archived=true"]
    TABS -->|Trash| T["Filter: deletedAt set"]

    CARD["InvoiceCard<br/>src/components/invoice/InvoiceCard.tsx"]
    P --> CARD
    V --> CARD
    S --> CARD
    A --> CARD
    T --> CARD

    CARD --> ACTIONS["Per-card actions"]

    ACTIONS --> VIEW["View/Edit → /invoice?id=..."]
    ACTIONS --> ARCHIVE["Archive → invoiceRepository.archive()"]
    ACTIONS --> UNARCHIVE["Unarchive → invoiceRepository.unarchive()"]
    ACTIONS --> SOFTDEL["Soft Delete → invoiceRepository.softDelete()"]
    ACTIONS --> RESTORE["Restore → invoiceRepository.restoreFromTrash()"]
    ACTIONS --> HARDDEL["Delete Forever → invoiceRepository.hardDelete()"]

    ARCHIVE -->|"From: P/V/S"| A
    UNARCHIVE -->|"From: Archived"| V
    SOFTDEL -->|"From: Active/Archived"| T
    RESTORE -->|"From: Trash"| V
    HARDDEL --> GONE["Permanently removed from IndexedDB"]

    BULK["BulkActionBar<br/>Multi-select mode"]
    CARD -->|"Selection mode"| BULK
    BULK -->|"Bulk Archive"| A
    BULK -->|"Bulk Delete"| T
    BULK -->|"Bulk Restore"| V
    BULK -->|"Bulk Hard Delete"| GONE

    TRASH_PURGE["Auto-purge<br/>deletedAt > 30 days ago"]
    T --> TRASH_PURGE --> GONE
```

### Card Display

```
┌─────────────────────────────────────────────────┐
│ INV-2024-0001                ┌────────┐         │
│ Kedai Kopi Senang             │ Validated│         │
│ 15 Dec 2024                   └────────┘         │
│ RM 1,250.00                        ☁️ Synced    │
│                                    [···] Actions │
└─────────────────────────────────────────────────┘
```

---

## 5. Invoice Detail View/Edit

```mermaid
flowchart TD
    DETAIL["Invoice Detail Page<br/>src/app/(app)/invoice/page.tsx<br/>Route: /invoice?id=..."] --> LOAD_INV["Load invoice from IndexedDB<br/>invoiceRepository.findById()"]

    LOAD_INV --> MODE{"Mode"}
    MODE -->|Read| VIEW["View Mode"]
    MODE -->|Edit| EDIT["Edit Mode"]

    VIEW --> DISPLAY["Full invoice display"]
    DISPLAY --> SELLER["Seller info (TIN, BRN, SST, MSIC)"]
    DISPLAY --> BUYER_INFO["Buyer info (TIN, name, address)"]
    DISPLAY --> LINES["Line items table<br/>with classification codes"]
    DISPLAY --> TOTALS["Tax breakdown + totals"]
    DISPLAY --> QR["QR Badge + UUID"]

    EDIT --> WARNING["⚠️ Warning if validated invoice<br/>'Official corrections via credit/debit note'"]
    EDIT --> EDIT_META["Edit metadata<br/>notes, discount, payment, supplier ref, buyer details"]
    EDIT_META --> SAVE_META["invoiceRepository.updateMetadata()"]

    DISPLAY --> DOWNLOAD["Download PDF<br/>pdfService.downloadInvoicePdf()<br/>Generated on-demand (not cached)"]
    DISPLAY --> ARCHIVE_DEL["Archive / Delete / Restore"]
```

---

## 6. Data Storage Architecture

```mermaid
flowchart TD
    subgraph FRONTEND["React Frontend"]
        PAGES["Pages<br/>Create / Dashboard / Invoice / Ask / Profile / Settings"]
        HOOKS["Hooks<br/>useInvoice / useExtraction / useInvoiceList / useProfile"]
        STORES["Zustand Stores<br/>invoiceStore / invoiceListStore / profileStore / demoStore / uiStore / llmKeyStore / askStore"]
        REPOS["Repository Layer"]
    end

    subgraph DB["IndexedDB (Dexie.js)<br/>SenangInvoiceDb v4"]
        INV["invoices<br/>id, status, createdAt, archived, deletedAt"]
        PDF_T["pdfs (legacy)"]
        SETTINGS["settings<br/>key-value: Drive tokens, folder ID"]
        LLM_KS["llmKeys<br/>encrypted BYO API keys"]
        MYINV["myInvoisCreds<br/>client ID / secret"]
    end

    subgraph DRIVE["Google Drive Sync"]
        AUTH["driveAuth.ts<br/>Web: GIS OAuth2 popup<br/>APK: not yet functional"]
        SYNC_S["driveSyncService.ts<br/>Upload: multipart<br/>Update: PATCH<br/>Trash: propagate to Drive"]
        SYNC_R["syncRepository.ts<br/>pushToDrive()<br/>pullAllFromDrive()<br/>syncAll()"]
    end

    subgraph SERVICES["Backend Services"]
        AI["AI Pipeline<br/>extractionService + mappingService + llmClient"]
        UBL_S["UBL Builder<br/>ublBuilder.ts"]
        MYI_S["MyInvois<br/>myInvoisClient + validationService + submissionService"]
        PDF_S["PDF Service<br/>pdfService.ts (pdf-lib)"]
        RAG_S["RAG<br/>retriever.ts + irbm-knowledge.json"]
    end

    PAGES --> HOOKS
    HOOKS --> STORES
    HOOKS --> SERVICES
    STORES --> REPOS
    REPOS --> DB
    REPOS --> DRIVE

    style DB fill:#FFD54F,color:#333
    style DRIVE fill:#81C784,color:#fff
    style SERVICES fill:#64B5F6,color:#fff
```

### Repositories

| Repository | File | Operations |
|---|---|---|
| `invoiceRepository` | `src/services/data/invoiceRepository.ts` | CRUD, archive, soft/hard delete, restore, bulk ops, metadata updates |
| `profileRepository` | `src/services/data/profileRepository.ts` | Seller profile CRUD, numbering presets |
| `syncRepository` | `src/services/data/syncRepository.ts` | Drive push/pull, conflict detection, sync-all |
| `llmKeyRepository` | `src/services/data/llmKeyRepository.ts` | Encrypted LLM key storage |
| `myInvoisCredsRepository` | `src/services/data/myInvoisCredsRepository.ts` | MyInvois API credentials |
| `settingsRepository` | `src/services/data/settingsRepository.ts` | Key-value settings |
| `numberingPresetRepository` | `src/services/data/numberingPresetRepository.ts` | Numbering preset CRUD |

---

## 7. Component Tree & Routing

```mermaid
graph TD
    APP["AppShell<br/>min-h-dvh flex flex-col"] --> TOPBAR["TopBar (shrink-0)"]
    APP --> BANNER["DemoBanner (conditional, shrink-0)"]
    APP --> MAIN["&lt;main&gt; flex-1 overflow-y-auto<br/>max-w-2xl mx-auto px-4 py-4"]
    APP --> NAV["BottomNav (fixed bottom-0 z-40, lg:hidden)"]
    APP --> SNACK["Snackbar"]
    APP --> FAB["Fab (conditional)"]

    MAIN --> CREATE["/create — CreatePage"]
    MAIN --> DASH["/ — Dashboard"]
    MAIN --> INVOICE["/invoice?id=... — InvoiceDetail"]
    MAIN --> ASK["/ask — AskPage"]
    MAIN --> SETTINGS["/settings — SettingsPage"]
    MAIN --> PROFILE["/profile — ProfilePage"]

    CREATE --> TOOLBOX["Toolbox (shrink-0, border-t, shadow)<br/>▼ Add Items toggle | max-h 50vh"]
    CREATE --> ITEMS["ExtractedItemsTable"]
    CREATE --> EDITOR["LineItemEditor"]
    CREATE --> BUYER["BuyerSelector"]
    CREATE --> NUMBER["Invoice Numbering"]
    CREATE --> ADVANCED["Advanced (collapsible)"]
    CREATE --> GENERATE["Generate Button"]

    TOOLBOX --> CAMERA["CameraCapture"]
    TOOLBOX --> VOICE["VoiceCapture"]
    TOOLBOX --> MANUAL["ManualEntryForm"]

    DASH --> STATS["Stats Tiles"]
    DASH --> DATEFILTER["DateFilter (presets + range)"]
    DASH --> SEARCH["SearchBar + Sort"]
    DASH --> TABS["5 Tabs: Pending|Validated|Synced|Archived|Trash"]
    DASH --> CARDS["InvoiceCard[] list"]
    DASH --> BULKBAR["BulkActionBar"]

    NAV --> NAV_ASK["Ask"]
    NAV --> NAV_HOME["Home"]
    NAV --> NAV_FAB["➕ Create (FAB)"]
    NAV --> NAV_PROFILE["Profile"]
    NAV --> NAV_SETTINGS["Settings"]
```

---

## 8. Invoice Data Model

```typescript
Invoice {
  id: string                        // UUID or "demo-inv-*" for demo
  status: 'draft' | 'validated' | 'synced'
  archived: boolean
  deletedAt?: string                // ISO timestamp for soft-delete
  invoiceNumber: string
  issueDate: string
  dueDate?: string

  seller: {
    tin: string
    brn?: string
    sstRegNo?: string
    msicCode?: string
    name: string
    address: Address
    contact: { email, phone }
  }

  buyer: {
    type: 'general' | 'named'
    tin?: string                    // "EI00000000010" for general public
    name?: string
    address?: Address
  }

  lines: LineItem[] {
    description: string
    quantity: number
    unitPrice: number
    uom: string                     // UN/ECE Rec 20 (e.g., "C62" = one)
    taxType: '01' | '02' | '06' | 'E'
    taxAmount: number
    totalExcludingTax: number
    classificationCode?: string     // IRBM classification code
    confidence?: number             // 0-1 from AI extraction
  }

  totals: {
    totalExcludingTax: number
    taxTotals: { [taxType: string]: number }
    totalPayable: number
    discount?: { reason: string, amount: number }
  }

  payment?: {
    paymentMeansCode: string        // 01=cash, 02=cheque, etc.
    paymentTerms?: string
  }

  validation?: {
    uuid: string
    longId: string
    qrLink: string
    validatedAt: string
    status: 'mock' | 'valid' | 'invalid' | 'pending'
    submissionUid?: string
    rejections?: string[]
  }

  sync?: {
    driveFileId?: string
    driveSyncedAt?: string
    localModifiedAt?: string
  }

  notes?: string
  supplierRef?: string
  createdAt: string
  updatedAt: string
}
```

---

## 9. API Routes

| Method | Route | File | Purpose |
|--------|-------|------|---------|
| POST | `/api/submit` | `src/app/api/submit/route.ts` | Submit UBL to MyInvois (mock or sandbox) |
| POST | `/api/extract` | `src/app/api/extract/route.ts` | Extract items + map classification codes |
| POST | `/api/ask` | `src/app/api/ask/route.ts` | RAG-powered chat |
| POST | `/api/ocr` | `src/app/api/ocr/route.ts` | OCR endpoint |
| POST | `/api/llm/models` | `src/app/api/llm/models/route.ts` | List available LLM models |
| POST | `/api/contact` | `src/app/api/contact/route.ts` | Contact form |

---

## 10. Key Files Index

### Pages
- `src/app/(app)/create/page.tsx` — Invoice creation with capture, review, generate
- `src/app/(app)/dashboard/page.tsx` — History with 5 tabs, stats, search, sort, bulk
- `src/app/(app)/invoice/page.tsx` — Single invoice view/edit, PDF download, QR display
- `src/app/(app)/ask/page.tsx` — RAG chat with scope checker
- `src/app/(app)/profile/page.tsx` — Seller profile, numbering presets, MyInvois creds
- `src/app/(app)/settings/page.tsx` — LLM keys, language, demo mode

### Core Hooks
- `src/hooks/useInvoice.ts` — `finalize()`: UBL build + validation + save + sync
- `src/hooks/useExtraction.ts` — Calls `/api/extract`, adds items to store
- `src/hooks/useInvoiceList.ts` — Auto-refreshes dashboard list

### State Management
- `src/stores/invoiceStore.ts` — Create-page state: `lines[]`, `buyer`
- `src/stores/invoiceListStore.ts` — Dashboard state: `invoices[]`, refresh, remove
- `src/stores/profileStore.ts` — Current seller profile
- `src/stores/demoStore.ts` — Demo mode flag

### AI/Extraction
- `src/services/ai/extractionService.ts` — LLM item extraction from images/transcripts
- `src/services/ai/mappingService.ts` — Classification code + UOM mapping via RAG + LLM
- `src/services/ai/llmClient.ts` — Multi-provider LLM client with failover
- `src/services/rag/retriever.ts` — Keyword-overlap RAG retriever
- `src/data/irbm-knowledge.json` — 36 RAG knowledge chunks

### Invoice Services
- `src/services/invoice/ublBuilder.ts` — Builds UBL 2.1 JSON
- `src/services/invoice/validationService.ts` — Mock validation
- `src/services/invoice/submissionService.ts` — Routes mock vs sandbox
- `src/services/invoice/myInvoisClient.ts` — Real MyInvois sandbox API client
- `src/services/invoice/qrService.ts` — QR code PNG generation
- `src/services/invoice/pdfService.ts` — On-demand PDF generation (pdf-lib)

### Data Layer
- `src/services/data/db.ts` — IndexedDB schema (Dexie.js, SenangInvoiceDb v4)
- `src/services/data/invoiceRepository.ts` — Full invoice CRUD + lifecycle ops
- `src/services/data/syncRepository.ts` — Google Drive push/pull/sync

### Drive Sync
- `src/services/drive/driveAuth.ts` — Google OAuth (native + web)
- `src/services/drive/driveSyncService.ts` — Drive file CRUD

### Layout
- `src/components/layout/AppShell.tsx` — Root layout wrapper
- `src/components/layout/BottomNav.tsx` — 5-tab bottom nav
- `src/components/layout/DemoBanner.tsx` — Demo mode banner + auto-seed
```
