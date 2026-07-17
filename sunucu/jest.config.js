module.exports = {
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testMatch: ['**/testler/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'denetleyiciler/**/*.js',
    'servisler/**/*.js',
    'araclar/**/*.js'
  ]
};
