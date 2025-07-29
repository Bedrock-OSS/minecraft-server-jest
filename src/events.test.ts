import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { system, world } from '@minecraft/server';
import { ExecutionPhase, getPhase, setPhase } from './controller';

beforeEach(() => {
    setPhase(ExecutionPhase.Normal);
});

describe('minecraft-server-jest - event mocks', () => {
    test('scriptEventReceive fires on sendScriptEvent', () => {
        const handler = jest.fn();
        system.afterEvents.scriptEventReceive.subscribe(handler);
        system.sendScriptEvent('ch', 'payload');
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({
            id: 'ch',
            message: 'payload',
        });
    });

    test('before event runs in read-only mode', () => {
        const ev = world.beforeEvents.itemUse;
        ev.subscribe(() => {
            expect(getPhase()).toBe(ExecutionPhase.ReadOnly);
            expect(() => world.sendMessage('nope')).toThrow();
        });
        (ev as any).trigger({} as any);
    });

    test('system.sendScriptEvent rejects > 2048 chars', () => {
        const bigPayload = 'x'.repeat(2049);
        expect(() => system.sendScriptEvent('channel', bigPayload)).toThrow(
            /payload/i
        );
    });

    test('system.sendScriptEvent counts bytes, not characters', () => {
        const widePayload = 'é'.repeat(1025); // 2 bytes each -> 2050 bytes
        expect(() => system.sendScriptEvent('channel', widePayload)).toThrow(
            /payload/i
        );
    });
});
