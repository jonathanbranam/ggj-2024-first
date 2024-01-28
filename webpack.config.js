const path = require('path');

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: [path.resolve(__dirname,'@babylonjs/')],
      },
    ],
  },
};
