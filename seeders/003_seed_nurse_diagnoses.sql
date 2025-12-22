-- Örnek hemşire tanıları
INSERT INTO nurse_diagnoses (name, description, min_criteria_count) VALUES
(
  'Beslenmede Dengesizlik: Beden gereksiniminden az',
  'Çocuğun besin alımının metabolik ihtiyaçlarını karşılayamaması durumu',
  2
),
(
  'Kabızlık',
  'Normal bağırsak boşaltım paterninde azalma veya güçlük',
  2
),
(
  'İshal',
  'Sık ve sulu dışkılama durumu',
  2
),
(
  'Uyku Paterninde Bozulma',
  'Uykunun kalitesinde ve süresinde bozulma',
  2
),
(
  'Enfeksiyon Riski',
  'İnvaziv prosedürler veya immün sistem zayıflığı nedeniyle enfeksiyon riski',
  2
),
(
  'Ağrı',
  'Hasta tarafından bildirilen veya gözlemlenen rahatsızlık hissi',
  1
),
(
  'Anksiyete',
  'Belirsiz bir tehlikeye karşı huzursuzluk ve endişe hissi',
  2
)
ON DUPLICATE KEY UPDATE name=name;
