import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import QuestionList from '@/components/anamnesis/QuestionList';

const db = require('@/lib/db');

async function getQuestions(sortBy = 'id', sortOrder = 'desc') {
  const validSortFields = {
    id: 'q.id',
    order_index: 'q.order_index',
    question: 'q.question_text',
    category: 'c.name',
    created_at: 'q.created_at'
  };

  const validSortOrders = ['asc', 'desc'];

  const field = validSortFields[sortBy] || 'q.id';
  const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

  // İkincil sıralama için her zaman id kullan (deterministik sıralama için)
  const secondarySort = field === 'q.id' ? '' : `, q.id DESC`;

  const questions = await db.query(
    `SELECT q.*, c.name as category_name,
            GROUP_CONCAT(DISTINCT CONCAT(nd.id, ':', nd.name) ORDER BY nd.name SEPARATOR '||') as related_diagnoses
     FROM anamnesis_questions q
     LEFT JOIN anamnesis_categories c ON q.category_id = c.id
     LEFT JOIN diagnosis_criteria dc ON q.id = dc.question_id
     LEFT JOIN nurse_diagnoses nd ON dc.diagnosis_id = nd.id
     GROUP BY q.id, c.name
     ORDER BY ${field} ${order}${secondarySort}`
  );

  // Parse related diagnoses
  return questions.map((q) => {
    const diagnoses = q.related_diagnoses
      ? q.related_diagnoses.split('||').map((d) => {
          const [id, name] = d.split(':');
          return { id: parseInt(id), name };
        })
      : [];
    return { ...q, related_diagnoses: diagnoses };
  });
}

async function getCategories() {
  return await db.query(
    'SELECT * FROM anamnesis_categories ORDER BY order_index ASC'
  );
}

export default async function QuestionsPage({ searchParams }) {
  await requireUser();
  const params = await searchParams;
  const sortBy = params?.sortBy || 'id';
  const sortOrder = params?.sortOrder || 'desc';

  const questions = await getQuestions(sortBy, sortOrder);

  const categories = await getCategories();

  // Parse JSON fields
  const parsedQuestions = questions.map((q) => ({
    ...q,
    options: q.options_json ? JSON.parse(q.options_json) : null,
    criteria: q.criteria_json ? JSON.parse(q.criteria_json) : [],
    relatedDiagnoses: q.related_diagnoses || [],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold hover:text-blue-600">
                MHRS
              </Link>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">Anamnez Soruları</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Anamnez Soruları Yönetimi</h2>
            <div className="flex gap-3">
              <Link
                href="/anamnesis/categories"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Kategorileri Yönet
              </Link>
              <Link
                href="/anamnesis/questions/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Yeni Soru Ekle
              </Link>
            </div>
          </div>

          <div className="mb-4 bg-white shadow rounded-lg p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-semibold text-gray-700">Sıralama:</span>

              <div className="flex gap-2">
                <Link
                  href={`/anamnesis/questions?sortBy=id&sortOrder=${sortBy === 'id' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                  className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    sortBy === 'id'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  En Yeni {sortBy === 'id' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Link>

                <Link
                  href={`/anamnesis/questions?sortBy=order_index&sortOrder=${sortBy === 'order_index' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                  className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    sortBy === 'order_index'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sıra İndeksi {sortBy === 'order_index' && (sortOrder === 'desc' ? '↓' : '↑')}
                </Link>

                <Link
                  href={`/anamnesis/questions?sortBy=question&sortOrder=${sortBy === 'question' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                  className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    sortBy === 'question'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Soru Metni {sortBy === 'question' && (sortOrder === 'desc' ? 'Z-A' : 'A-Z')}
                </Link>

                <Link
                  href={`/anamnesis/questions?sortBy=category&sortOrder=${sortBy === 'category' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                  className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    sortBy === 'category'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Kategori {sortBy === 'category' && (sortOrder === 'desc' ? 'Z-A' : 'A-Z')}
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <QuestionList questions={parsedQuestions} categories={categories} />
          </div>
        </div>
      </main>
    </div>
  );
}
