import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { env, isLangflowConfigured } from './env.js';
import './db/client.js';
import { authRouter } from './routes/auth.routes.js';
import { meRouter } from './routes/me.routes.js';
import { conversationsRouter } from './routes/conversations.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', meRouter);
app.use('/api/v1/conversations', conversationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[server] rodando em http://localhost:${env.port}`);
  console.log(
    isLangflowConfigured
      ? '[server] integração com Langflow configurada.'
      : '[server] Langflow não configurado — respostas em modo mock (veja server/.env).'
  );
});
