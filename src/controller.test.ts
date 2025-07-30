import {
    setPhase,
    disablePhaseChecks,
    enablePhaseChecks,
    ExecutionPhase,
} from './controller';
import { system, world } from '@minecraft/server';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

describe('minecraft-server-jest - execution-phase guards', () => {
    /* make every test start from a clean, "normal" state */
    beforeEach(() => {
        setPhase(ExecutionPhase.Normal);
        enablePhaseChecks();
    });

    describe('normal phase', () => {
        test('allows world.sendMessage', () => {
            expect(() => world.sendMessage('hello world')).not.toThrow();
        });
    });

    describe('read-only phase', () => {
        test('blocks world.sendMessage', () => {
            setPhase(ExecutionPhase.ReadOnly);
            expect(() => world.sendMessage('blocked')).toThrow();
        });

        test('system.run is permitted', () => {
            setPhase(ExecutionPhase.ReadOnly);
            expect(() => system.run(() => {})).not.toThrow();
        });

        test('disabling phase checks suppresses the guard', () => {
            setPhase(ExecutionPhase.ReadOnly);
            disablePhaseChecks();
            expect(() => world.sendMessage('now allowed')).not.toThrow();
        });

        test('await null skips the read-only mode', async () => {
            setPhase(ExecutionPhase.ReadOnly);
            expect(() => world.sendMessage('blocked')).toThrow();
            await null; // this should skip the read-only mode
            expect(() => world.sendMessage('now allowed')).not.toThrow();
        });
    });

    describe('init phase', () => {
        test('startup.subscribe is permitted and immediately fires', () => {
            setPhase(ExecutionPhase.Init);
            const handler = jest.fn();
            expect(() =>
                system.beforeEvents.startup.subscribe(handler)
            ).not.toThrow();
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('scriptEventReceive.subscribe is forbidden', () => {
            setPhase(ExecutionPhase.Init);
            expect(() =>
                system.afterEvents.scriptEventReceive.subscribe(jest.fn())
            ).toThrow();
        });

        test('timers are forbidden', () => {
            setPhase(ExecutionPhase.Init);
            expect(() => system.run(() => {})).toThrow();
        });
    });

    describe('early phase', () => {
        test('scriptEventReceive.subscribe is allowed', () => {
            setPhase(ExecutionPhase.EarlyExecution);
            expect(() =>
                system.afterEvents.scriptEventReceive.subscribe(jest.fn())
            ).not.toThrow();
        });

        test('timers are allowed', () => {
            setPhase(ExecutionPhase.EarlyExecution);
            const id = system.run(() => {});
            expect(typeof id).toBe('object');
            system.clearRun(id as any);
        });
    });

    describe('timers', () => {
        test('normal mode in timers', () => {
            setPhase(ExecutionPhase.EarlyExecution);
            system.run(() => {
                expect(() =>
                    world.sendMessage('hello from timer')
                ).not.toThrow();
            });
        });
    });
});
