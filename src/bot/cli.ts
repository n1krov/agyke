import { startBot } from './index';

// Script de ejecución local para Long Polling
startBot().catch((err) => {
  console.error('❌ Error fatal al iniciar el bot:', err);
  process.exit(1);
});
