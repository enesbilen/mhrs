export default function AnamnesisHeader({ patient, form }) {
  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Anamnez Sonuçları</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Hasta:</span> {patient.first_name} {patient.last_name}
        </div>
        <div>
          <span className="font-medium">Dosya No:</span> {patient.file_no}
        </div>
        {patient.bed_no && (
          <div>
            <span className="font-medium">Yatak No:</span> {patient.bed_no}
          </div>
        )}
        <div>
          <span className="font-medium">Tarih:</span> {new Date(form.created_at).toLocaleString('tr-TR')}
        </div>
        <div>
          <span className="font-medium">Oluşturan:</span> {form.created_by_name}
        </div>
      </div>
    </div>
  );
}

