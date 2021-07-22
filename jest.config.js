module.exports = {
  moduleNameMapper: {
    '^#/(.+)': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.ts$': 'es-jest'
  },
  coverageDirectory: './coverage/',
  collectCoverage: true
}
