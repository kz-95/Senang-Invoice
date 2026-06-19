// Minimal `process.env` so app modules that read env vars at module load
// (src/lib/constants.ts, services/data/llmKeyRepository.ts, etc.) don't throw
// "process is not defined" in the standalone browser bundle. Imported FIRST in
// ds-entry.tsx so it evaluates before any component module.
const g = globalThis as unknown as { process?: { env: Record<string, string | undefined> } }
if (!g.process) g.process = { env: {} }
else if (!g.process.env) g.process.env = {}
export {}
