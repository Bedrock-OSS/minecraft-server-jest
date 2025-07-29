# minecraft-server-jest

A Jest preset and mock library for testing scripts that use the `@minecraft/server` API. This package provides typed mocks for a small portion of the Bedrock server module so you can write unit tests without needing a running game.

## Installation

```bash
npm install --save-dev @bedrock-oss/minecraft-server-jest
```

## Usage

Add the preset to your Jest configuration. This automatically registers the mocks for `@minecraft/server`.

```js
// jest.config.js
module.exports = {
  preset: '@bedrock-oss/minecraft-server-jest/preset',
};
```

Run Jest as normal:

```bash
npx jest
```

Phase checks emulate Bedrock's execution phases. They are enabled by default. Set `MC_PHASE_CHECKS=false` to disable them for an entire run.

### Example

```ts
import { world } from '@minecraft/server';

test('hello world', () => {
    system.run(() => {
        world.sendMessage('hello');
    });
});
```
