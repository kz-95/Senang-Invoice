import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const csvPath = resolve(root, 'src', 'data', 'classification-codes.csv')
const jsonPath = resolve(root, 'src', 'data', 'classification-codes.json')

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

const raw = readFileSync(csvPath, 'utf-8')
const lines = raw.split('\n').filter(l => l.trim() !== '')
if (lines.length < 2) {
  console.error('CSV has no data rows')
  process.exit(1)
}

const headers = parseCSVLine(lines[0])
const dataRows = lines.slice(1)

const entries = dataRows.map(row => {
  const vals = parseCSVLine(row)
  const entry: Record<string, unknown> = {}
  headers.forEach((h, i) => {
    entry[h] = vals[i] ?? ''
  })

  const keywords = String(entry.keywords || '')
    .split(';')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0)

  const examples = String(entry.examples || '')
    .split(';')
    .map(e => e.trim())
    .filter(e => e.length > 0)

  return {
    code: String(entry.code || '').trim(),
    description: String(entry.description || '').trim(),
    category: String(entry.category || '').trim(),
    keywords,
    examples,
    useWhen: String(entry.useWhen || '').trim(),
  }
})

// Validate: must have exactly 45 entries (001-045)
if (entries.length !== 45) {
  console.error(`Expected 45 entries, got ${entries.length}`)
  process.exit(1)
}

const codes = entries.map(e => e.code).sort()
for (let i = 1; i <= 45; i++) {
  const expected = String(i).padStart(3, '0')
  if (!codes.includes(expected)) {
    console.error(`Missing code: ${expected}`)
    process.exit(1)
  }
}

writeFileSync(jsonPath, JSON.stringify(entries, null, 2) + '\n', 'utf-8')
console.log(`Wrote ${entries.length} enriched classification codes to ${jsonPath}`)
