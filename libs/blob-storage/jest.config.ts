/* eslint-disable */
export default {
  displayName: 'blob-storage',
  preset: '../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/blob-storage',
};
