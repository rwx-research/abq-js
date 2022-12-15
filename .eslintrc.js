module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    "@typescript-eslint/consistent-type-assertions": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": false
      }
    ],
    "@typescript-eslint/space-before-function-paren": [
      "error",
      {
        "anonymous": "never",
        "named": "never",
        "asyncArrow": "always"
      }
    ],
    "@typescript-eslint/strict-boolean-expressions": "off"
  }
}
