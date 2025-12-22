-- Temizle ve yeniden ekle (seeder her çalıştırıldığında temiz başlasın)
DELETE FROM anamnesis_questions;

-- Örnek anamnez soruları - Beslenme kategorisi
INSERT INTO anamnesis_questions (category_id, question_text, question_type, is_required, order_index, options_json, criteria_json) VALUES
-- Beslenme soruları
(
  1,
  'Çocuk günlük alması gereken kaloriyi alıyor mu?',
  'yes_no',
  true,
  1,
  NULL,
  NULL
),
(
  1,
  'Çocuğun kilosu ile ilgili değerlendirme',
  'single_choice',
  true,
  2,
  '["Normal", "Düşük", "Çok düşük", "Fazla kilolu"]',
  NULL
),
(
  1,
  'Besin alımının yeterli olmasına rağmen kilo kaybı var mı?',
  'yes_no',
  false,
  3,
  NULL,
  NULL
),
(
  1,
  'Çocuğun beslenme şekli',
  'multiple_choice',
  true,
  4,
  '["Anne sütü", "Mama", "Katı gıda", "Enteral beslenme", "Parenteral beslenme"]',
  NULL
),

-- Boşaltım soruları
(
  2,
  'Dışkı özelliği',
  'single_choice',
  true,
  1,
  '["Normal", "İshal", "Kabız", "Kanlı", "Mukuslu"]',
  NULL
),
(
  2,
  'İdrar rengi normal mi?',
  'yes_no',
  true,
  2,
  NULL,
  NULL
),

-- Aktivite/Dinlenme soruları (bilinç kapalıysa gösterilmeyecek)
(
  3,
  'Çocuk yoğun bakım ortamında sıkıldığını/vakit geçiremediğini ifade ediyor mu?',
  'yes_no',
  false,
  1,
  NULL,
  '["consciousness_closed", "age_under_4", "developmental_neurological"]'
),
(
  3,
  'Çocuğun aktivite düzeyi',
  'single_choice',
  true,
  2,
  '["Aktif", "Sedanter", "Yatak istirahati", "Hareketsiz"]',
  NULL
),

-- Uyku soruları
(
  4,
  'Çocuğun uyku süresi günde kaç saat?',
  'text_input',
  false,
  1,
  NULL,
  NULL
),
(
  4,
  'Uyku kalitesi',
  'single_choice',
  true,
  2,
  '["İyi", "Orta", "Kötü", "Çok kötü"]',
  NULL
),

-- Bilişsel sorular (bilinç kapalıysa gösterilmeyecek)
(
  5,
  'Çocuğun duygu durumunda değişim var mı?',
  'yes_no',
  false,
  1,
  NULL,
  '["consciousness_closed", "developmental_neurological"]'
),

-- Güvenlik soruları
(
  6,
  'Düşme riski var mı?',
  'yes_no',
  true,
  1,
  NULL,
  NULL
),
(
  6,
  'Ağrı var mı?',
  'yes_no_with_note',
  true,
  2,
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE question_text=question_text;
