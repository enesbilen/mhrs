-- Default admin user
-- username: admin
-- password: admin123
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@mhrs.com', '$2b$10$WcLkxGC1RVGyKoJWNjXpceN1BDRLFqiXrKSk2eyp/VC2oYTUNzTPC', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Default user
-- username: kullanici
-- password: user123
INSERT INTO users (username, email, password_hash, role) VALUES
('kullanici', 'kullanici@mhrs.com', '$2b$10$ExTay5tobE8ZTR9IsBc.Lu8zOyr0Sexp/rfpTJiQ2tpaPUkhDR1r6', 'user')
ON DUPLICATE KEY UPDATE username=username;
