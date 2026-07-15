import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Menu from './pages/Menu'
import Customers from './pages/Customers'

const App = () => {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to='dashboard' replace />} />
        <Route path='dashboard' element={<Dashboard />} />
        <Route path='orders' element={<Orders />} />
        <Route path='menu' element={<Menu />} />
        <Route path='customers' element={<Customers />} />
        <Route path='*' element={<Navigate to='dashboard' replace />} />
      </Route>
    </Routes>
  )
}

export default App
