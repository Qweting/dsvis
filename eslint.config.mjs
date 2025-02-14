import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@stylistic/recommended-extends"),
    {
        plugins: {
            "@stylistic": stylistic,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },

        rules: {
            "@stylistic/semi": ["error", "always"],

            "@stylistic/indent": ["error", 4, {
                flatTernaryExpressions: true,
            }],

            "@stylistic/quotes": "off",

            "@stylistic/no-multiple-empty-lines": ["warn", {
                max: 2,
            }],

            "@stylistic/array-bracket-spacing": ["warn", "never"],
            "@stylistic/object-curly-spacing": ["warn", "never"],

            "@stylistic/padded-blocks": ["warn", {
                blocks: "never",
                switches: "never",
            }],

            "@stylistic/brace-style": ["warn", "1tbs"],
            "@stylistic/arrow-parens": ["warn", "always"],
            "@stylistic/no-trailing-spaces": ["warn"],

            "@stylistic/no-multi-spaces": ["warn", {
                ignoreEOLComments: false,
            }],

            "@stylistic/space-infix-ops": ["warn"],

            "@stylistic/space-before-function-paren": ["warn", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always",
            }],

            "@stylistic/multiline-ternary": "off",
            "@stylistic/operator-linebreak": "off",
            "eqeqeq": ["error", "smart"],

            "no-constant-condition": ["error", {
                checkLoops: false,
            }],

            "no-var": ["error"],
            "no-bitwise": ["error"],
            "no-array-constructor": ["error"],
            "no-object-constructor": ["error"],
            "no-new-wrappers": ["error"],
            "no-constant-binary-expression": ["error"],
            "no-constructor-return": ["error"],
            "no-new-native-nonconstructor": ["error"],
            "no-self-compare": ["error"],
            "no-template-curly-in-string": ["error"],
            "no-unmodified-loop-condition": ["error"],
            "no-unreachable-loop": ["error"],

            "no-use-before-define": ["error", {
                classes: false,
            }],

            "block-scoped-var": ["error"],
            "consistent-return": ["error"],
            "prefer-rest-params": ["error"],
            "prefer-spread": ["error"],

            "no-unused-vars": ["warn", {
                args: "none",
            }],

            "camelcase": ["warn"],

            "prefer-const": ["warn", {
                destructuring: "all",
            }],

            "default-param-last": ["warn"],
            "no-shadow": ["warn"],
            "prefer-template": ["warn"],
        },
    },
];
