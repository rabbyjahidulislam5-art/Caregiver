import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'confirm' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showModal: (opts: Omit<ModalState, 'isOpen'>) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', type: 'info' });

  const showModal = useCallback((opts: Omit<ModalState, 'isOpen'>) => {
    setModal({ ...opts, isOpen: true });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    setModal({ isOpen: true, title, message, type: 'success' });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setModal({ isOpen: true, title, message, type: 'error' });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setModal({ isOpen: true, title, message, type: 'confirm', onConfirm });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    confirm: '?',
    info: 'ℹ',
  };

  const colorMap = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    confirm: '#6366f1',
    info: '#06b6d4',
  };

  const modalJsx = modal.isOpen ? (
    <div
      className="modal-overlay"
      onClick={closeModal}
      style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
    >
      <div className="modal-glass" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${colorMap[modal.type]}22`,
            border: `1px solid ${colorMap[modal.type]}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: colorMap[modal.type],
            flexShrink: 0,
          }}>
            {iconMap[modal.type]}
          </div>
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{modal.title}</h3>
        </div>
        <div className="modal-body">{modal.message}</div>
        <div className="modal-actions">
          {modal.type === 'confirm' ? (
            <>
              <button className="btn btn-ghost" onClick={() => { modal.onCancel?.(); closeModal(); }}>
                {modal.cancelText || 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={() => { modal.onConfirm?.(); closeModal(); }}>
                {modal.confirmText || 'Confirm'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={closeModal}>OK</button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <ModalContext.Provider value={{ showModal, showSuccess, showError, showConfirm, closeModal }}>
      {children}
      {/* Render modal via portal directly to body — bypasses CSS transform stacking contexts */}
      {createPortal(modalJsx, document.body)}
    </ModalContext.Provider>
  );
}
