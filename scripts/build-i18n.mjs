import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const csvPath = resolve(root, 'src', 'data', 'i18n', 'strings.csv')
const jsonPath = resolve(root, 'src', 'data', 'i18n', 'strings.json')

/** @param {string} line @returns {string[]} */
function parseCSVLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
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
const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '')

if (lines.length < 2) {
  console.error('CSV has no data rows')
  process.exit(1)
}

const headers = parseCSVLine(lines[0])
// headers: key, en, ms, zh
const langColumns = headers.slice(1) // ['en','ms','zh']

/** @type {Record<string, Record<string, string>>} */
const result = {}

for (const line of lines.slice(1)) {
  const vals = parseCSVLine(line)
  const key = vals[0]
  if (!key) continue

  /** @type {Record<string, string>} */
  const row = {}
  for (let i = 0; i < langColumns.length; i++) {
    const val = vals[i + 1] ?? ''
    if (val !== '') {
      row[langColumns[i]] = val
    }
  }

  if (Object.keys(row).length > 0) {
    result[key] = row
  }
}

mkdirSync(dirname(jsonPath), { recursive: true })
writeFileSync(jsonPath, JSON.stringify(result, null, 2) + '\n', 'utf-8')
console.log(`Wrote ${Object.keys(result).length} translation keys to ${jsonPath}`)
