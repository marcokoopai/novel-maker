import { useEffect, useMemo, useRef, useState } from 'react'

const LOCK_KEY = 'novel-studio-editor-lock'
const LOCK_TTL_MS = 7000
const RENEW_MS = 2500

interface EditorLock {
  tabId: string
  novelId: string
  expiresAt: number
}

function readLock(): EditorLock | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EditorLock
  } catch {
    return null
  }
}

function writeLock(lock: EditorLock) {
  localStorage.setItem(LOCK_KEY, JSON.stringify(lock))
}

export function useSingleEditorTab(novelId: string) {
  const tabId = useMemo(() => crypto.randomUUID(), [])
  const [blocked, setBlocked] = useState(false)
  const ownsLockRef = useRef(false)

  useEffect(() => {
    const claim = () => {
      const now = Date.now()
      const current = readLock()
      const currentIsActive = current && current.expiresAt > now && current.tabId !== tabId

      if (currentIsActive) {
        ownsLockRef.current = false
        setBlocked(true)
        return
      }

      ownsLockRef.current = true
      setBlocked(false)
      writeLock({ tabId, novelId, expiresAt: now + LOCK_TTL_MS })
    }

    claim()

    const timer = window.setInterval(() => {
      if (!ownsLockRef.current) return
      writeLock({ tabId, novelId, expiresAt: Date.now() + LOCK_TTL_MS })
    }, RENEW_MS)

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCK_KEY) return
      const current = readLock()
      const blockedByOther = Boolean(current && current.expiresAt > Date.now() && current.tabId !== tabId)
      if (blockedByOther) {
        ownsLockRef.current = false
        setBlocked(true)
      }
    }

    const release = () => {
      const current = readLock()
      if (current?.tabId === tabId) localStorage.removeItem(LOCK_KEY)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('beforeunload', release)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('beforeunload', release)
      release()
    }
  }, [novelId, tabId])

  return blocked
}
