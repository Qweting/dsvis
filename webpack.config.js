/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const fs = require("fs");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");

// Get all the html files in the views directory
const htmlPageNames = [];
const pages = fs.readdirSync("./views", { recursive: true });
pages.forEach((page) => {
    if (page.endsWith(".html")) {
        htmlPageNames.push(page.split(".html")[0]);
    }
});

const config = {
    // Important that entries are names the same as the html files in the views directory otherwise they won't add the js file to the html file
    // Everything added to globals will be added to all the html files in the views directory
    entry: {
        globals: ["./dsvis.css"],
        collections: "./src/collections.ts",
        prioqueues: "./src/prioqueues.ts",
        sorting: "./src/sorting.ts",
        "avl-quiz": "./src/quizzes/AVL-quiz.ts",
    },
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "js/[name].js",
        clean: true,
    },
    devServer: {
        open: true,
        host: "localhost",
    },
    plugins: [
        ...htmlPageNames.map(
            (name) =>
                new HtmlWebpackPlugin({
                    template: `views/${name}.html`,
                    inject: true,
                    chunks: ["globals", name],
                    filename: `${name}.html`,
                })
        ),
        new RemoveEmptyScriptsPlugin(),
        new MiniCssExtractPlugin({ filename: "css/[name].css" }),
        new FaviconsWebpackPlugin("./logo.svg"),

        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: "asset",
            },

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
        plugins: [new TsconfigPathsPlugin()],
    },
};

module.exports = (env, argv) => {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
        config.mode = "production";
        config.devtool = false;
    } else {
        config.mode = "development";
        config.devtool = "inline-source-map";
    }

    return config;
};
