import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { money, statusClass } from '../utils'

const Dashboard = () => {
  const { apiFetch, socket } = useAdminAuth()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const load = async () => {
      const [overview, orders] = await Promise.all([
        apiFetch('/api/admin/overview'),
        apiFetch('/api/admin/orders'),
      ])
      if (overview.success) setStats(overview.data)
      if (orders.success) setRecent(orders.data.slice(0, 6))
    }

    const handler = () => load()
    socket?.on('orders:changed', handler)
    socket?.on('customers:changed', handler)
    ;(async () => { await load() })()

    return () => {
      socket?.off('orders:changed', handler)
      socket?.off('customers:changed', handler)
    }
  }, [apiFetch, socket])

  const cards = [
    { label: 'Customers', value: stats?.customers ?? '—' },
    { label: 'Orders', value: stats?.orders ?? '—' },
    { label: 'Revenue', value: stats ? money(stats.revenue) : '—' },
    { label: 'Pending', value: stats?.pending ?? '—' },
  ]

  return (
    <div className='page'>
      <div className='stat-grid'>
        {cards.map((c) => (
          <div key={c.label} className='stat-card'>
            <p className='stat-label'>{c.label}</p>
            <p className='stat-value'>{c.value}</p>
          </div>
        ))}
      </div>

      <div className='card'>
        <div className='card-head'>Recent orders</div>
        {recent.length === 0 ? (
          <p className='muted pad'>No orders yet.</p>
        ) : (
          <div className='table'>
            {recent.map((o) => (
              <div key={o._id} className='table-row'>
                <span className='ellipsis'>
                  {o.items.map((it) => `${it.name} × ${it.quantity}`).join(', ')}
                </span>
                <span>{o.address?.firstName} {o.address?.lastName}</span>
                <span className='num'>{money(o.amount)}</span>
                <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
