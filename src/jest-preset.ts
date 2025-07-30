import type { Config } from 'jest';

const preset: Config = {
    setupFiles: ['@bedrock-oss/minecraft-server-jest'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    moduleNameMapper: {
        '^@minecraft/server$': '@bedrock-oss/minecraft-server-jest/mock',
    },
};

export default preset;
