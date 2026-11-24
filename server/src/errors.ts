export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  validation: (message: string) => new AppError(400, 'VALIDATION_ERROR', message),
  unauthenticated: (message = 'Sessão ausente ou inválida.') => new AppError(401, 'UNAUTHENTICATED', message),
  forbidden: (message = 'Você não tem permissão para acessar este recurso.') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Recurso não encontrado.') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message: string) => new AppError(409, 'CONFLICT', message),
  rateLimited: (message = 'Limite de requisições excedido. Tente novamente mais tarde.') => new AppError(429, 'RATE_LIMITED', message),
  aiProviderError: (message = 'Falha ao comunicar com o provedor de IA.') => new AppError(502, 'AI_PROVIDER_ERROR', message),
  aiUnavailable: (message = 'Serviço de IA temporariamente indisponível.') => new AppError(503, 'AI_UNAVAILABLE', message),
  internal: (message = 'Falha inesperada no servidor.') => new AppError(500, 'INTERNAL_ERROR', message),
};
