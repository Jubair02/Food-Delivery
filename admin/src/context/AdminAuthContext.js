import { createContext } from 'react'

// Separate module so the provider file exports only a component (Fast Refresh).
export const AdminAuthContext = createContext(null)
