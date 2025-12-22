export default function ViewModeButtons({ viewMode, setViewMode }) {
  const modes = [
    { id: 'step', label: "Step'lere Göre" },
    { id: 'category', label: 'Kategorilere Göre' },
    { id: 'flat', label: 'Düz Liste' },
  ];

  return (
    <div className="flex space-x-2 border-b border-gray-200 pb-4">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === mode.id
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

