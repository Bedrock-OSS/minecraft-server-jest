import { disablePhaseChecks, enablePhaseChecks } from './controller';
import { jest } from '@jest/globals';

/* Phase checks off for the whole run? */
if (process.env.MC_PHASE_CHECKS === 'false') disablePhaseChecks();

/* Always supply the mock */
jest.doMock(
    '@minecraft/server',
    () => require('./factory').createMinecraftMock(),
    { virtual: true }
);

export { disablePhaseChecks, enablePhaseChecks };
