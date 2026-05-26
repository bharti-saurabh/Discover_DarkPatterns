import { useState, useCallback } from 'react'

export interface ApiConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const STORAGE_KEY = 'capone_demo_api_config'

const DEFAULTS: ApiConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'claude-opus-4-7',
}

function load(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function useApiConfig() {
  const [config, setConfig] = useState<ApiConfig>(load)

  const save = useCallback((next: ApiConfig) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* no-op */ }
    setConfig(next)
  }, [])

  const clear = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* no-op */ }
    setConfig({ ...DEFAULTS })
  }, [])

  const isConfigured = config.apiKey.trim().length > 10

  return { config, save, clear, isConfigured }
}
