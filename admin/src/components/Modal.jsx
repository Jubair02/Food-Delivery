import React, { useEffect } from 'react'

/**
 * Stable modal: closes only on the ✕, Cancel/overlay, or Escape — never when
 * you interact with its contents (clicks inside don't bubble to the overlay).
 * Uses onMouseDown so a drag that ends outside can't accidentally dismiss it.
 */
const Modal = ({ open, title, onClose, children }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className='modal-overlay' onMouseDown={onClose}>
      <div className='modal' role='dialog' aria-modal='true' onMouseDown={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          <h3>{title}</h3>
          <button type='button' className='modal-x' aria-label='Close' onClick={onClose}>✕</button>
        </div>
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  )
}

export default Modal
