import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { FunctionName } from './constants/function-names';
import { processMissedCheckIns } from './services/missed-check-in.service';

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

export const processMissedCheckInsSchedule = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'UTC',
  },
  async () => {
    logger.info(FunctionName.ProcessMissedCheckIns);
    await processMissedCheckIns();
  },
);
