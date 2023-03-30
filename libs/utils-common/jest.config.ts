/* eslint-disable */
import type { Config } from 'jest';

export default {
  displayName: 'utils-common',

  transform: {
    '^.+\\.[tj]s$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/utils-common',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  reporters: ['default'],
  verbose: true,
} as Config;
