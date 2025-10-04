---
title: Apollo Elements v3.0.0 - GraphQL Meets Web Components
published: true
date: 2025-10-04
tags:
  - web components
  - graphql
  - apollo
  - lit
  - open source
audience: Web developers, GraphQL users, web component enthusiasts
tldr: >-
  After 3+ years, Apollo Elements v3.0.0 is here with Apollo Client 4 support, Node.js 24, and a cleaner API. Build GraphQL-powered web components that work in any framework—or no framework at all.
coverImage: /assets/images/apollo-elements-3.png
coverImageAlt: Apollo Elements logo featuring a rocket and moon representing GraphQL-powered web components
---

🚀 I'm excited to announce **Apollo Elements v3.0.0**—the first major release in over three years!

After a long hiatus since v2.0.0 in February 2022, Apollo Elements is back with Apollo Client 4 support, modern tooling, and a refined developer experience for building GraphQL-powered web components.

## 🤔 What is Apollo Elements?

Apollo Elements is a library that brings GraphQL to web components using Apollo Client. It provides reactive controllers, base classes, and ready-to-use components that let you build data-driven UIs with web standards.

The core value proposition? **True portability.** Web components work everywhere—Angular, React, Vue, Svelte, vanilla JavaScript, or any framework you can think of. Write your GraphQL components once using web standards, and they'll work across your entire stack.

## ✨ What's New in v3

### Apollo Client 4 Support

Updated to support the latest Apollo Client with all its improvements to error handling, caching, and overall performance. If you're already on Apollo Client 4, the migration should be smooth.

### Node.js 24

Leveraging the latest LTS release for modern JavaScript features and better performance across the board.

### Streamlined Subscription API

Subscription controllers now use a single `error` field instead of an `errors` array, matching Apollo Client's patterns and simplifying error handling:

```typescript
// Before (v2)
subscription.errors; // readonly GraphQLFormattedError[]

// After (v3)
subscription.error; // Error | null
```

### 11 Packages Shipped

The release includes coordinated updates across all packages:
- **@apollo-elements/core** (v3.0.0) - Reactive controllers
- **@apollo-elements/lit-apollo** (v6.0.0) - Lit integration
- **@apollo-elements/components** (v4.0.0) - HTML components
- **@apollo-elements/fast** (v4.0.0) - FAST integration
- **@apollo-elements/haunted** (v4.0.0) - Hooks for web components
- **@apollo-elements/atomico** (v3.0.0) - Atomico integration
- **@apollo-elements/hybrids** (v6.0.0) - Hybrids descriptors
- **@apollo-elements/mixins** (v6.0.0) - Framework-agnostic mixins
- **@apollo-elements/polymer** (v6.0.0) - Polymer integration
- **@apollo-elements/gluon** (v6.0.0) - Gluon integration
- **@apollo-elements/create** (v5.0.0) - Project scaffolding

## 💻 Code Examples

### Reactive Controllers (Framework-Agnostic)

The reactive controller approach works with any web component library:

```typescript
import { ApolloQueryController } from '@apollo-elements/core';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

const UserQuery = gql`
  query UserQuery($id: ID!) {
    user(id: $id) {
      id
      name
      avatar
      bio
    }
  }
`;

@customElement('user-profile')
class UserProfile extends LitElement {
  query = new ApolloQueryController(this, UserQuery, {
    variables: { id: this.userId }
  });

  render() {
    const { data, loading, error } = this.query;

    if (loading) return html`<loading-spinner></loading-spinner>`;
    if (error) return html`<error-message .error="${error}"></error-message>`;

    return html`
      <article>
        <img src="${data.user.avatar}" alt="${data.user.name}">
        <h2>${data.user.name}</h2>
        <p>${data.user.bio}</p>
      </article>
    `;
  }
}
```

### Declarative HTML Components

For those who prefer a fully declarative approach, the HTML components let you write GraphQL in pure markup:

```html
<apollo-client uri="https://api.example.com/graphql">
  <apollo-query>
    <script type="application/graphql">
      query Users {
        users {
          id
          name
          avatar
        }
      }
    </script>
    <template>
      <style>
        .user-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .user-card {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
      </style>
      <div class="user-grid">
        <template type="repeat" repeat="{{ data.users }}">
          <div class="user-card">
            <img src="{{ item.avatar }}" alt="">
            <h3>{{ item.name }}</h3>
          </div>
        </template>
      </div>
    </template>
  </apollo-query>

  <apollo-mutation refetch-queries="Users">
    <script type="application/graphql">
      mutation AddUser($name: String!, $avatar: String) {
        addUser(name: $name, avatar: $avatar) {
          id
          name
          avatar
        }
      }
    </script>
    <template>
      <form>
        <label>
          Name
          <input data-variable="name" required>
        </label>
        <label>
          Avatar URL
          <input data-variable="avatar" type="url">
        </label>
        <button ?disabled="{{ loading }}">Add User</button>
        <small ?hidden="{{ !data }}">{{ data.addUser.name }} added!</small>
      </form>
    </template>
  </apollo-mutation>
</apollo-client>
```

## 🎯 Why Web Components + GraphQL?

Over the years, I've found this combination particularly powerful for:

1. **Framework-agnostic component libraries** - Build once, use in React, Vue, Angular, or vanilla JS
2. **Micro-frontends** - Share GraphQL components across different framework-based applications
3. **Progressive enhancement** - Start with server-rendered HTML, enhance with client-side GraphQL
4. **Long-term stability** - Web standards don't churn like framework APIs

## 🚀 Getting Started

### Quick Start

```bash
npm init @apollo-elements
```

This interactive CLI will scaffold a new project with your choice of web component library.

### Manual Installation

```bash
npm install @apollo-elements/core @apollo/client graphql
```

Or with your preferred library integration:

```bash
npm install @apollo-elements/lit-apollo lit
npm install @apollo-elements/fast @microsoft/fast-element
npm install @apollo-elements/haunted haunted
# ... etc
```

## 📚 Resources

- **Documentation**: [apolloelements.dev](https://apolloelements.dev)
- **GitHub**: [apollo-elements/apollo-elements](https://github.com/apollo-elements/apollo-elements)
- **Migration Guide**: [Apollo Client 3→4 Migration](https://apolloelements.dev/guides/getting-started/migrating/apollo-client-3/)

### Demo Apps

- [**LaunchCTL**](https://launchctl.apolloelements.dev) - SpaceX launches PWA using the spacex.land GraphQL API ([source](https://github.com/apollo-elements/launchctl))
- [**#leeway**](https://leeway.apolloelements.dev) - Chat PWA demo ([source](https://github.com/apollo-elements/leeway))

## 🙏 Acknowledgements

This release wouldn't be possible without the amazing web components and GraphQL communities. Special thanks to:

- The [Open Web Components](https://open-wc.org) and [Modern Web](https://modern-web.dev) teams for their incredible tooling
- Everyone who filed issues, submitted PRs, and provided feedback over the years
- The Apollo team for their continued work on Apollo Client
- The web components community for pushing the platform forward

## 🔮 What's Next?

I'm excited to see what the community builds with v3. If you're using Apollo Elements in production, have questions, or want to share what you've built, I'd love to hear from you!

- **File issues**: [GitHub Issues](https://github.com/apollo-elements/apollo-elements/issues)
- **Discussions**: [GitHub Discussions](https://github.com/apollo-elements/apollo-elements/discussions)
- **Twitter**: [@ApolloElements](https://twitter.com/ApolloElements)

Let's build something great together! 🌑🚀🌜
