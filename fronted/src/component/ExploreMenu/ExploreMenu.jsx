import React from 'react'
import './ExploreMenu.css'
import { menu_list } from '../../assets/assets'

const ExploreMenu = ({ category, setCategory }) => {
  const active = category !== 'All'

  return (
    <section className='explore-menu' id='explore-menu'>
      <div className='explore-menu-head'>
        <div>
          {/* Was an <h1> sitting above the hero's <h2>. */}
          <h2>Explore our menu</h2>
          {/* The old copy here repeated the hero paragraph almost word for word.
              This says something useful about the control underneath it instead. */}
          <p className='explore-menu-text'>
            Pick a category to narrow things down, or keep scrolling for everything.
          </p>
        </div>

        {active && (
          <button type='button' className='explore-menu-clear' onClick={() => setCategory('All')}>
            Clear filter
          </button>
        )}
      </div>

      <div className='explore-menu-list' role='group' aria-label='Filter dishes by category'>
        {menu_list.map((item) => {
          const on = category === item.menu_name
          return (
            <button
              type='button'
              onClick={() => setCategory((prev) => (prev === item.menu_name ? 'All' : item.menu_name))}
              key={item.menu_name}
              className={`explore-menu-list-item${on ? ' is-on' : ''}`}
              aria-pressed={on}
            >
              <span className='explore-menu-thumb'>
                <img
                  src={item.menu_image}
                  onError={(e) => { if (item.menu_image_local) e.currentTarget.src = item.menu_image_local }}
                  alt=''
                />
              </span>
              <span className='explore-menu-label'>{item.menu_name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ExploreMenu
