import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Which backend this console will talk to. Worth showing on an internal tool so
// nobody has to guess whether they're pointed at production or a local server.
const apiHost = (() => {
  try {
    return new URL(API_URL).host
  } catch {
    return API_URL
  }
})()

/* What the console manages — orients whoever lands here, and matches the
   sidebar they'll see once they're in. */
const AREAS = [
  { name: 'Orders', detail: 'Live status and history' },
  { name: 'Menu', detail: 'Dishes, prices, availability' },
  { name: 'Promotions', detail: 'Codes and discount rates' },
  { name: 'Customers', detail: 'Accounts and spend' },
]

const Login = () => {
  const { login, isAuthed, ready } = useAdminAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsOn, setCapsOn] = useState(false)

  if (ready && isAuthed) return <Navigate to='/dashboard' replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (result.success) navigate('/dashboard', { replace: true })
    else setError(result.message || 'Login failed.')
  }

  // Caps lock silently breaks password entry more often than anything else.
  const trackCaps = (e) => {
    if (typeof e.getModifierState !== 'function') return
    setCapsOn(e.getModifierState('CapsLock'))
  }

  return (
    <div className='login-screen'>
      {/* Nameplate */}
      <aside className='login-aside'>
        <div className='login-brand'>
          <span className='login-mark' aria-hidden='true'>K</span>
          <span className='login-wordmark'>
            KhaiDai <em>Admin</em>
          </span>
        </div>

        <p className='login-headline'>
          The control room for
          <br />
          the whole operation.
        </p>

        <ul className='login-areas'>
          {AREAS.map((area) => (
            <li key={area.name}>
              <span className='login-area-name'>{area.name}</span>
              <span className='login-area-detail'>{area.detail}</span>
            </li>
          ))}
        </ul>

        <p className='login-env'>
          <span>API</span>
          {apiHost}
        </p>
      </aside>

      {/* Form */}
      <main className='login-main'>
        <form className='login-card' onSubmit={onSubmit}>
          <h1>Sign in</h1>
          <p className='login-sub'>Use the credentials issued to you.</p>

          <div className='login-field'>
            <label htmlFor='email'>Email</label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='admin@khaidai.com'
              autoComplete='username'
              required
              autoFocus
            />
          </div>

          <div className='login-field'>
            <label htmlFor='password'>Password</label>
            <div className='login-password'>
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={trackCaps}
                onKeyDown={trackCaps}
                onBlur={() => setCapsOn(false)}
                placeholder='••••••••'
                autoComplete='current-password'
                required
              />
              <button
                type='button'
                className='login-reveal'
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {capsOn && (
              <p className='login-caps' role='status'>
                Caps lock is on.
              </p>
            )}
          </div>

          {error && (
            <p className='login-error' role='alert'>
              {error}
            </p>
          )}

          <button type='submit' className='login-submit' disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className='login-note'>
            Access is provisioned internally. There is no public sign-up.
          </p>
        </form>
      </main>
    </div>
  )
}

export default Login
