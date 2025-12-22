'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AlertDialog from '@/components/common/AlertDialog';

export default function RestoreButton({ patientId }) {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', variant: 'error' });

  const handleRestoreClick = () => {
    setRestoreDialog(true);
  };

  const handleRestoreConfirm = async () => {
    setRestoreDialog(false);
    setRestoring(true);

    try {
      const response = await fetch(`/api/patients/${patientId}/restore`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setAlertDialog({
          isOpen: true,
          message: 'Hasta arşivden çıkarıldı',
          variant: 'success',
        });
        router.refresh();
      } else {
        const data = await response.json();
        setAlertDialog({
          isOpen: true,
          message: data.error || 'Hasta arşivden çıkarılamadı',
          variant: 'error',
        });
      }
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        message: 'Bir hata oluştu',
        variant: 'error',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRestoreClick}
        disabled={restoring}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-2"
      >
        {restoring ? 'Geri Yükleniyor...' : 'Arşivden Çıkar'}
      </button>

      <ConfirmDialog
        isOpen={restoreDialog}
        onClose={() => setRestoreDialog(false)}
        onConfirm={handleRestoreConfirm}
        title="Hastayı Arşivden Çıkar"
        message="Bu hastayı arşivden çıkarmak istediğinizden emin misiniz?"
        confirmText="Arşivden Çıkar"
        cancelText="İptal"
        variant="info"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.variant === 'error' ? 'Hata' : 'Başarılı'}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </>
  );
}

