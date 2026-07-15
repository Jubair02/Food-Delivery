import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext'

const ICONS = { success: '✓', error: '✕', info: 'i' }

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // push(type, message, { duration, action: { label, onClick } })
  const push = useCallback(
    (type, message, opts = {}) => {
      if (!message) return
      const id = ++idRef.current
      const duration = opts.duration ?? 3000
      setToasts((prev) => [...prev, { id, type, message, action: opts.action }])
      if (duration > 0) setTimeout(() => remove(id), duration)
      return id
    },
    [remove]
  )

  const api = useMemo(
    () => ({
      success: (msg, opts) => push('success', msg, opts),
      error: (msg, opts) => push('error', msg, opts),
      info: (msg, opts) => push('info', msg, opts),
      dismiss: remove,
    }),
    [push, remove]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className='toast-container' role='region' aria-live='polite' aria-label='Notifications'>
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role='status'>
            <span className='toast-icon' aria-hidden='true'>{ICONS[t.type]}</span>
            <p className='toast-msg'>{t.message}</p>
            {t.action && (
              <button
                type='button'
                className='toast-action'
                onClick={() => { t.action.onClick(); remove(t.id) }}
              >
                {t.action.label}
              </button>
            )}
            <button type='button' className='toast-x' aria-label='Dismiss' onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
