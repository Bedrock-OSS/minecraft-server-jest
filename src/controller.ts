export enum ExecutionPhase {
    Init = 'init',
    EarlyExecution = 'early',
    Normal = 'normal',
    ReadOnly = 'read',
}

/* current phase value */
let currentPhase: ExecutionPhase = ExecutionPhase.Init;

/* whether guards should throw */
let phaseChecks = true;

/* phase helpers */
export const setPhase = (p: ExecutionPhase) => {
    currentPhase = p;

    // In Bedrock these phases auto-promote after any micro-task:
    if (
        p === ExecutionPhase.Init ||
        p === ExecutionPhase.EarlyExecution ||
        p === ExecutionPhase.ReadOnly
    ) {
        queueMicrotask(() => {
            /* only promote if the test hasn't changed the phase again */
            if (currentPhase === p) currentPhase = ExecutionPhase.Normal;
        });
    }
};
export const phase = (p: ExecutionPhase, cb: () => void) => {
    const oldPhase = currentPhase;
    setPhase(p);
    cb();
    setPhase(oldPhase);
};
export const getPhase = () => currentPhase;

/* guard helpers */
export const disablePhaseChecks = () => {
    phaseChecks = false;
};
export const enablePhaseChecks = () => {
    phaseChecks = true;
};
export const arePhaseChecksOn = () => phaseChecks;
