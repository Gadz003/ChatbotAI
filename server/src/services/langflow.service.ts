import { env, isLangflowConfigured } from '../env.js';
import { Errors } from '../errors.js';

interface SendToLangflowParams {
  message: string;
  sessionId: string;
  images?: string[];
}

function mockResponse(message: string): string {
  return (
    `_[Modo de desenvolvimento — Langflow não configurado]_\n\n` +
    `Recebi: **"${message}"**.\n\n` +
    `Configure \`LANGFLOW_BASE_URL\`, \`LANGFLOW_FLOW_ID\` e \`LANGFLOW_API_KEY\` em \`server/.env\` ` +
    `para conectar a um fluxo real.`
  );
}

export async function sendToLangflow({ message, sessionId, images = [] }: SendToLangflowParams): Promise<string> {
  if (!isLangflowConfigured) {
    return mockResponse(message);
  }

  const url = `${env.langflowBaseUrl}/api/v1/run/${env.langflowFlowId}`;
  const payload: Record<string, unknown> = {
    output_type: 'chat',
    input_type: 'chat',
    input_value: message,
    session_id: sessionId,
  };
  if (images.length > 0) {
    payload.files = images.map((data) => ({ data, type: 'image/png' }));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.langflowTimeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.langflowApiKey ? { 'x-api-key': env.langflowApiKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw Errors.aiUnavailable('Tempo limite ao comunicar com o Langflow.');
    }
    throw Errors.aiUnavailable('Não foi possível conectar ao Langflow.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw Errors.aiProviderError(`Langflow retornou status ${response.status}.`);
  }

  const data: any = await response.json().catch(() => null);
  const text = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw Errors.aiProviderError('Resposta do Langflow em formato inesperado.');
  }
  return text;
}
