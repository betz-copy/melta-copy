import { logger } from '@microservices/shared';
import config from './config';
import Server from './express/server';

const main = async () => {
    const server = new Server(config.service.port);

    await server.start();

    logger.info(`
🚀 PDF Summary Service is running!
   http://localhost:${config.service.port}

📖 Endpoints:
   GET  /health     - Check service status
   POST /summarize  - Upload (Multiple) PDFs to summarize
                      (form-data, key: "files")

🤖 Using model: ${config.openai.model}
${!config.openai.apiKey ? '⚠️  Warning: API Key not configured!' : '✅ API Key configured'}
✨ Multi-file upload enabled (key: "files")
  `);
};

main().catch((error) => logger.error('Main error: ', { error }));
