const app = require('./app');
const { startReminderScheduler } = require('./services/reminderScheduler');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ LundoIA backend a correr em http://localhost:${PORT}`);
  startReminderScheduler();
});
