const postcss = require('./postcss.cjs');
module.exports = function(eleventyConfig) {
  eleventyConfig.addPairedShortcode('dc23Feature', function(content, lang="html") {
    return `<div slot="feature">

\`\`\`${lang}
${content}
\`\`\`

</div>
${content}

`;
  })

}
