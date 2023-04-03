module.exports = {
  permalink: ({ pagination }) =>
    `/posts/${pagination.pageNumber ? `page-${pagination.pageNumber + 1}/index.html` : ''}`,
}
