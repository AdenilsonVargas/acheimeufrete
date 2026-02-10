# 🔔 SKILL E: NOTIFICATIONS & FEEDBACK
## Toasts, Modals, Loading States (Sistema de feedback visual)

> **OBJETIVO:** Feedback instantâneo, visuais profissionais, sem distrações

---

## 1. TOAST SYSTEM

### 🎨 Toast Component
```javascript
// src/components/Toast.jsx
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const toastIcons = {
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
  error: { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' }
};

export function Toast({ type = 'info', message, onClose }) {
  const { icon: Icon, bg, border, text } = toastIcons[type];
  
  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-lg ${bg} border-l-4 ${border} animate-slideIn`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${text}`} />
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className={`p-1 hover:opacity-70 ${text}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// src/context/ToastContext.jsx
import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

### 📝 Uso
```javascript
// Em qualquer componente
import { useToast } from '@/context/ToastContext';

export function MinhaComponente() {
  const { addToast } = useToast();
  
  const handleSave = async () => {
    try {
      await api.post('/dados', formData);
      addToast('Salvo com sucesso!', 'success');
    } catch (err) {
      addToast(err.response.data.erro, 'error');
    }
  };
  
  return <button onClick={handleSave}>Salvar</button>;
}
```

---

## 2. MODAL SYSTEM

### 🪟 Modal Component
```javascript
// src/components/Modal.jsx
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, closeButton = true, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'auto'; };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 animated-fadeIn"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg ${sizeClasses[size]} max-h-[90vh] overflow-y-auto animated-slideUp`}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">{title}</h2>
          {closeButton && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 🔧 Confirm Dialog
```javascript
// src/components/ConfirmDialog.jsx
export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-white ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 3. LOADING STATES

### ⏳ Loading Spinner
```javascript
// src/components/Loading.jsx
export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${sizes[size]} border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}

export function LoadingFullScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

### 🔘 Button Loading State
```javascript
// src/components/Button.jsx
export function Button({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  ...props
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} flex items-center gap-2 ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
```

---

## 4. STATUS BADGES

### 🏷️ Badge Component
```javascript
export function Badge({ status, label }) {
  const statusConfig = {
    'ativa': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
    'aguardando': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
    'aceita': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
    'entregando': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
    'entregue': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200' },
    'pagando': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
    'cancelada': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' }
  };
  
  const { bg, text } = statusConfig[status] || statusConfig['cancelada'];
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label || status}
    </span>
  );
}
```

---

## 🎯 Success Metrics
✅ Toast aparece < 100ms após ação  
✅ Modal abre com animação suave  
✅ Dark mode em todos os feedbacks  
✅ Feedback claro e profissional  
✅ Sem distrações desnecessárias

---

**Próxima Skill:** SKILL F - Real-Time Features
