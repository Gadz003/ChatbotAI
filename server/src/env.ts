import 'dotenv/config';

function warnInsecureSecret(): string {
  console.warn('[env] SESSION_SECRET não definido — usando valor inseguro de desenvolvimento. Defina um valor forte em produção.');
  return 'dev-insecure-secret-change-me';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  sessionSecret: process.env.SESSION_SECRET ?? warnInsecureSecret(),
  databaseFile: process.env.DATABASE_FILE ?? './data/chatbot.sqlite',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  maxMessageLength: Number(process.env.MAX_MESSAGE_LENGTH ?? 4000),
  maxImagesPerMessage: Number(process.env.MAX_IMAGES_PER_MESSAGE ?? 4),
  langflowBaseUrl: process.env.LANGFLOW_BASE_URL || undefined,
  langflowFlowId: process.env.LANGFLOW_FLOW_ID || undefined,
  langflowApiKey: process.env.LANGFLOW_API_KEY || undefined,
  langflowTimeoutMs: Number(process.env.LANGFLOW_TIMEOUT_MS ?? 30000),
};

export const isLangflowConfigured = Boolean(env.langflowBaseUrl && env.langflowFlowId);
