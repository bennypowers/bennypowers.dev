const path = require('path');
module.exports = function(eleventyConfig, specifiers) {
  const contents = specifiers.map(spec =>
      typeof spec === 'string' ? `import '${spec}';`
    : `export ${spec.names ?? '*'} from '${spec.specifier}';`).join('\n');

  eleventyConfig.on('eleventy.before', async (e) => {
    console.log('bundling with esbuild');
    const { build } = await import('esbuild');
    await build({
      bundle: true,
      outfile: '_site/assets/components.min.js',
      minify: true,
      format: 'esm',
      stdin: {
        contents,
        sourcefile: 'components.js',
        resolveDir: path.join(__dirname, '..', 'node_modules'),
      }
    });
    console.log('  ...done');
  });

}
