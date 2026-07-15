import { createContext } from "react";

// Context object lives in its own module so the provider file can export
// only a component (keeps React Fast Refresh happy).
export const StoreContext = createContext(null);
