import { disablePhaseChecks, enablePhaseChecks } from './controller';
let jestInstance: any | undefined;
try {
    ({ jest: jestInstance } = require('@jest/globals'));
} catch {
    jestInstance = undefined;
}

/* Phase checks off for the whole run? */
if (process.env.MC_PHASE_CHECKS === 'false') disablePhaseChecks();

if (jestInstance) {
    jestInstance.doMock(
        '@minecraft/server',
        () => require('./factory').createMinecraftMock(),
        { virtual: true }
    );
}

export { disablePhaseChecks, enablePhaseChecks };
