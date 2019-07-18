module.exports = {
  "roots": [
    "<rootDir>/dist/test"
  ],
  "reporters": ["jest-standard-reporter"],
  "modulePaths": [
    "<rootDir>/dist/"
  ],
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.js$",
  "moduleFileExtensions": [
    "js"
  ],
  "testEnvironment": "node",
  "collectCoverage": true,
  "collectCoverageFrom": [
    "dist/!(test)**/**/*.js"
  ]
}
