const path = require('path');

// babel-preset-expo is nested under expo/node_modules in this project
const babelPresetExpoPath = path.resolve(
  __dirname,
  'node_modules/expo/node_modules/babel-preset-expo'
);

const babelTransform = [
  'babel-jest',
  {
    configFile: false,
    babelrc: false,
    presets: [
      [babelPresetExpoPath, { reanimated: false }],
    ],
    plugins: [],
  },
];

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '\\.[jt]sx?$': babelTransform,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand|nanoid)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
