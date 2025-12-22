import AnswerCard from './AnswerCard';

export default function CategoryView({ categories, answers }) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Henüz kategori bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryAnswers = answers.filter((a) => a.category_name === category.name);

        if (categoryAnswers.length === 0) return null;

        return (
          <div key={category.id} className="border border-gray-200 rounded bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Step {category.step_order || category.step || 1}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{categoryAnswers.length} soru</span>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {categoryAnswers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

