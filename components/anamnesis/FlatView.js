import AnswerCard from './AnswerCard';

export default function FlatView({ answers }) {
  if (answers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Henüz cevap bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {answers.map((answer, idx) => (
        <div key={answer.id} className="flex items-start space-x-3">
          <span className="text-sm font-medium text-gray-400 mt-1 min-w-[2rem]">
            {idx + 1}.
          </span>
          <div className="flex-1">
            <AnswerCard answer={answer} showCategory={true} />
          </div>
        </div>
      ))}
    </div>
  );
}

