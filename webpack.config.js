/* global __dirname */
const webpack = require('webpack');
const isProd = (process.env.NODE_ENV === 'production');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// minimize only in production
const plugins = isProd ? [new UglifyJSPlugin({ sourceMap: true })] : [];

module.exports = {
  entry: ["./src/widget.js"],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'widget.js',
    library: 'Widget',
    libraryTarget: 'umd'
  },
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? '#source-map' : '#eval-source-map',
  externals: {
      // require("remotestoragejs") is external and available
      // on the global var RemoteStorage
      // this is how peer dependencies are specified
      // in webpack (we need RemoteStorage but we do not include in bundle)
      "remotestoragejs": {
          root: "RemoteStorage", // in browser <script> this will resolve in this.RemoteStorage
          commonjs2: "remotestoragejs", // require('remotestoragejs')
          commonjs: "remotestoragejs", // require('remotestoragejs')
          amd: "remotestoragejs" // define(['remotestoragejs'], ...)
      }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: plugins
};
