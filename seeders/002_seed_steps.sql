-- Anamnez step'leri
INSERT INTO anamnesis_steps (name, description, order_index) VALUES
('Genel Değerlendirme', 'İlk değerlendirme ve genel bilgiler', 1),
('Detaylı Değerlendirme', 'Kapsamlı değerlendirme ve detaylı sorular', 2)
ON DUPLICATE KEY UPDATE name=name, description=VALUES(description), order_index=VALUES(order_index);

