import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import QuestionForm from '@/components/anamnesis/QuestionForm';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';

const db = require('@/lib/db');

async function getQuestion(id) {
  const questions = await db.query(
    'SELECT * FROM anamnesis_questions WHERE id = ?',
    [id]
  );

  if (questions.length === 0) return null;

  const question = questions[0];
  return {
    ...question,
    options: question.options_json ? JSON.parse(question.options_json) : null,
    criteria: question.criteria_json ? JSON.parse(question.criteria_json) : [],
  };
}

async function getCategories() {
  return await db.query(
    'SELECT * FROM anamnesis_categories ORDER BY order_index ASC'
  );
}

export default async function EditQuestionPage({ params }) {
  await requireUser();
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header breadcrumbItems={[
        { label: 'Anamnez Soruları', href: '/anamnesis/questions' },
        { label: 'Düzenle' }
      ]} />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Soru Düzenle</h2>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <QuestionForm categories={categories} question={question} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
