import { createContext } from "react";

// Toast API context. Lives in its own module so the provider file can export
// only a component (React Fast Refresh requirement).
export const ToastContext = createContext(null);
