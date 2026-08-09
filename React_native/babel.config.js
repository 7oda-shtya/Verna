module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Keep the worklets plugin last, as required by Reanimated v4.
    plugins: ['transform-inline-environment-variables', 'react-native-worklets/plugin'],
  };
};
