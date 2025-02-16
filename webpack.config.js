const path = require("path");

module.exports = {
  mode: "production",
  devtool: "eval-source-map",
  entry: {
    collections: "./src/collections.ts",
    prioqueues: "./src/prioqueues.ts",
    "avl-quiz": "./src/quizzes/AVL-quiz.ts",
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
