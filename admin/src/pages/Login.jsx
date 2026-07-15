import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const Login = () => {
  const { login, isAuthed, ready } = useAdminAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <div className='login-screen'>
      <form className='login-card' onSubmit={onSubmit}>
        <div className='login-logo'>🍔</div>
        <h1>KhaiDai Admin</h1>
        <p className='login-sub'>Sign in to manage the platform.</p>

        <label htmlFor='email'>Email</label>
        <input id='email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='admin@khaidai.com' required autoFocus />

        <label htmlFor='password'>Password</label>
        <input id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='••••••••' required />

        {error && <p className='login-error'>{error}</p>}

        <button type='submit' disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className='login-note'>Admin access is provisioned internally. There is no public sign-up.</p>
      </form>
    </div>
  )
}

export default Login
