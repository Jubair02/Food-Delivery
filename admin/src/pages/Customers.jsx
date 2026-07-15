import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { money, formatDate } from '../utils'

const Customers = () => {
  const { apiFetch, socket } = useAdminAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const json = await apiFetch('/api/admin/customers')
      if (json.success) setCustomers(json.data)
      setLoading(false)
    }
    const handler = () => load()
    socket?.on('customers:changed', handler)
    socket?.on('orders:changed', handler) // order counts/spend change too
    ;(async () => { await load() })()
    return () => {
      socket?.off('customers:changed', handler)
      socket?.off('orders:changed', handler)
    }
  }, [apiFetch, socket])

  return (
    <div className='page'>
      <p className='muted sub'>
        {loading ? 'Loading customers…' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
      </p>

      {!loading && customers.length === 0 && <div className='empty'>No customers yet.</div>}

      {customers.length > 0 && (
        <div className='card'>
          <div className='table customers-table'>
            <div className='table-row table-head'>
              <span>Customer</span><span>Phone</span><span>City</span><span>Orders</span><span>Spent</span><span>Joined</span>
            </div>
            {customers.map((c) => (
              <div key={c.id} className='table-row'>
                <span className='cust-cell'>
                  <span className='cust-name'>{c.name || '—'}</span>
                  <span className='cust-email'>{c.email}</span>
                </span>
                <span>{c.phone || '—'}</span>
                <span>{c.city || '—'}</span>
                <span className='num'>{c.orders}</span>
                <span className='num'>{money(c.spent)}</span>
                <span>{formatDate(c.joinedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
