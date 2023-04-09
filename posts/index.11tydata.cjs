module.exports = {
  permalink: ({ pagination }) => !!pagination &&
    `/posts/${pagination.pageNumber ? `page-${pagination.pageNumber + 1}/index.html` : ''}`,
}
