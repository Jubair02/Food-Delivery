import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { useToast } from '../hooks/useToast'

const IconTrash = (
  <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <polyline points='3 6 5 6 21 6' /><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' /><line x1='10' y1='11' x2='10' y2='17' /><line x1='14' y1='11' x2='14' y2='17' />
  </svg>
)

const Promos = () => {
  const { apiFetch, socket } = useAdminAuth()
  const toast = useToast()

  const [promos, setPromos] = useState([])
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const json = await apiFetch('/api/admin/promos')
    if (json.success) setPromos(json.data)
  }

  useEffect(() => {
    const handler = () => load()
    socket?.on('promos:changed', handler)
    ;(async () => { await load() })()
    return () => socket?.off('promos:changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFetch, socket])

  const addPromo = async (e) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    const p = Number(percent)
    if (!c) { toast.error('Enter a code.'); return }
    if (!Number.isFinite(p) || p < 1 || p > 100) { toast.error('Discount must be 1–100%.'); return }
    setSubmitting(true)
    const json = await apiFetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: c, discountPercent: p }),
    })
    setSubmitting(false)
    if (json.success) {
      toast.success(`Promo "${c}" saved (${p}% off).`)
      setCode(''); setPercent('')
      load()
    } else {
      toast.error(json.message || 'Failed to save promo.')
    }
  }

  const toggle = async (promo) => {
    const json = await apiFetch('/api/admin/promos/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo._id, active: !promo.active }),
    })
    if (json.success) { toast.success(`"${promo.code}" ${!promo.active ? 'enabled' : 'disabled'}.`); load() }
    else toast.error(json.message || 'Failed to update promo.')
  }

  const remove = async (promo) => {
    const json = await apiFetch('/api/admin/promos/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo._id }),
    })
    if (json.success) { toast.success(`"${promo.code}" removed.`); load() }
    else toast.error(json.message || 'Failed to remove promo.')
  }

  return (
    <div className='page promo-page'>
      <form className='card add-form' onSubmit={addPromo}>
        <div className='card-head'>Add / update a promo code</div>
        <div className='add-form-body'>
          <div className='row'>
            <div className='field'>
              <label>Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder='e.g. SUMMER20' style={{ textTransform: 'uppercase' }} />
            </div>
            <div className='field'>
              <label>Discount (%)</label>
              <input type='number' min='1' max='100' value={percent} onChange={(e) => setPercent(e.target.value)} placeholder='20' />
            </div>
          </div>
          <button type='submit' disabled={submitting}>{submitting ? 'Saving…' : 'Save Promo'}</button>
          <p className='muted' style={{ fontSize: 13 }}>Entering an existing code updates its discount.</p>
        </div>
      </form>

      <div className='card'>
        <div className='card-head'>Promo codes · {promos.length}</div>
        <div className='table'>
          <div className='table-row promo-row table-head'>
            <span>Code</span><span>Discount</span><span>Status</span><span>Actions</span>
          </div>
          {promos.length === 0 && <div className='table-empty'>No promo codes yet. Add one above.</div>}
          {promos.map((p) => (
            <div key={p._id} className={`table-row promo-row ${p.active ? '' : 'is-disabled'}`}>
              <span className='promo-code'>{p.code}</span>
              <span className='num'>{p.discountPercent}%</span>
              <span>
                <span className={`badge ${p.active ? 'status-delivered' : 'status-cancelled'}`}>
                  {p.active ? 'Active' : 'Disabled'}
                </span>
              </span>
              <span className='row-actions'>
                <button
                  type='button'
                  className={`icon-btn ${p.active ? '' : 'enable'}`}
                  onClick={() => toggle(p)}
                  title={p.active ? 'Disable' : 'Enable'}
                  aria-label={p.active ? `Disable ${p.code}` : `Enable ${p.code}`}
                >
                  {p.active ? 'Off' : 'On'}
                </button>
                <button type='button' className='icon-btn danger' onClick={() => remove(p)} aria-label={`Delete ${p.code}`}>{IconTrash}</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Promos
