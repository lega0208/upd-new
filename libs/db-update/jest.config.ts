/* eslint-disable */
export default {
  displayName: 'db-update',

  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/db-update',
  preset: '../../jest.preset.js',
};
