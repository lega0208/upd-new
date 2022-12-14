const { join } = require('path');
const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (config, context) => {
  return merge(config, {
    optimization: {
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: 'apps/api/src/assets/package.json',
            to: join(config.output.path, 'package.json'),
          },
        ],
      }),
    ],
  });
};
