## Special Thanks {slot=title}

### Contributors
<div id="contributors">
  <github-contributors repo="patternfly/patternfly-elements"></github-contributors>
  <github-contributors repo="redhat-ux/red-hat-design-system" exclude="bennypowers,nikkimk,brianferry,heyMP,marionnegp,wesruv,eyevana,kylebuch8,markcaron"></github-contributors>
</div>

<small>Icon Credits (CC BY 3.0): Yuval Galanti, Icon Solutions, Made by Made, Smashicons, Prime Icons</small>

<style>
#contributors {
  --avatar-size: 128px;
  --_margin: calc(var(--avatar-size, 60px) * .3);
  margin-inline-start: var(--_margin);
  margin-block-start: var(--_margin);
}
github-contributors::part(list) {
  display: contents;
  flex-wrap: wrap;
}
github-contributors:not(:first-of-type) {
  margin-inline-start: var(-1 * var(--_margin));
}
#contributors {
  display: flex;
  flex-wrap: wrap;
}
</style>
<script type="module">
class GithubContributors extends HTMLElement {
  static exclude = /^dependabot|^github-actions/;
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

      a { outline: none; }

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
  async connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(GithubContributors.template.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [GithubContributors.style];
    const users = await this.fetch();
    if (Array.isArray(users)) {
      this.render(users);
    }
  }

  async fetch() {
    const repo = this.getAttribute("repo");
    const token = localStorage.getItem('gh_pat');
    if (repo) {
      const excluded = this.getAttribute('exclude')?.split(',')?.map(x => x.trim()) ?? [];
      const url = `https://api.github.com/repos/${repo}/contributors`;
      const headers = new Headers();
      if (token)
        headers.set('Authorization', `Bearer: ${token}`);
      const users = GithubContributors.requests.get(url) ?? await fetch(url, { headers }).then(r => r.json());
      if (!GithubContributors.requests.has(url))
        GithubContributors.requests.set(url, users)
      return users.filter(({ login }) => !GithubContributors.exclude.test(login) && !excluded.includes(login));
    }
  }

  renderUser(user) {
    const li = GithubContributors.userTpl.content.cloneNode(true);
    li.querySelector('a').href = user.html_url;
    li.querySelector('img').src = user.avatar_url;
    li.querySelector('img').title = user.login;
    return li;
  }

  render(users) {
    const list = this.shadowRoot.getElementById('list')
    for (const user of users) {
      list.append(this.renderUser(user));
    }
  }
}

customElements.define('github-contributors', GithubContributors);
</script>
