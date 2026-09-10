# Consultation Notes

Application web 3-tiers de consultation de notes (projet DEV1).

- **Présentation** : HTML / CSS / JS natifs (aucun framework front), dans [`front/`](front)
- **Métier** : Node.js natif + Express, dans [`api/`](api) — authentification et sessions codées à la main avec les modules natifs `crypto`/`http` (pas de bcrypt, pas de jsonwebtoken, pas de passport)
- **Données** : MySQL, schéma dans [`api/sql/schema.sql`](api/sql/schema.sql)

Le client ne parle jamais directement à la base : tout passe par l'API.

## Rôles

| Rôle | Peut faire |
|---|---|
| Étudiant | Se connecter, consulter ses notes et sa moyenne par cours |
| Enseignant | Consulter ses cours, voir les étudiants inscrits, saisir/modifier les notes et heures de colle *(extension hors cahier des charges)* |
| Superviseur | Valider ou refuser les demandes de création de compte |

Un compte non validé par un superviseur ne peut pas se connecter.

## Démarrer

### 1. Base de données

```bash
mysql -u root -p --default-character-set=utf8mb4 < api/sql/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < api/sql/seed.sql   # données de démo (facultatif)
```

> `--default-character-set=utf8mb4` est important : sans lui, certains clients MySQL réinterprètent mal les accents des fichiers `.sql` (encodés en UTF-8) et corrompent les noms/prénoms en base.

### 2. API

```bash
cd api
cp .env.example .env   # renseigner les identifiants MySQL
npm install
npm run dev
```

L'API écoute par défaut sur `http://localhost:3000`.

### 3. Front

Le front est statique : ouvrir `front/index.html` via un serveur statique (ex. l'extension Live Server, ou `npx serve front`). Il appelle l'API sur `http://localhost:3000` (voir `front/assets/js/api.js`).

## Comptes de démo (après `seed.sql`)

| Email | Mot de passe | Rôle |
|---|---|---|
| lea.martin@ecole.fr | password123 | Étudiante |
| p.dubois@ecole.fr | password123 | Enseignant |
| a.devogelaere@ecole.fr | password123 | Superviseur |

## Routes API

| Méthode | Route | Accès |
|---|---|---|
| POST | /api/connexion | public |
| POST | /api/inscription | public |
| POST | /api/deconnexion | authentifié |
| GET | /api/moi | authentifié |
| GET | /api/mes-notes | étudiant |
| GET | /api/mes-cours | enseignant |
| GET | /api/cours/:id/notes | enseignant propriétaire |
| POST | /api/cours/:id/evaluations | enseignant propriétaire |
| PUT | /api/cours/:id/etudiants/:studentId/note | enseignant propriétaire |
| PUT | /api/cours/:id/etudiants/:studentId/colle | enseignant propriétaire |
| GET | /api/comptes-en-attente | superviseur |
| POST | /api/comptes-en-attente/:id/valider | superviseur |
| POST | /api/comptes-en-attente/:id/refuser | superviseur |
| GET | /api/admin/stats | superviseur |
