/* global __dirname */
const isProd = (process.env.NODE_ENV === 'production');
const path = require('path');

module.exports = {
  entry: ["./src/widget.js"],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'widget.js',
    library: 'Widget',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'source-map' : 'eval-source-map',
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
      },
      {
        test: /\.html$/,
        use: "html-loader"
      },
      {
        test: /\.(css|svg)/,
        use: 'raw-loader',
      },
    ]
  },
  devServer: {
    static: path.join(__dirname, 'demo'),
    port: 8008,
    hot: true,
    open: true
  },
  // plugins: plugins
};
