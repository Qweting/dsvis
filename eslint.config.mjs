import tseslint from 'typescript-eslint';

export default tseslint.config(
    tseslint.configs.recommended,
    {
        rules: {
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
                functions: false,
            }],

            "block-scoped-var": ["error"],
            "consistent-return": ["error"],
            "prefer-rest-params": ["error"],
            "prefer-spread": ["error"],

            "no-unused-vars": ["off"],
            "@typescript-eslint/no-unused-vars": ["off"],

            "camelcase": ["warn"],

            "prefer-const": ["warn", {
                destructuring: "all",
            }],

            "default-param-last": ["warn"],
            "no-shadow": ["warn"],
            "prefer-template": ["warn"],

            "curly": ["error", "all"],
        },
    },
);
