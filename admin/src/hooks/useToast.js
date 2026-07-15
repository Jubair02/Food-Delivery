import { useContext } from 'react'
import { ToastContext } from '../context/ToastContext'

export const useToast = () => {
  const ctx = useContext(ToastContext)
  return ctx || { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} }
}
