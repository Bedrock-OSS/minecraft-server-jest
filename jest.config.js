require('ts-node').register({ transpileOnly: true });
const preset = require('./src/jest-preset.ts').default;
module.exports = {
    ...preset,
    setupFiles: ['<rootDir>/src/register.ts'],
};
