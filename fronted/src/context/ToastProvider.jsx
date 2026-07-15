import { useCallback, useMemo, useRef, useState } from "react";
import "./Toast.css";
import { ToastContext } from "./ToastContext";

const ICONS = {
  success: "✓",
  error: "✕",
  info: "i",
};

const ToastProvider = (props) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 3000) => {
      if (!message) return;
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (msg, duration) => push("success", msg, duration),
      error: (msg, duration) => push("error", msg, duration),
      info: (msg, duration) => push("info", msg, duration),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
            <p className="toast-message">{t.message}</p>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => remove(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
