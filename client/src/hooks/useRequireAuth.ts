'use client';

import { useState, useMemo } from 'react';
import { createElement } from 'react';
import { useAuthStore } from '../store/authStore';
import { RequireAuthModal } from '../components/auth/RequireAuthModal';

/**
 * Hook for soft-wall authentication checks
 * Returns a function that checks if user is authenticated,
 * and opens a modal if they're not (instead of redirecting)
 */
export function useRequireAuth() {
  const { isAuthed } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionName, setActionName] = useState<string | undefined>();

  const requireAuth = (action?: string): boolean => {
    if (isAuthed()) {
      return true;
    }

    // Open modal instead of redirecting
    setActionName(action);
    setIsModalOpen(true);
    return false;
  };

  const Modal = useMemo(() => {
    if (!isModalOpen) return null;
    return createElement(RequireAuthModal, {
      isOpen: isModalOpen,
      onClose: () => setIsModalOpen(false),
      actionName: actionName,
    });
  }, [isModalOpen, actionName]);

  return {
    requireAuth,
    isAuthenticated: isAuthed(),
    RequireAuthModal: Modal,
  };
}
