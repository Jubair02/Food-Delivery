import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const IconDash = (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <rect x='3' y='3' width='7' height='9' /><rect x='14' y='3' width='7' height='5' /><rect x='14' y='12' width='7' height='9' /><rect x='3' y='16' width='7' height='5' />
  </svg>
)
const IconOrders = (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' /><polyline points='3.27 6.96 12 12.01 20.73 6.96' /><line x1='12' y1='22.08' x2='12' y2='12' />
  </svg>
)
const IconMenu = (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <line x1='8' y1='6' x2='21' y2='6' /><line x1='8' y1='12' x2='21' y2='12' /><line x1='8' y1='18' x2='21' y2='18' /><line x1='3' y1='6' x2='3.01' y2='6' /><line x1='3' y1='12' x2='3.01' y2='12' /><line x1='3' y1='18' x2='3.01' y2='18' />
  </svg>
)
const IconCustomers = (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' /><circle cx='9' cy='7' r='4' /><path d='M23 21v-2a4 4 0 0 0-3-3.87' /><path d='M16 3.13a4 4 0 0 1 0 7.75' />
  </svg>
)
const IconPromo = (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <line x1='19' y1='5' x2='5' y2='19' /><circle cx='6.5' cy='6.5' r='2.5' /><circle cx='17.5' cy='17.5' r='2.5' />
  </svg>
)

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDash },
  { to: '/orders', label: 'Orders', icon: IconOrders },
  { to: '/menu', label: 'Menu', icon: IconMenu },
  { to: '/promos', label: 'Promos', icon: IconPromo },
  { to: '/customers', label: 'Customers', icon: IconCustomers },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/menu': 'Menu',
  '/promos': 'Promo Codes',
  '/customers': 'Customers',
}

const AdminLayout = () => {
  const { admin, logout, socket } = useAdminAuth()
  const location = useLocation()
  const title = TITLES[location.pathname] || 'Dashboard'
  const initial = (admin?.name?.[0] || admin?.email?.[0] || 'A').toUpperCase()

  return (
    <div className='shell'>
      <aside className='sidebar'>
        <div className='brand'>🍔 KhaiDai <span>Admin</span></div>
        <nav className='nav'>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className='nav-link'>
              <span className='nav-icon'>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className='sidebar-foot'>
          <span className={`live-dot ${socket ? 'on' : 'off'}`} />
          {socket ? 'Live' : 'Offline'}
        </div>
      </aside>

      <div className='main'>
        <header className='topbar'>
          <h1>{title}</h1>
          <div className='topbar-user'>
            <div className='avatar'>{initial}</div>
            <span className='user-name'>{admin?.name || admin?.email}</span>
            <button className='logout-btn' onClick={logout}>Logout</button>
          </div>
        </header>
        <main className='content'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
