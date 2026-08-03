import React from 'react'
import './AppDownload.css'
import { assets } from '../../assets/assets'

/* The badges used to be bare <img> tags with cursor:pointer and a lift on hover
   — they looked like buttons and did nothing. There are no store listings yet,
   so they're presented as "coming soon" rather than as working links. */
const AppDownload = () => {
  return (
    <section className='app-download' id='app-download'>
      <div className='app-download-inner'>
        <p className='app-download-eyebrow'>Coming soon</p>
        <h2>
          The Khai-Dai app,<br />for ordering on the move.
        </h2>
        <p className='app-download-body'>
          Everything the site does, plus delivery updates that reach you without
          opening a browser. We&rsquo;ll announce it here first.
        </p>

        <div className='app-download-platforms'>
          <span className='app-download-badge'>
            <img src={assets.play_store} alt='Google Play — not yet available' />
          </span>
          <span className='app-download-badge'>
            <img src={assets.app_store} alt='App Store — not yet available' />
          </span>
        </div>
      </div>
    </section>
  )
}

export default AppDownload
