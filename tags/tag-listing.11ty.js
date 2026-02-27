const tagSlug = t => t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

export const data = {
  layout: 'gnome2-shell.webc',
  pagination: {
    data: 'collections.tagNames',
    size: 1,
    alias: 'tag',
  },
  permalink({ tag }) {
    return `/tags/${tagSlug(tag)}/`;
  },
};

export function render({ tag, collections, page }) {
  const tagPosts = [...(collections[tag] ?? [])]
    .filter(p => !p.data?.tags?.includes('deck'))
    .reverse();

  if (!tagPosts.length) return '';

  const menubar = /* html */`
  <gtk2-menu-bar slot="menubar">
    <gtk2-menu-button label="File">
      <gtk2-menu-item label="Close Window" href="/tags/" icon="actions/window-close"></gtk2-menu-item>
    </gtk2-menu-button>
    <gtk2-menu-button label="Edit">
      <gtk2-menu-item label="Select All" disabled icon="actions/edit-select-all"></gtk2-menu-item>
    </gtk2-menu-button>
    <gtk2-menu-button label="View">
      <gtk2-menu-item label="Icons" icon="places/folder"></gtk2-menu-item>
    </gtk2-menu-button>
    <gtk2-menu-button label="Places">
      <gtk2-menu-item label="Home" href="/" icon="places/user-home"></gtk2-menu-item>
      <gtk2-menu-item separator></gtk2-menu-item>
      <gtk2-menu-item label="Posts" href="/posts/" icon="places/folder"></gtk2-menu-item>
      <gtk2-menu-item label="Tags" href="/tags/" icon="places/folder"></gtk2-menu-item>
      <gtk2-menu-item label="Decks" href="/decks/" icon="places/folder"></gtk2-menu-item>
    </gtk2-menu-button>
    <gtk2-menu-button label="Help">
      <gtk2-menu-item label="About" href="/help/" icon="status/dialog-information"></gtk2-menu-item>
    </gtk2-menu-button>
  </gtk2-menu-bar>`;

  const icons = tagPosts.map(post => {
    const title = post.data?.title || post.fileSlug;
    return /* html */`
    <a class="nautilus-icon" href="${post.url}">
      <img src="/assets/icons/gnome/mimetypes/text-html.svg" width="48" height="48" alt="" draggable="false">
      <span class="nautilus-label">${title}</span>
    </a>`;
  }).join('\n');

  return /* html */`
<gtk2-window label="${tag}" window-url="${page.url}" icon="places/folder" focused close-href="/tags/">
  ${menubar}
  <span slot="statusbar">${tagPosts.length} items</span>
  <gtk2-scrolled-window>
    <div class="nautilus-icon-view">
      ${icons}
    </div>
  </gtk2-scrolled-window>
</gtk2-window>`;
}
