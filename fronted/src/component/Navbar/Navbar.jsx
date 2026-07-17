import React, { useContext, useEffect, useRef, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const Navbar = () => {
  const [menu, setMenu] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { cartItems, user, profile, API_URL, logout, setShowLogin, searchQuery, setSearchQuery } =
    useContext(StoreContext)
  const navigate = useNavigate()
  const profileRef = useRef(null)

  const cartCount = Object.values(cartItems || {}).reduce((sum, q) => sum + (q > 0 ? q : 0), 0)

  const selectMenu = (name) => {
    setMenu(name)
    setMobileMenuOpen(false)
  }

  const onSearchChange = (e) => {
    setSearchQuery(e.target.value)
    navigate('/')
    const el = document.getElementById('food-display')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleSearch = () => {
    setShowSearch((prev) => {
      const next = !prev
      if (!next) setSearchQuery('')
      return next
    })
  }

  // Stable dropdown: click to open, click outside (or Escape) to close.
  useEffect(() => {
    if (!profileOpen) return
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

  const go = (path) => { setProfileOpen(false); navigate(path) }
  const doLogout = () => { setProfileOpen(false); logout() }

  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
  const avatarUrl = profile?.avatar
    ? (/^https?:\/\//.test(profile.avatar) ? profile.avatar : `${API_URL}/images/${profile.avatar}`)
    : ''

  return (
    <header className='navbar'>
      <div className='navbar-inner'>
        <Link to='/' className='navbar-logo' onClick={() => selectMenu('home')}>
          <img src={assets.logo} alt='KhaiDai home' />
        </Link>

        <button
          type='button'
          className={`navbar-hamburger ${mobileMenuOpen ? 'open' : ''}`}
          aria-label='Toggle navigation menu'
          aria-expanded={mobileMenuOpen}
          aria-controls='navbar-menu'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span></span><span></span><span></span>
        </button>

        <nav id='navbar-menu' className={`navbar-menu ${mobileMenuOpen ? 'show' : ''}`}>
          <Link to='/' onClick={() => selectMenu('home')} className={menu === 'home' ? 'active' : ''}>Home</Link>
          <a href='#explore-menu' onClick={() => selectMenu('menu')} className={menu === 'menu' ? 'active' : ''}>Menu</a>
          <a href='#app-download' onClick={() => selectMenu('mobile-app')} className={menu === 'mobile-app' ? 'active' : ''}>Mobile App</a>
          <a href='#footer' onClick={() => selectMenu('contact-us')} className={menu === 'contact-us' ? 'active' : ''}>Contact Us</a>
        </nav>

        <div className='navbar-right'>
          <div className={`navbar-search ${showSearch ? 'open' : ''}`}>
            {showSearch && (
              <input
                type='text'
                className='navbar-search-input'
                placeholder='Search dishes…'
                value={searchQuery}
                onChange={onSearchChange}
                aria-label='Search dishes'
                autoFocus
              />
            )}
            <button type='button' className='nav-icon-btn' aria-label={showSearch ? 'Close search' : 'Search'} onClick={toggleSearch}>
              <img src={assets.search_icon} alt='' />
            </button>
          </div>

          <Link to='/cart' className='nav-icon-btn cart-btn' aria-label='View cart'>
            <img src={assets.basket_icon} alt='' />
            {cartCount > 0 && <span className='cart-badge'>{cartCount}</span>}
          </Link>

          {!user ? (
            <button type='button' className='signin-btn' onClick={() => setShowLogin(true)}>Sign in</button>
          ) : (
            <div className='navbar-profile' ref={profileRef}>
              <button
                type='button'
                className='avatar-btn'
                aria-haspopup='menu'
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((o) => !o)}
              >
                {avatarUrl ? <img className='avatar-img' src={avatarUrl} alt='Account' /> : initial}
              </button>
              {profileOpen && (
                <ul className='navbar-profile-dropdown' role='menu'>
                  <li role='menuitem' onClick={() => go('/profile')}><img src={assets.profile_icon} alt='' /><span>Profile</span></li>
                  <li role='menuitem' onClick={() => go('/myorders')}><img src={assets.bag_icon} alt='' /><span>My Orders</span></li>
                  <li role='menuitem' className='danger' onClick={doLogout}><img src={assets.logout_icon} alt='' /><span>Logout</span></li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
