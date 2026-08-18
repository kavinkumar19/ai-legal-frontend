import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#fff',
                    color: '#333',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderLeft: `6px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    fontWeight: 'bold',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    <span style={{ fontSize: '20px' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{toast.message}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};
