require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const historyRoutes = require('./routes/historyRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Em desenvolvimento aceitamos qualquer origem (inclui abrir os ficheiros
// diretamente com file://, que envia Origin: null). Antes de publicar em
// produção, troca isto por uma lista fixa de domínios permitidos.
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
