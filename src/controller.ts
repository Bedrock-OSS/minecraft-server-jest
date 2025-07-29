export enum ExecutionPhase {
    Init = 'init',
    EarlyExecution = 'early',
    Normal = 'normal',
    ReadOnly = 'read',
}

/* current phase value */
let currentPhase: ExecutionPhase = ExecutionPhase.Init;

/* NEW -> whether guards should throw */
let phaseChecks = true;

/* phase helpers */
export const setPhase = (p: ExecutionPhase) => {
    currentPhase = p;
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
