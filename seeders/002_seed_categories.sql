-- Anamnez soru kategorileri
INSERT INTO anamnesis_categories (name, order_index) VALUES
('Beslenme', 1),
('Boşaltım', 2),
('Aktivite/Dinlenme', 3),
('Uyku/İstirahat', 4),
('Bilişsel/Algısal', 5),
('Güvenlik/Koruma', 6),
('Rol/İlişki', 7),
('Değer/İnanç', 8),
('Başa Çıkma/Stres Toleransı', 9),
('Konfor', 10)
ON DUPLICATE KEY UPDATE name=name;
