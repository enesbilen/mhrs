-- Temizle ve yeniden ekle (seeder her çalıştırıldığında temiz başlasın)
DELETE FROM anamnesis_questions;

-- Örnek anamnez soruları - Beslenme kategorisi
INSERT INTO anamnesis_questions (category_id, question_text, question_type, is_required, order_index, options_json, criteria_json) VALUES
-- Beslenme soruları
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Beslenme' LIMIT 1),
  'Çocuk günlük alması gereken kaloriyi alıyor mu?',
  'yes_no',
  true,
  1,
  NULL,
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Beslenme' LIMIT 1),
  'Çocuğun kilosu ile ilgili değerlendirme',
  'single_choice',
  true,
  2,
  '["Normal", "Düşük", "Çok düşük", "Fazla kilolu"]',
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Beslenme' LIMIT 1),
  'Besin alımının yeterli olmasına rağmen kilo kaybı var mı?',
  'yes_no',
  false,
  3,
  NULL,
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Beslenme' LIMIT 1),
  'Çocuğun beslenme şekli',
  'multiple_choice',
  true,
  4,
  '["Anne sütü", "Mama", "Katı gıda", "Enteral beslenme", "Parenteral beslenme"]',
  NULL
),

-- Boşaltım soruları
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Boşaltım' LIMIT 1),
  'Dışkı özelliği',
  'single_choice',
  true,
  1,
  '["Normal", "İshal", "Kabız", "Kanlı", "Mukuslu"]',
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Boşaltım' LIMIT 1),
  'İdrar rengi normal mi?',
  'yes_no',
  true,
  2,
  NULL,
  NULL
),

-- Aktivite/Dinlenme soruları (bilinç kapalıysa gösterilmeyecek)
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Aktivite/Dinlenme' LIMIT 1),
  'Çocuk yoğun bakım ortamında sıkıldığını/vakit geçiremediğini ifade ediyor mu?',
  'yes_no',
  false,
  1,
  NULL,
  '["consciousness_closed", "age_under_4", "developmental_neurological"]'
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Aktivite/Dinlenme' LIMIT 1),
  'Çocuğun aktivite düzeyi',
  'single_choice',
  true,
  2,
  '["Aktif", "Sedanter", "Yatak istirahati", "Hareketsiz"]',
  NULL
),

-- Uyku soruları
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Uyku/İstirahat' LIMIT 1),
  'Çocuğun uyku süresi günde kaç saat?',
  'text_input',
  false,
  1,
  NULL,
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Uyku/İstirahat' LIMIT 1),
  'Uyku kalitesi',
  'single_choice',
  true,
  2,
  '["İyi", "Orta", "Kötü", "Çok kötü"]',
  NULL
),

-- Bilişsel sorular (bilinç kapalıysa gösterilmeyecek)
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Bilişsel/Algısal' LIMIT 1),
  'Çocuğun duygu durumunda değişim var mı?',
  'yes_no',
  false,
  1,
  NULL,
  '["consciousness_closed", "developmental_neurological"]'
),

-- Güvenlik soruları
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Güvenlik/Koruma' LIMIT 1),
  'Düşme riski var mı?',
  'yes_no',
  true,
  1,
  NULL,
  NULL
),
(
  (SELECT id FROM anamnesis_categories WHERE name = 'Güvenlik/Koruma' LIMIT 1),
  'Ağrı var mı?',
  'yes_no_with_note',
  true,
  2,
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE question_text=question_text;

