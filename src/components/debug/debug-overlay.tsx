import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  clearLog,
  dlog,
  isDebugEnabled,
  readLog,
  subscribeDebugLog,
  type DebugEntry,
} from '@/lib/debug-log'

/**
 * Floating diagnostic log panel. Activates with `?debug=1` (or sessionStorage
 * `loby:debug=1`). Only meant for occasional production debugging on devices
 * (especially iOS PWA) where DevTools isn't available.
 */
export function DebugOverlay() {
  const [entries, setEntries] = useState<DebugEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const enabled = isDebugEnabled()

  useEffect(() => {
    if (!enabled) return
    setEntries(readLog())
    const unsub = subscribeDebugLog(() => setEntries(readLog()))
    dlog('debug-overlay: mounted')
    const onVisibility = () => dlog(`visibility:${document.visibilityState}`)
    const onPageShow = (e: PageTransitionEvent) =>
      dlog(`pageshow persisted=${e.persisted}`)
    const onPageHide = (e: PageTransitionEvent) =>
      dlog(`pagehide persisted=${e.persisted}`)
    const onFocus = () => dlog('window:focus')
    const onBlur = () => dlog('window:blur')
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    return () => {
      unsub()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled])

  if (!enabled) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 4,
        left: 4,
        right: 4,
        zIndex: 2147483647,
        fontFamily: 'monospace',
        fontSize: 11,
        background: 'rgba(0,0,0,0.85)',
        color: '#a7f3d0',
        border: '1px solid #14532d',
        borderRadius: 8,
        padding: 6,
        maxHeight: collapsed ? 28 : '40vh',
        overflowY: 'auto',
        pointerEvents: 'auto',
        WebkitTextSizeAdjust: 'none',
      }}
      dir="ltr"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#fef3c7',
          marginBottom: 4,
        }}
      >
        <strong>LOBY DEBUG</strong>
        <span style={{ opacity: 0.6 }}>{entries.length}</span>
        <button
          type="button"
          style={btnStyle}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? 'expand' : 'collapse'}
        </button>
        <button type="button" style={btnStyle} onClick={() => clearLog()}>
          clear
        </button>
        <button
          type="button"
          style={btnStyle}
          onClick={async () => {
            const text = entries
              .map((e) => `${new Date(e.ts).toISOString().slice(11, 19)} ${e.msg}`)
              .join('\n')
            try {
              await navigator.clipboard.writeText(text)
              dlog('clipboard: copied')
            } catch {
              dlog('clipboard: failed')
            }
          }}
        >
          copy
        </button>
      </div>
      {!collapsed ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {entries.slice(-80).map((e, i) => (
            <li key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {new Date(e.ts).toISOString().slice(11, 19)} {e.msg}
            </li>
          ))}
        </ul>
      ) : null}
    </div>,
    document.body
  )
}

const btnStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  background: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: 4,
}
