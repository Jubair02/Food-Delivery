import React, { useContext, useEffect, useRef, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { jumpToSection, scrollToId } from '../../utils/sectionScroll'

/* Menu, Mobile app and Contact are sections rather than routes. `hash` is the id
   they scroll to; #footer exists on every page, the other two only on Home. */
const SECTIONS = [
  { id: 'menu', label: 'Menu', hash: 'explore-menu' },
  { id: 'app', label: 'Mobile app', hash: 'app-download' },
  { id: 'contact', label: 'Contact', hash: 'footer' },
]

const Navbar = () => {
  const [section, setSection] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { cartItems, user, profile, API_URL, logout, setShowLogin, searchQuery, setSearchQuery } =
    useContext(StoreContext)
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const menuRef = useRef(null)
  const burgerRef = useRef(null)

  const cartCount = Object.values(cartItems || {}).reduce((sum, q) => sum + (q > 0 ? q : 0), 0)

  const onHome = location.pathname === '/'
  // Section highlighting only means something on Home. Off it, nothing is
  // marked active — better than the old default of always highlighting Home.
  const activeId = onHome ? section : null

  // On a route change, reset the highlighted section and close anything left
  // hanging open. Render-time sync rather than an effect, so this settles in the
  // same commit instead of triggering a second render.
  const [syncedPath, setSyncedPath] = useState(location.pathname)
  if (syncedPath !== location.pathname) {
    setSyncedPath(location.pathname)
    if (location.pathname !== '/') setSection('home')
    setMobileMenuOpen(false)
    setProfileOpen(false)
  }

  // The header earns its border and shadow once content slides under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* The old links were bare `href="#explore-menu"` anchors, so from /cart or
     /myorders they pointed at sections that aren't on the page and did nothing.
     jumpToSection scrolls if the target is here, else goes Home first. */
  const goToSection = (e, target) => {
    e.preventDefault()
    setSection(target.id)
    setMobileMenuOpen(false)
    jumpToSection(navigate, location.pathname, target.hash)
  }

  const goHome = () => {
    setSection('home')
    setMobileMenuOpen(false)
    if (onHome) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSearchChange = (e) => {
    const value = e.target.value
    const opening = !searchQuery && value // first keystroke of this search
    setSearchQuery(value)

    // Results only render on Home. Go there once, not on every keystroke like
    // the old handler did (which also re-triggered a smooth scroll each time).
    if (!onHome) {
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId('food-display')))
      return
    }
    if (opening) scrollToId('food-display')
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
  }

  const toggleSearch = () => {
    if (showSearch) closeSearch()
    else setShowSearch(true)
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

  // Same treatment for the mobile panel, which previously stayed open until the
  // hamburger was pressed again. The burger is excluded so its own click still
  // toggles instead of being closed here and reopened by the button.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onDown = (e) => {
      if (burgerRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setMobileMenuOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileMenuOpen])

  // Escape closes the search field too.
  useEffect(() => {
    if (!showSearch) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setShowSearch(false)
      setSearchQuery('')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showSearch, setSearchQuery])

  const go = (path) => { setProfileOpen(false); navigate(path) }
  const doLogout = () => { setProfileOpen(false); logout() }

  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
  const avatarUrl = profile?.avatar
    ? (/^https?:\/\//.test(profile.avatar) ? profile.avatar : `${API_URL}/images/${profile.avatar}`)
    : ''

  return (
    <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className='navbar-inner'>
        <Link to='/' className='navbar-logo' onClick={goHome}>
          <img src={assets.logo} alt='KhaiDai home' />
        </Link>

        <button
          type='button'
          ref={burgerRef}
          className={`navbar-hamburger ${mobileMenuOpen ? 'open' : ''}`}
          aria-label='Toggle navigation menu'
          aria-expanded={mobileMenuOpen}
          aria-controls='navbar-menu'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span></span><span></span><span></span>
        </button>

        <nav
          id='navbar-menu'
          ref={menuRef}
          className={`navbar-menu ${mobileMenuOpen ? 'show' : ''}`}
          aria-label='Main'
        >
          <Link
            to='/'
            onClick={goHome}
            className={activeId === 'home' ? 'active' : ''}
            aria-current={activeId === 'home' ? 'page' : undefined}
          >
            Home
          </Link>
          {SECTIONS.map((target) => (
            <a
              key={target.id}
              href={`#${target.hash}`}
              onClick={(e) => goToSection(e, target)}
              className={activeId === target.id ? 'active' : ''}
            >
              {target.label}
            </a>
          ))}
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
            <button
              type='button'
              className='nav-icon-btn'
              aria-label={showSearch ? 'Close search' : 'Search dishes'}
              onClick={toggleSearch}
            >
              <img src={assets.search_icon} alt='' />
            </button>
          </div>

          <Link
            to='/cart'
            className='nav-icon-btn cart-btn'
            aria-label={
              cartCount > 0
                ? `View cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`
                : 'View cart'
            }
          >
            <img src={assets.basket_icon} alt='' />
            {cartCount > 0 && <span className='cart-badge' aria-hidden='true'>{cartCount}</span>}
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
                aria-label='Account menu'
                onClick={() => setProfileOpen((o) => !o)}
              >
                {avatarUrl ? <img className='avatar-img' src={avatarUrl} alt='' /> : initial}
              </button>
              {profileOpen && (
                /* Buttons, not clickable <li>s — list items aren't focusable, so
                   the old menu could be opened by keyboard but never used. */
                <ul className='navbar-profile-dropdown' role='menu'>
                  <li role='none'>
                    <button type='button' role='menuitem' onClick={() => go('/profile')}>
                      <img src={assets.profile_icon} alt='' /><span>Profile</span>
                    </button>
                  </li>
                  <li role='none'>
                    <button type='button' role='menuitem' onClick={() => go('/myorders')}>
                      <img src={assets.bag_icon} alt='' /><span>My orders</span>
                    </button>
                  </li>
                  <li role='none'>
                    <button type='button' role='menuitem' className='danger' onClick={doLogout}>
                      <img src={assets.logout_icon} alt='' /><span>Log out</span>
                    </button>
                  </li>
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
