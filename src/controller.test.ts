import {
    setPhase,
    disablePhaseChecks,
    enablePhaseChecks,
    ExecutionPhase,
} from './controller';
import { system, world } from '@minecraft/server';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

/**
 * Test-suite for the phase-enforcement logic shipped with
 * @your-scope/minecraft-server-jest
 *
 * Assumes ts-jest is configured for this project.
 */

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
        beforeEach(() => setPhase(ExecutionPhase.ReadOnly));

        test('blocks world.sendMessage', () => {
            expect(() => world.sendMessage('blocked')).toThrow(/READ-ONLY/i);
        });

        test('blocks system.run (timers)', () => {
            expect(() => system.run(() => {})).toThrow(/READ-ONLY/i);
        });

        test('disabling phase checks suppresses the guard', () => {
            disablePhaseChecks();
            expect(() => world.sendMessage('now allowed')).not.toThrow();
        });
    });

    describe('init phase', () => {
        beforeEach(() => setPhase(ExecutionPhase.Init));

        test('startup.subscribe is permitted and immediately fires', () => {
            const handler = jest.fn();
            expect(() =>
                system.beforeEvents.startup.subscribe(handler)
            ).not.toThrow();
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('scriptEventReceive.subscribe is forbidden', () => {
            expect(() =>
                system.afterEvents.scriptEventReceive.subscribe(jest.fn())
            ).toThrow(/INIT phase/i);
        });

        test('timers are forbidden', () => {
            expect(() => system.run(() => {})).toThrow(/INIT phase/i);
        });
    });

    describe('early phase', () => {
        beforeEach(() => setPhase(ExecutionPhase.EarlyExecution));

        test('scriptEventReceive.subscribe is allowed', () => {
            expect(() =>
                system.afterEvents.scriptEventReceive.subscribe(jest.fn())
            ).not.toThrow();
        });

        test('timers are allowed', () => {
            const id = system.run(() => {});
            expect(typeof id).toBe('number');
            system.clearRun(id);
        });
    });

    describe('payload size limits', () => {
        test('system.sendScriptEvent rejects > 2048 chars', () => {
            const bigPayload = 'x'.repeat(2049);
            expect(() => system.sendScriptEvent('channel', bigPayload)).toThrow(
                /payload/i
            );
        });
    });
});
