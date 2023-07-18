class GithubContributors extends HTMLElement {
  static exclude = /\[bot\]$/;
  static template = document.createElement('template');
  static userTpl = document.createElement('template');
  static requests = new Map();
  static style = new CSSStyleSheet();
  static {
    this.template.innerHTML = `<ol id="list" part="list"></ol>`
    this.userTpl.innerHTML = `<li><a target="_blank" rel="noopener"><img></a></li>`;
    this.style.replaceSync(/* css */`
      :host {
        display: contents;
        --_margin: calc(var(--avatar-size, 60px) * .3);
      }

      ol {
        list-style-type: none;
        margin: 0;
        padding: 0;
        display: inline-flex;
        flex-wrap: wrap;
        margin-inline-start: var(--_margin);
        margin-block-start: var(--_margin);
      }

      li {
        margin-inline-start: calc(-1 * var(--_margin));
        margin-block-start: calc(-1 * var(--_margin));
      }

      a {
        outline: none;
      }

      img {
        border: 4px solid var(--background-color);
        background: var(--background-color);
        border-radius: 100%;
        overflow: hidden;
        width: var(--avatar-size, 60px);
        aspect-ratio: 1;
        position: relative;
      }

      li:is(:hover, :focus, :focus-within) img {
        z-index: 2;
        border-color: var(--text-color);
      }
    `)
  }

  async #fetch(repo) {
    if (repo) {
      const url = `https://api.github.com/repos/${repo}/contributors`;
      const headers = new Headers();
      const token = localStorage.getItem('gh_pat');
      if (token)
        headers.set('Authorization', `Bearer: ${token}`);
      const users = GithubContributors.requests.get(url) ?? fetch(url, { headers }).then(r => r.json());
      if (!GithubContributors.requests.has(url))
        GithubContributors.requests.set(url, users)
      return users;
    }
  }

  #userTemplate(user) {
    const li = GithubContributors.userTpl.content.cloneNode(true);
          li.querySelector('a').href = user.html_url;
          li.querySelector('img').src = user.avatar_url;
          li.querySelector('img').title = user.login;
    return li;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(GithubContributors.template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [GithubContributors.style];
  }

  async connectedCallback() {
    if (!this.hasAttribute('defer'))
      this.render();
  }

  async render() {
    const list = this.shadowRoot.getElementById('list')
          list.innerHTML = '';
    const response = await this.#fetch(this.getAttribute("repo"));
    const excludedUsers = (await this.#fetch(this.getAttribute('exclude-repo'))) ?? []
    const otherRepo = excludedUsers.reduce((acc, user) => ({ ...acc, [user.login]: user }), {});
    if (Array.isArray(response)) {
      for (const user of response) {
        if (!GithubContributors.exclude.test(user.login) &&
            !otherRepo[user.login])
        list.append(this.#userTemplate(user));
      }
    }
  }
}

customElements.define('github-contributors', GithubContributors);

