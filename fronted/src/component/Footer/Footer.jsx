import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { useLocation, useNavigate } from 'react-router-dom'
import { jumpToSection } from '../../utils/sectionScroll'

/* "Contact us" used to live here too, pointing at #footer — a link from the
   footer to itself. The Get in touch column below is the real contact route. */
const COMPANY_LINKS = [
  { label: 'Home', section: null },
  { label: 'Menu', section: 'explore-menu' },
  { label: 'Mobile app', section: 'app-download' },
]

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook_icon' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter_icon' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin_icon' },
]

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const year = new Date().getFullYear() // was hardcoded to 2026

  return (
    <footer className='footer' id='footer'>
      <div className='footer-inner'>
        {/* Brand */}
        <div className='footer-brand'>
          <img src={assets.logo} alt='Khai-Dai' className='footer-logo' />
          <p>
            Food from kitchens near you, brought over while it’s still hot — and tracked the whole
            way to your door.
          </p>
          <ul className='footer-social'>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`Khai-Dai on ${s.label}`}
                >
                  <img src={assets[s.icon]} alt='' />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Sections of the site */}
        <nav className='footer-col' aria-label='Company'>
          <h2>Company</h2>
          <ul>
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <button
                  type='button'
                  onClick={() => jumpToSection(navigate, location.pathname, link.section)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Real contact details */}
        <div className='footer-col'>
          <h2>Get in touch</h2>
          <ul>
            <li><a href='tel:+8801756456822'>+880 1756-456822</a></li>
            <li><a href='mailto:contact@khaidai.com'>contact@khaidai.com</a></li>
          </ul>
        </div>
      </div>

      <div className='footer-base'>
        <p>© {year} Khai-Dai. All rights reserved.</p>
        <p>
          Powered by{' '}
          <a href='https://jhossain.vercel.app/' target='_blank' rel='noopener noreferrer'>
            Jubair Hossain
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
