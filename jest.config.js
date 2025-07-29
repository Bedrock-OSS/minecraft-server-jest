require('ts-node').register({ transpileOnly: true });
const preset = require('./src/preset.ts').default;
module.exports = {
  ...preset,
  setupFiles: ['<rootDir>/src/register.ts'],
};
