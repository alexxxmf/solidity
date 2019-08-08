module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "babel-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|react-navigation)"
  ],
  testRegex: "(\\/__tests__\\/(?!setup).*\\.(jsx?|tsx?)$)",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePaths: ["<rootDir>"],
  coverageDirectory: "__coverage__",
  setupFiles: ["./__tests__/setup.js"]
};
