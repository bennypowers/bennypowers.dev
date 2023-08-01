const { exec: _exec } = require('node:child_process');
const { promisify } = require('node:util');
const exec = promisify(_exec);

module.exports = function(eleventyConfig, options) {
  eleventyConfig.ignores.add('.jampack/**/*');
  eleventyConfig.on('eleventy.after', async function({ runMode }) {
    if (runMode === 'build' && process.env.NO_JAMPACK !== 'true') {
      console.log('[jampack] starting...');
      let command = 'npx @divriots/jampack ./_site' 
      if (options?.exclude)
        command += ` ${options.exclude}`
      const start = performance.now();
      await exec(command);
      const delta = performance.now() - start;
      console.log(`[jampack] completed in ${(delta / 1000).toFixed(2)}s`);
    }
  })
}
