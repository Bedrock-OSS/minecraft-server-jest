import type { Config } from 'jest';

const preset: Config = {
    setupFiles: ['@bedrock-oss/minecraft-server-jest'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
};

export default preset;
