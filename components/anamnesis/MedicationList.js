export default function MedicationList({ medications }) {
  if (!medications || medications.length === 0) {
    return (
      <span className="text-sm text-gray-500">İlaç bilgisi girilmemiş</span>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {medications.map((med, idx) => (
        <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">İlaç:</span>
              <span className="ml-2 font-medium text-gray-900">{med.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Doz:</span>
              <span className="ml-2 font-medium text-gray-900">{med.dose || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Sıklık:</span>
              <span className="ml-2 font-medium text-gray-900">{med.frequency || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Yol:</span>
              <span className="ml-2 font-medium text-gray-900">{med.route || '-'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

