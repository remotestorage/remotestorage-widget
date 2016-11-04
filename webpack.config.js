module.exports = {
  entry: "./src/widget.js",
  output: {
    path:'build',
    publicPath: 'build/',
    filename: 'widget.js',
    // export itself to a global var
    libraryTarget: "umd"
  },
  devtool: 'source-map',
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
    loaders: [
      { test: /\.js$/, exclude: '/node_modules|dist/', loader: 'babel' },
      { test: /\.(jpe?g|png|gif|svg)$/i, loader: 'url-loader?limit=10000' }
    ]
  },
  devtool: "source-map"
}
