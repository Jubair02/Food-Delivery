import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

// Convenience hook. Returns { success, error, info } — each pushes a toast.
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft: if used outside the provider, no-op instead of crashing.
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
};
