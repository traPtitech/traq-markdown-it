module.exports = {
  moduleNameMapper: {
    '^#/(.+)': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.ts$': 'esbuild-jest'
  },
  coverageDirectory: './coverage/',
  collectCoverage: true
}
