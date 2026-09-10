const express = require('express');
const cors = require('./middleware/cors');
const cookieParser = require('./middleware/cookies');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth.routes');
const etudiantRoutes = require('./routes/etudiant.routes');
const enseignantRoutes = require('./routes/enseignant.routes');
const superviseurRoutes = require('./routes/superviseur.routes');

const app = express();

app.use(cors);
app.use(express.json());
app.use(cookieParser);
app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', etudiantRoutes);
app.use('/api', enseignantRoutes);
app.use('/api', superviseurRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur.' });
});

module.exports = app;
