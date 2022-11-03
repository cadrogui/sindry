//webpack.config.js
var PACKAGE = require('./package.json');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "production",
  devtool: "inline-source-map",
  entry: {
    main: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: "sindri.js",
    library: 'MIT',
    libraryTarget: "umd",
    libraryExport: "default"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
        exclude: [
          path.resolve(__dirname, 'jest.config.ts')
        ]
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),

    new webpack.BannerPlugin({
      banner: (config) => {
        return `/*!
        Build: ${new Date()},
        Version: ${PACKAGE.version},
        Licensed under the ${PACKAGE.license} License,
        Author: ${PACKAGE.author}
        */`
      },
      raw: true,
      entryOnly: false
    })
  ]
};