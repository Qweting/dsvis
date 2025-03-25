/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === "development";

    return {
        mode: isDevelopment ? "development" : "production",
        devtool: isDevelopment ? "inline-source-map" : false,
        entry: {
            // collections: "./src/collections.ts",
            prioqueues: "./src/prioqueues.ts",
            // "avl-quiz": "./src/quizzes/AVL-quiz.ts",
        },
        resolve: {
            extensions: [".ts", ".js"],
            plugins: [new TsconfigPathsPlugin()],
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
};
