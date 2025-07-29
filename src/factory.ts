import {
    arePhaseChecksOn,
    ExecutionPhase,
    getPhase,
    phase,
} from './controller';
import type {
    SystemAfterEvents,
    RawMessage,
    StartupEvent,
    WorldLoadAfterEvent,
    ScriptEventSource as VanillaScriptEventSource,
    SystemBeforeEvents,
    WorldAfterEvents,
    WorldBeforeEvents,
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
    type Callback<T> = (arg: T) => void;

    function createEventSignal<T>(
        before: boolean,
        subscribeGuard = assertNotInit
    ) {
        const subs: Callback<T>[] = [];
        return {
            subscribe(cb: Callback<T>) {
                subscribeGuard();
                subs.push(cb);
                return cb;
            },
            unsubscribe(cb: Callback<T>) {
                subscribeGuard();
                const i = subs.indexOf(cb);
                if (i !== -1) subs.splice(i, 1);
            },
            trigger(data: T) {
                phase(
                    before ? ExecutionPhase.ReadOnly : ExecutionPhase.Normal,
                    () => {
                        subs.forEach((s) => s(data));
                    }
                );
            },
        };
    }

    function createEventsProxy(
        before: boolean,
        overrides: Record<string, any> = {}
    ) {
        const map = new Map<string | symbol, any>();
        return new Proxy(
            {},
            {
                get(_t, prop: string | symbol) {
                    if (!map.has(prop)) {
                        const opts = overrides[prop as string] ?? {};
                        map.set(
                            prop,
                            createEventSignal(
                                before,
                                opts.subscribeGuard ?? assertNotInit
                            )
                        );
                        if (opts.onSubscribe) {
                            const originalSubscribe = map.get(prop).subscribe;
                            map.get(prop).subscribe = (cb: any) => {
                                const res = originalSubscribe(cb);
                                opts.onSubscribe(cb);
                                return res;
                            };
                        }
                    }
                    return map.get(prop);
                },
            }
        );
    }

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
            afterEvents: createEventsProxy(false, {
                scriptEventReceive: { subscribeGuard: assertNotEarlyExecution },
                worldLoad: {
                    onSubscribe: (cb: (e: WorldLoadAfterEvent) => void) =>
                        phase(ExecutionPhase.Normal, () =>
                            cb({
                                blockComponentRegistry: {} as any,
                                itemComponentRegistry: {} as any,
                            })
                        ),
                },
            }) as SystemAfterEvents,
            beforeEvents: createEventsProxy(true, {
                startup: {
                    onSubscribe: (cb: (e: StartupEvent) => void) =>
                        phase(ExecutionPhase.EarlyExecution, () =>
                            cb({
                                blockComponentRegistry: {} as any,
                                itemComponentRegistry: {} as any,
                            })
                        ),
                },
            }) as SystemBeforeEvents,

            sendScriptEvent(channel: string, msg: string) {
                assertNotEarlyExecution();
                const byteLen = Buffer.byteLength(msg, 'utf8');
                if (byteLen > 2048) throw new Error('payload > 2048 chars');
                (this.afterEvents.scriptEventReceive as any).trigger({
                    id: channel,
                    message: msg,
                    sourceType:
                        ScriptEventSource.Server as unknown as VanillaScriptEventSource,
                });
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
            afterEvents: createEventsProxy(false) as WorldAfterEvents,
            beforeEvents: createEventsProxy(true) as WorldBeforeEvents,
            sendMessage(
                message: RawMessage | string | (RawMessage | string)[]
            ) {
                assertWritable();
                console.log(message);
            },
        },
    };
}
