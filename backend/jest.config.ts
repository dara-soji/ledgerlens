import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
  prefix: '<rootDir>',
});

export default {
  preset: 'ts-jest',
  transform: {
    '.+\\.ts$': 'ts-jest',
    '.+\\.js$': 'ts-jest',
  },
  testPathIgnorePatterns: ['node_modules', '.js'],
  collectCoverageFrom: ['**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules',
    '/dist',
    '.module.ts',
    '.controller.ts',
    'test',
    'main.ts',
    'jest.config.ts',
    '.dto.ts',
  ],
  coverageDirectory: '.nyc_output',
  clearMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['json', 'text'],
  moduleNameMapper,
  testTimeout: 30000,
};
