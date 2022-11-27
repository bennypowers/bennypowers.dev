const isWatching = () =>
  process.argv.includes('--watch') || process.argv.includes('--serve')

module.exports = isWatching;

