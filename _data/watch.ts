export default () =>
  process.argv.includes('--watch') || process.argv.includes('--serve')
