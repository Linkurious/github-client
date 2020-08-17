module.exports = {
  "env": {
    "browser": false,
    "commonjs": true,
    "es2020": true,
    "node": true,
    "mocha": true
  },
  "extends": ["plugin:mocha/recommended", "eslint:recommended", "prettier"],
  "parserOptions": {
    "ecmaVersion": 11
  },
  "plugins": [
    "mocha"
  ],
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};
