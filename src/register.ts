import { disablePhaseChecks } from './controller';
import { createMinecraftMock } from './factory';
import { jest } from '@jest/globals';

/* Phase checks off for the whole run? */
if (process.env.MC_PHASE_CHECKS === 'false') disablePhaseChecks();

/* Always supply the mock */
jest.doMock('@minecraft/server', createMinecraftMock, { virtual: true });
