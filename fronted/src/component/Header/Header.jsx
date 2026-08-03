import React from 'react'
import './Header.css'
import { scrollToId } from '../../utils/sectionScroll'

const Header = () => {
  return (
    <section className='header'>
      <div className="header-contents">
        {/* Was an <h2> while "Explore our menu" below was the page's <h1>. */}
        <h1>Order your favourite food here</h1>
        <p>
          Dozens of dishes from kitchens near you, delivered while they’re still hot.
        </p>
        <button type="button" onClick={() => scrollToId('explore-menu')}>
          View menu
        </button>
      </div>
    </section>
  )
}

export default Header
