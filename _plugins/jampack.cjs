const { exec: _exec } = require('node:child_process');
const { promisify } = require('node:util');
const exec = promisify(_exec);

module.exports = function(eleventyConfig, options) {
  eleventyConfig.ignores.add('.jampack/**/*');
  eleventyConfig.on('eleventy.after', async function({ runMode }) {
    if (runMode === 'build' && process.env.NO_JAMPACK !== 'true') {
      let command = 'npx @divriots/jampack ./_site' 
      if (options?.exclude)
        command += ` ${options.exclude}`
      await exec(command);
    }
  })
}
