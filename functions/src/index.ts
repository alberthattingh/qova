import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

initializeApp();

export const health = onRequest((request, response) => {
  logger.info('Health check requested', {
    method: request.method,
    path: request.path,
  });

  response.json({
    ok: true,
    service: 'qova-functions',
  });
});
