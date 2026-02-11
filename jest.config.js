module.exports = {
  moduleNameMapper: {
    '^#/(.+)': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.m?(ts|js)?$': 'es-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(markdown-it)/)'],
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  reporters: ['default', 'github-actions']
}
