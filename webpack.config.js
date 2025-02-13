const path = require("path");

module.exports = {
  mode: "production",
  devtool: "eval-source-map",
  entry: {
    collections: "./src/collections.ts",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        include: [path.resolve(__dirname, "src")],
      },
    ],
  },
  output: {
    publicPath: "public",
    filename: "[name].js",
    path: path.resolve(path.join(__dirname, "public", "js")),
  },
};
