import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()

  // Navigate home, then smooth-scroll to an in-page section (or the top).
  const goTo = (sectionId) => {
    navigate('/')
    setTimeout(() => {
      const el = sectionId && document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 60)
  }

  return (
    <div className='footer' id='footer'>
      <div className="footer-content">

        {/* Left Section: Brand & Bio */}
        <div className="footer-content-left">
          <img src={assets.logo} alt="Logo" className="footer-logo" />
          <p>Order your favorite meals with ease. We bring the best local flavors directly to your doorstep with speed and care.</p>
          <div className="footer-social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <img src={assets.twitter_icon} alt="Twitter" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
          </div>
        </div>

        {/* Center Section: Navigation */}
        <div className='footer-content-center'>
          <h2>COMPANY</h2>
          <ul>
            <li><button type="button" onClick={() => goTo(null)}>Home</button></li>
            <li><button type="button" onClick={() => goTo('explore-menu')}>Menu</button></li>
            <li><button type="button" onClick={() => goTo('app-download')}>Mobile App</button></li>
            <li><button type="button" onClick={() => goTo('footer')}>Contact Us</button></li>
          </ul>
        </div>

        {/* Right Section: Contact */}
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li><a href="tel:+8801756456822">+880 1756-456822</a></li>
            <li><a href="mailto:contact@khaidai.com">contact@khaidai.com</a></li>
          </ul>
        </div>

      </div>

      <hr />

      <p className="footer-copyright">
        Copyright 2024 © Khaidai.com - All Rights Reserved.
      </p>

      <p className="footer-powered">
        Powered by <a href="https://jhossain.vercel.app/" target="_blank" rel="noopener noreferrer">Jubair Hossain</a>
      </p>
    </div>
  )
}

export default Footer
