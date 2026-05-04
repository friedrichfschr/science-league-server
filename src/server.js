const { createApp } = require('./app');
const { config } = require('./config');

const app = createApp();

app.listen(config.port, () => {
  console.log(`foodconnect-newsletter-server listening on port ${config.port}`);
  console.log(`  DB configured:    ${config.db.isConfigured}`);
  console.log(`  Email configured: ${config.email.isConfigured}`);
});
