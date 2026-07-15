import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { money, STATUSES, statusClass } from '../utils'

const Orders = () => {
  const { apiFetch, socket } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const json = await apiFetch('/api/admin/orders')
      if (json.success) setOrders(json.data)
      setLoading(false)
    }
    const handler = () => load()
    socket?.on('orders:changed', handler)
    ;(async () => { await load() })()
    return () => socket?.off('orders:changed', handler)
  }, [apiFetch, socket])

  const changeStatus = async (orderId, status) => {
    // Optimistic — the socket event will reconcile across all admins too.
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)))
    await apiFetch('/api/admin/orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
  }

  return (
    <div className='page'>
      <p className='muted sub'>
        {loading ? 'Loading orders…' : `${orders.length} order${orders.length === 1 ? '' : 's'} total`}
      </p>

      {!loading && orders.length === 0 && <div className='empty'>No orders yet.</div>}

      <div className='order-list'>
        {orders.map((o) => (
          <div key={o._id} className='card order-card'>
            <div className='order-icon'>📦</div>
            <div className='order-body'>
              <p className='order-items'>{o.items.map((it) => `${it.name} × ${it.quantity}`).join(', ')}</p>
              <p className='order-name'>{o.address?.firstName} {o.address?.lastName}</p>
              <p className='order-line'>{o.address?.street}, {o.address?.city}, {o.address?.state}, {o.address?.country} {o.address?.zipcode}</p>
              <p className='order-line'>{o.address?.phone}</p>
              <p className='order-pay'>
                {o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online'} ·{' '}
                <span className={o.payment ? 'pay-paid' : 'pay-unpaid'}>{o.payment ? 'Paid' : 'Unpaid'}</span>
              </p>
            </div>
            <div className='order-meta'>
              <p className='muted'>{o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
              <p className='order-amount'>{money(o.amount)}</p>
            </div>
            <select
              className={`status-select ${statusClass(o.status)}`}
              value={o.status}
              onChange={(e) => changeStatus(o._id, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
