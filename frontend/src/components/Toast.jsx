import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', link, duration = 5000 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const toast = { id, title, message, type, link };

    setToasts((prev) => [toast, ...prev.slice(0, 4)]); // max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-card toast-${t.type}`}
            onClick={() => {
              if (t.link) {
                navigate(t.link);
                removeToast(t.id);
              }
            }}
            style={{ cursor: t.link ? 'pointer' : 'default' }}
          >
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={18} color="#0d9488" />}
              {t.type === 'warning' && <AlertTriangle size={18} color="#d97706" />}
              {t.type === 'error' && <AlertTriangle size={18} color="#e11d48" />}
              {t.type === 'info' && <Info size={18} color="#0284c7" />}
            </div>
            <div className="toast-content">
              <strong>{t.title}</strong>
              {t.message && <p>{t.message}</p>}
              {t.link && (
                <span className="toast-action">
                  View details <ExternalLink size={11} />
                </span>
              )}
            </div>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {} };
  }
  return context;
}
