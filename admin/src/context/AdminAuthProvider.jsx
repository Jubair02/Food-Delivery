import { useCallback, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { AdminAuthContext } from './AdminAuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'admin_token'

const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [admin, setAdmin] = useState(null)
  // If there's no stored token we're immediately "ready"; otherwise we verify it.
  const [ready, setReady] = useState(() => !localStorage.getItem(TOKEN_KEY))
  const [socket, setSocket] = useState(null)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setAdmin(null)
  }, [])

  // Verify a stored token on load (state updates happen after await → allowed).
  useEffect(() => {
    if (!token) return
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success) setAdmin(json.admin)
        else logout()
      } catch {
        // Offline — keep the token, allow retry.
      } finally {
        setReady(true)
      }
    })()
  }, [token, logout])

  // Real-time channel — open a socket while authenticated.
  useEffect(() => {
    if (!token) return
    const s = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] })
    // Syncing an external system (Socket.IO) into React state is the intended
    // use of effects; the setter can't be moved out of the effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s)
    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (json.success) {
        localStorage.setItem(TOKEN_KEY, json.token)
        setToken(json.token)
        setAdmin(json.admin)
        setReady(true)
      }
      return json
    } catch {
      return { success: false, message: 'Could not reach the server.' }
    }
  }, [])

  // Authenticated fetch helper. Auto-logs-out on 401.
  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = { ...(options.headers || {}) }
    const t = localStorage.getItem(TOKEN_KEY)
    if (t) headers.Authorization = `Bearer ${t}`
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })
    if (res.status === 401) logout()
    return res.json()
  }, [logout])

  const value = useMemo(
    () => ({
      API_URL,
      token,
      admin,
      ready,
      isAuthed: !!token && !!admin,
      socket,
      login,
      logout,
      apiFetch,
    }),
    [token, admin, ready, socket, login, logout, apiFetch]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export default AdminAuthProvider
