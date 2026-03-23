const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      path.join(__dirname, 'node_modules/expo/node_modules/babel-preset-expo'),
    ],
  };
};
