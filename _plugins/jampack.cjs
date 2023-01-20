const { exec: _exec } = require('node:child_process');
const { promisify } = require('node:util');
const exec = promisify(_exec);

module.exports = function(eleventyConfig) {
  eleventyConfig.on('eleventy.after', async function({ runMode }) {
    if (runMode === 'build') {
      await exec('npx @divriots/jampack ./_site');
    }
  })
}
