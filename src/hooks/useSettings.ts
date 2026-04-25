import { useState, useCallback } from 'react'
import { AppSettings } from '../types'

const STORAGE_KEY = 'novel-studio-settings'

const DEFAULTS: AppSettings = {
  variant: 'parchment',
  fontSize: 17,
  lineHeight: 2,
  showAI: true,
  lang: 'en',
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
    } catch { /* ignore */ }
    return DEFAULTS
  })

  const setSetting = useCallback((key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return [settings, setSetting] as const
}
