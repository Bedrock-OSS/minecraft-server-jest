import {
    arePhaseChecksOn,
    ExecutionPhase,
    getPhase,
    phase,
    setPhase,
} from './controller';
import {
    RawMessage,
    ScriptEventCommandMessageAfterEvent,
    StartupEvent,
    ScriptEventSource as VanillaSes,
    WorldLoadAfterEvent,
} from '@minecraft/server';

const Direction = {
    Down: 'Down',
    East: 'East',
    North: 'North',
    South: 'South',
    Up: 'Up',
    West: 'West',
} as const;
const StructureRotation = {
    None: 'None',
    Rotate90: 'Rotate90',
    Rotate180: 'Rotate180',
    Rotate270: 'Rotate270',
} as const;
const ScriptEventSource = {
    Block: 'Block',
    Entity: 'Entity',
    NPCDialogue: 'NPCDialogue',
    Server: 'Server',
} as const;

export function createMinecraftMock() {
    const listeners: ((e: ScriptEventCommandMessageAfterEvent) => void)[] = [];

    function assertPhaseNot(phases: ExecutionPhase[]) {
        if (!arePhaseChecksOn()) return;
        const phase = getPhase();

        if (phases.includes(phase)) {
            throw new ReferenceError(
                `Native function [${new Error().stack?.split('\n')[2].trim()}] does not have required privileges.`
            );
        }
    }

    function assertWritable() {
        assertPhaseNot([
            ExecutionPhase.ReadOnly,
            ExecutionPhase.Init,
            ExecutionPhase.EarlyExecution,
        ]);
    }

    function assertNotEarlyExecution() {
        assertPhaseNot([ExecutionPhase.EarlyExecution, ExecutionPhase.Init]);
    }

    function assertNotInit() {
        assertPhaseNot([ExecutionPhase.Init]);
    }

    return {
        Direction,
        StructureRotation,
        ScriptEventSource,

        system: {
            afterEvents: {
                scriptEventReceive: {
                    subscribe(
                        cb: (e: ScriptEventCommandMessageAfterEvent) => void
                    ) {
                        assertNotEarlyExecution();
                        listeners.push(cb);
                    },
                },
                worldLoad: {
                    subscribe(cb: (e: WorldLoadAfterEvent) => void) {
                        phase(ExecutionPhase.Normal, () => {
                            cb({
                                blockComponentRegistry: {} as any,
                                itemComponentRegistry: {} as any,
                            });
                        });
                    },
                },
            },
            beforeEvents: {
                startup: {
                    subscribe(cb: (e: StartupEvent) => void) {
                        phase(ExecutionPhase.EarlyExecution, () => {
                            cb({
                                blockComponentRegistry: {} as any,
                                itemComponentRegistry: {} as any,
                            });
                        });
                    },
                },
            },

            sendScriptEvent(channel: string, msg: string) {
                assertNotEarlyExecution();
                if (msg.length > 2048) throw new Error('payload > 2048 chars');
                listeners.forEach((cb) =>
                    cb({
                        id: channel,
                        message: msg,
                        sourceType: VanillaSes.Server,
                    })
                );
            },

            clearRun(id: number) {
                clearInterval(id);
                clearTimeout(id);
            },
            run(cb: () => void) {
                assertNotInit();
                return setTimeout(cb, 50);
            },
            runInterval(cb: () => void, t = 1) {
                assertNotInit();
                return setInterval(cb, t)[Symbol.toPrimitive]();
            },
            runTimeout(cb: () => void, t = 1) {
                assertNotInit();
                return setTimeout(cb, t)[Symbol.toPrimitive]();
            },
        },

        world: {
            sendMessage(
                message: RawMessage | string | (RawMessage | string)[]
            ) {
                assertWritable();
                console.log(message);
            },
        },
    };
}
