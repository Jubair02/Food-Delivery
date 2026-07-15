import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const ProtectedRoute = ({ children }) => {
  const { ready, isAuthed } = useAdminAuth()

  if (!ready) {
    return <div className='full-center'>Checking session…</div>
  }
  if (!isAuthed) {
    return <Navigate to='/login' replace />
  }
  return children
}

export default ProtectedRoute
