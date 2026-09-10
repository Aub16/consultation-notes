USE consultation_notes;

-- Mot de passe pour tous les comptes de démo : password123
-- (hash + sel générés avec crypto.scryptSync, cf. api/src/utils/password.js)
SET @demo_hash = '202a808929054a83bd8588963b1416ab1eea3681c0975d4b231cb5a2ef9f4ae333a186dd382e10aabdf57071a494b8d137417504543af4190bdda03838ae6538';
SET @demo_salt = 'e4a771590fa36ac5487f381b45a37fdc';

-- Superviseur
INSERT INTO users (first_name, last_name, email, password_hash, password_salt, role, status)
VALUES ('Aubin', 'Devogelaere', 'a.devogelaere@ecole.fr', @demo_hash, @demo_salt, 'superviseur', 'active');

-- Enseignants
INSERT INTO users (first_name, last_name, email, password_hash, password_salt, role, status)
VALUES
  ('Pr.', 'Dubois', 'p.dubois@ecole.fr', @demo_hash, @demo_salt, 'enseignant', 'active'),
  ('Pr.', 'Bernard', 'p.bernard@ecole.fr', @demo_hash, @demo_salt, 'enseignant', 'active'),
  ('Pr.', 'Smith', 'p.smith@ecole.fr', @demo_hash, @demo_salt, 'enseignant', 'active'),
  ('Pr.', 'Laurent', 'p.laurent@ecole.fr', @demo_hash, @demo_salt, 'enseignant', 'active');

-- Étudiants (actifs)
INSERT INTO users (first_name, last_name, email, password_hash, password_salt, role, status, level, student_number)
VALUES
  ('Léa', 'Martin', 'lea.martin@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-001'),
  ('Antoine', 'Petit', 'antoine.petit@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-014'),
  ('Camille', 'Roux', 'camille.roux@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-021'),
  ('Hugo', 'Moreau', 'hugo.moreau@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-008'),
  ('Sarah', 'Cohen', 'sarah.cohen@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-033'),
  ('Yanis', 'Benali', 'yanis.benali@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'active', 'L3', '#2024-045');

-- Demandes de compte en attente (pour la démo superviseur)
INSERT INTO users (first_name, last_name, email, password_hash, password_salt, role, status)
VALUES
  ('Thomas', 'Marchand', 't.marchand@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'pending'),
  ('Nadia', 'Fontaine', 'n.fontaine@ecole.fr', @demo_hash, @demo_salt, 'enseignant', 'pending'),
  ('Elias', 'Lefebvre', 'e.lefebvre@ecole.fr', @demo_hash, @demo_salt, 'etudiant', 'pending');

-- Cours
INSERT INTO courses (name, level, teacher_id) VALUES
  ('Mathématiques', 'L3', (SELECT id FROM users WHERE email = 'p.dubois@ecole.fr')),
  ('Informatique', 'L3', (SELECT id FROM users WHERE email = 'p.bernard@ecole.fr')),
  ('Anglais', 'L3', (SELECT id FROM users WHERE email = 'p.smith@ecole.fr')),
  ('Physique', 'L3', (SELECT id FROM users WHERE email = 'p.laurent@ecole.fr'));

SET @maths = (SELECT id FROM courses WHERE name = 'Mathématiques');
SET @info = (SELECT id FROM courses WHERE name = 'Informatique');
SET @anglais = (SELECT id FROM courses WHERE name = 'Anglais');
SET @physique = (SELECT id FROM courses WHERE name = 'Physique');

SET @lea = (SELECT id FROM users WHERE email = 'lea.martin@ecole.fr');
SET @antoine = (SELECT id FROM users WHERE email = 'antoine.petit@ecole.fr');
SET @camille = (SELECT id FROM users WHERE email = 'camille.roux@ecole.fr');
SET @hugo = (SELECT id FROM users WHERE email = 'hugo.moreau@ecole.fr');
SET @sarah = (SELECT id FROM users WHERE email = 'sarah.cohen@ecole.fr');
SET @yanis = (SELECT id FROM users WHERE email = 'yanis.benali@ecole.fr');

-- Inscriptions
INSERT INTO enrollments (course_id, student_id, colle_hours) VALUES
  (@maths, @lea, 0),
  (@maths, @antoine, 0),
  (@maths, @camille, 0),
  (@maths, @hugo, 0),
  (@maths, @sarah, 2),
  (@maths, @yanis, 0),
  (@info, @lea, 0),
  (@anglais, @lea, 0),
  (@physique, @lea, 0);

-- Évaluations et notes de Léa Martin (cf. écran "Mes notes")
INSERT INTO evaluations (course_id, label) VALUES (@info, 'Devoir 1'), (@info, 'Devoir 2'), (@info, 'Devoir 3');
SET @info_e1 = (SELECT id FROM evaluations WHERE course_id = @info ORDER BY id ASC LIMIT 1);
SET @info_e2 = (SELECT id FROM evaluations WHERE course_id = @info ORDER BY id ASC LIMIT 1 OFFSET 1);
SET @info_e3 = (SELECT id FROM evaluations WHERE course_id = @info ORDER BY id ASC LIMIT 1 OFFSET 2);
INSERT INTO grades (evaluation_id, student_id, value) VALUES
  (@info_e1, @lea, 18), (@info_e2, @lea, 17), (@info_e3, @lea, 18.5);

INSERT INTO evaluations (course_id, label) VALUES (@maths, 'Devoir 1'), (@maths, 'Devoir 2');
SET @maths_e1 = (SELECT id FROM evaluations WHERE course_id = @maths ORDER BY id ASC LIMIT 1);
SET @maths_e2 = (SELECT id FROM evaluations WHERE course_id = @maths ORDER BY id ASC LIMIT 1 OFFSET 1);
INSERT INTO grades (evaluation_id, student_id, value) VALUES
  (@maths_e1, @lea, 12), (@maths_e2, @lea, 15),
  (@maths_e1, @antoine, 10), (@maths_e2, @antoine, 15),
  (@maths_e1, @hugo, 8), (@maths_e2, @hugo, 10.8),
  (@maths_e1, @yanis, 16), (@maths_e2, @yanis, 16.2);

INSERT INTO evaluations (course_id, label) VALUES (@anglais, 'Devoir 1'), (@anglais, 'Devoir 2');
SET @anglais_e1 = (SELECT id FROM evaluations WHERE course_id = @anglais ORDER BY id ASC LIMIT 1);
SET @anglais_e2 = (SELECT id FROM evaluations WHERE course_id = @anglais ORDER BY id ASC LIMIT 1 OFFSET 1);
INSERT INTO grades (evaluation_id, student_id, value) VALUES
  (@anglais_e1, @lea, 14), (@anglais_e2, @lea, 12);

INSERT INTO evaluations (course_id, label) VALUES (@physique, 'Devoir 1'), (@physique, 'Devoir 2');
SET @physique_e1 = (SELECT id FROM evaluations WHERE course_id = @physique ORDER BY id ASC LIMIT 1);
SET @physique_e2 = (SELECT id FROM evaluations WHERE course_id = @physique ORDER BY id ASC LIMIT 1 OFFSET 1);
INSERT INTO grades (evaluation_id, student_id, value) VALUES
  (@physique_e1, @lea, 9), (@physique_e2, @lea, 13);

-- Évaluation en cours de saisie pour le cours de Mathématiques (écran enseignant)
INSERT INTO evaluations (course_id, label) VALUES (@maths, 'Contrôle continu');
SET @maths_cc = (SELECT id FROM evaluations WHERE course_id = @maths ORDER BY id DESC LIMIT 1);
INSERT INTO grades (evaluation_id, student_id, value) VALUES
  (@maths_cc, @antoine, 15),
  (@maths_cc, @hugo, 11.5),
  (@maths_cc, @yanis, 18);
-- Camille et Sarah n'ont pas encore de note pour cette évaluation (état "Saisir…")
