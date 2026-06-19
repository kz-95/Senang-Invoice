'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { llmKeyRepository } from '@/services/data/llmKeyRepository'
import type { LlmKeyRow } from '@/services/data/db'
import { useLlmKeyStore } from '@/stores/llmKeyStore'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { CredentialHint } from '@/components/settings/CredentialHint'
import { apiBase } from '@/lib/apiBase'

const providerOptions = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'ollama', label: 'Ollama (local)' },
]

const providerPlaceholders: Record<string, { url: string; key: string; model: string }> = {
  anthropic: { url: 'https://api.anthropic.com', key: 'sk-ant-api03-...', model: 'claude-opus-4-8' },
  openai:     { url: 'https://api.openai.com',       key: 'sk-proj-...',           model: 'gpt-4o-mini' },
  deepseek:   { url: 'https://api.deepseek.com',     key: 'sk-...',                model: 'deepseek-chat' },
  gemini:     { url: 'https://generativelanguage.googleapis.com/v1beta', key: 'AIza...', model: 'gemini-2.5-flash' },
  ollama:     { url: 'http://localhost:11434',        key: 'ollama',                model: 'llama3.2' },
}

const providerSteps: Record<string, string[]> = {
  anthropic: [
    'Go to console.anthropic.com and sign in.',
    'Open Settings → API Keys → Create Key.',
    'Copy the key (starts with sk-ant-api03-) and paste it below.',
  ],
  openai: [
    'Go to platform.openai.com/api-keys and sign in.',
    'Click Create new secret key.',
    'Copy the key (starts with sk-proj-) and paste it below.',
  ],
  deepseek: [
    'Go to platform.deepseek.com and sign in.',
    'Open API Keys → Create new API key.',
    'Copy the key (starts with sk-) and paste it below.',
  ],
  gemini: [
    'Go to aistudio.google.com/apikey and sign in.',
    'Click Create API key.',
    'Copy the key (starts with AIza) and paste it below.',
  ],
  ollama: [
    'Install Ollama locally (ollama.com) and run a model.',
    'No API key needed - leave the key blank.',
    'Set the URL to your local Ollama (default http://localhost:11434).',
  ],
}

const providerColors: Record<string, string> = {
  anthropic: 'bg-orange-100 text-orange-700',
  openai:    'bg-green-100 text-green-700',
  deepseek:  'bg-blue-100 text-blue-700',
  gemini:    'bg-purple-100 text-purple-700',
  ollama:    'bg-gray-200 text-gray-700',
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••'
  return key.slice(0, 7) + '••••' + key.slice(-4)
}

export function LlmKeyManager() {
  const [keys, setKeys] = useState<LlmKeyRow[]>([])
  const [expanded, setExpanded] = useState(false)
  const [openKeyId, setOpenKeyId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [provider, setProvider] = useState('anthropic')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [status, setStatus] = useState('')
  const dragIdx = useRef<number | null>(null)

  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editApiKey, setEditApiKey] = useState('')
  const [editBaseUrl, setEditBaseUrl] = useState('')

  const pp = providerPlaceholders[provider]

  const version = useLlmKeyStore(s => s.version)

  const refresh = async () => {
    const all = await llmKeyRepository.getAll()
    setKeys(all)
  }

  useEffect(() => { refresh() }, [version])

  useEffect(() => {
    setModel(pp.model)
    setBaseUrl(pp.url)
  }, [provider])

  const fetchModels = useCallback(async () => {
    setFetchingModels(true)
    try {
      const res = await fetch(`${apiBase()}/api/llm/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey || undefined, baseUrl: baseUrl || undefined }),
      })
      if (res.ok) {
        const data = await res.json() as { models: string[] }
        setModels(data.models)
        if (data.models.length > 0 && !data.models.includes(model)) {
          setModel(data.models[0])
        }
      }
    } catch { /* keep defaults */ }
    finally { setFetchingModels(false) }
  }, [provider, apiKey, baseUrl, model])

  const add = async () => {
    if (!label || !model) return
    if (provider !== 'ollama' && !apiKey) return
    await llmKeyRepository.save({
      id: crypto.randomUUID(),
      label,
      provider,
      apiKey: apiKey || 'ollama',
      model,
      baseUrl: baseUrl || undefined,
      isActive: true,
      isFallback,
      priority: keys.length,
      createdAt: new Date().toISOString(),
    })
    setLabel('')
    setApiKey('')
    setModel(pp.model)
    setBaseUrl(pp.url)
    setIsFallback(false)
    setStatus('Key added ✓')
    setTimeout(() => setStatus(''), 3000)
    await refresh()
  }

  const remove = async (id: string) => {
    await llmKeyRepository.remove(id)
    setOpenKeyId(null)
    await refresh()
  }

  const startEdit = (key: LlmKeyRow) => {
    setEditingKeyId(key.id)
    setEditLabel(key.label)
    setEditModel(key.model)
    setEditApiKey(key.apiKey)
    setEditBaseUrl(key.baseUrl ?? '')
  }

  const cancelEdit = () => {
    setEditingKeyId(null)
  }

  const saveEdit = async (key: LlmKeyRow) => {
    if (!editLabel || !editModel) return
    await llmKeyRepository.save({
      ...key,
      label: editLabel,
      model: editModel,
      apiKey: editApiKey || key.apiKey,
      baseUrl: editBaseUrl || undefined,
    })
    setEditingKeyId(null)
    await refresh()
  }

  const toggleActive = async (key: LlmKeyRow) => {
    await llmKeyRepository.save({ ...key, isActive: !key.isActive })
    await refresh()
  }

  const toggleFallback = async (key: LlmKeyRow) => {
    await llmKeyRepository.save({ ...key, isFallback: !key.isFallback })
    await refresh()
  }

  // Drag & drop reorder
  const onDragStart = (idx: number) => {
    dragIdx.current = idx
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = async (dropIdx: number) => {
    const drag = dragIdx.current
    if (drag === null || drag === dropIdx) return
    dragIdx.current = null

    const reordered = [...keys]
    const [moved] = reordered.splice(drag, 1)
    reordered.splice(dropIdx, 0, moved)

    // Update priorities
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].priority !== i) {
        await llmKeyRepository.save({ ...reordered[i], priority: i })
      }
    }
    await refresh()
  }

  const cycleOpen = (id: string) => {
    setOpenKeyId(openKeyId === id ? null : id)
    setEditingKeyId(null)
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Section header */}
      <button
        onClick={() => { setExpanded(!expanded); setOpenKeyId(null) }}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="font-semibold text-gray-900">LLM API Keys</h3>
          <p className="text-sm text-gray-500">Stored locally. Priority runs top-to-bottom.</p>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {!expanded && keys.length > 0 && (
        <p className="text-xs text-gray-400">
          {keys.length} key{keys.length !== 1 ? 's' : ''} · {keys.filter(k => k.isActive).length} active
        </p>
      )}

      {expanded && (
        <>
          {/* Key list - numbered, collapsible, draggable */}
          {keys.length > 0 && (
            <div className="space-y-1">
              {keys.map((k, idx) => {
                const isOpen = openKeyId === k.id
                return (
                  <div
                    key={k.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(idx)}
                    className={`rounded-lg border transition-all ${k.isActive ? 'border-gray-200' : 'border-gray-100 opacity-50'} ${isOpen ? 'bg-white shadow-sm' : 'bg-gray-50'}`}
                  >
                    {/* Collapsed row */}
                    <div
                      onClick={() => cycleOpen(k.id)}
                      className="flex items-center gap-2 p-2 cursor-pointer select-none"
                    >
                      {/* Drag handle */}
                      <span
                        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                      </span>

                      {/* Priority number */}
                      <span className="text-xs font-mono text-gray-400 w-4 text-center flex-shrink-0">
                        {idx + 1}
                      </span>

                      {/* Label + badges */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
                        <span className="font-medium truncate">{k.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${providerColors[k.provider] || 'bg-gray-100 text-gray-600'}`}>
                          {k.provider}
                        </span>
                        {k.isFallback && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">fallback</span>}
                      </div>

                      {/* Masked key */}
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0 hidden sm:inline">
                        {maskKey(k.apiKey)}
                      </span>

                      {/* Expand chevron */}
                      <svg className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>

                    {/* Expanded details */}
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                        {editingKeyId === k.id ? (
                          <div className="space-y-2">
                            <Input label="Label" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                            <Input label="Model" value={editModel} onChange={e => setEditModel(e.target.value)} />
                            <Input label="API Key" type="password" value={editApiKey} onChange={e => setEditApiKey(e.target.value)} />
                            <Input label="Base URL" value={editBaseUrl} onChange={e => setEditBaseUrl(e.target.value)} placeholder={pp.url} />
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="primary" onClick={() => saveEdit(k)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Model</span>
                                <p className="font-mono text-gray-700">{k.model}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">API Key</span>
                                <p className="font-mono text-gray-700">{maskKey(k.apiKey)}</p>
                              </div>
                              {k.baseUrl && (
                                <div className="col-span-2">
                                  <span className="text-gray-400">URL</span>
                                  <p className="font-mono text-gray-700 truncate">{k.baseUrl}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                onClick={() => toggleActive(k)}
                                className={`text-xs px-2 py-1 rounded ${k.isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {k.isActive ? 'Active' : 'Paused'}
                              </button>
                              <button
                                onClick={() => toggleFallback(k)}
                                className={`text-xs px-2 py-1 rounded ${k.isFallback ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {k.isFallback ? 'Fallback' : 'Primary'}
                              </button>
                              <button onClick={() => startEdit(k)} className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100">
                                Edit
                              </button>
                              <button onClick={() => remove(k.id)} className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 ml-auto">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add form */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700">Add Key</h4>

            <CredentialHint title={`How to get a ${provider} key`} steps={providerSteps[provider] ?? []} />

            <Input
              label="Label *"
              placeholder="My production key"
              value={label}
              onChange={e => setLabel(e.target.value)}
              helperText="A name to identify this key (e.g. 'Claude Prod', 'GPT Fallback')"
            />

            <Select
              label="Provider *"
              options={providerOptions}
              value={provider}
              onChange={e => { setProvider(e.target.value); setModels([]) }}
            />

            <Input
              label="URL"
              placeholder={pp.url}
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              helperText={`Default: ${pp.url}. Only change if using a proxy or custom endpoint.`}
            />

            <Input
              label={provider === 'ollama' ? 'API Key' : 'API Key *'}
              type="password"
              placeholder={provider === 'ollama' ? 'leave blank for local (no key needed)' : pp.key}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              helperText={
                provider === 'ollama'
                  ? 'Ollama runs locally - no API key required. Leave blank.'
                  : provider === 'anthropic'
                    ? 'Starts with sk-ant-api03-. Create at console.anthropic.com.'
                    : provider === 'deepseek'
                      ? 'Starts with sk-. Create at platform.deepseek.com.'
                      : provider === 'gemini'
                        ? 'Starts with AIza. Create at aistudio.google.com/apikey.'
                        : 'Starts with sk-. Create at platform.openai.com.'
              }
            />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Model *</label>
              <div className="flex gap-2">
                {models.length > 0 ? (
                  <Select
                    options={models.map(m => ({ value: m, label: m }))}
                    value={model}
                    onChange={e => setModel(e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={pp.model}
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="flex-1"
                  />
                )}
                <Button variant="outline" size="sm" onClick={fetchModels} loading={fetchingModels} type="button">
                  {fetchingModels ? '...' : 'Fetch'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {fetchingModels
                  ? 'Loading available models...'
                  : models.length > 0
                    ? `Fetched ${models.length} models. Click Fetch to refresh.`
                    : `Type a model ID or click Fetch to list from ${provider}.`}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFallback} onChange={e => setIsFallback(e.target.checked)} className="rounded border-gray-300" />
              Fallback (tried last)
            </label>

            <div className="flex items-center gap-2">
              <Button onClick={add} disabled={!label || !model || (provider !== 'ollama' && !apiKey)}>Add Key</Button>
              {status && <span className="text-sm text-green-600">{status}</span>}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
