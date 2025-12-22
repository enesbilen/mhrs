'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

/**
 * Modern alert dialog component
 *
 * @param {boolean} isOpen - Dialog açık mı?
 * @param {function} onClose - Dialog kapatma callback
 * @param {string} title - Dialog başlığı
 * @param {string} message - Dialog mesajı
 * @param {string} buttonText - Buton metni
 * @param {string} variant - Dialog tipi (success, error, info)
 */
export default function AlertDialog({
  isOpen,
  onClose,
  title = 'Bildirim',
  message = '',
  buttonText = 'Tamam',
  variant = 'info', // success, error, info
}) {
  const variantStyles = {
    success: {
      icon: (
        <svg
          className="h-6 w-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: 'bg-green-100',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    error: {
      icon: (
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    info: {
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    warning: {
      icon: (
        <svg
          className="h-6 w-6 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
  };

  const style = variantStyles[variant];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${style.iconBg} rounded-full p-3`}>
              {style.icon}
            </div>
            <div className="ml-4 flex-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
              <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">{message}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.button}`}
            >
              {buttonText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
