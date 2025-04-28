---
title: Introducing Design Tokens Language Server
published: true
tags:
  - design systems
  - design tokens
  - neovim
audience: designers, design system engineers, web developers
tldr: >-
  Design tokens are the single source of truth for UI styling. The
  `design-tokens-language-server` makes working with design tokens a seamless
  experience in your everyday development workflow.
---

Today, I’m excited to introduce [`design-tokens-language-server`][design-tokens-language-server]: a language server and suite of editor plugins that will make your everyday work with design tokens a more pleasant experience.

## What are Design Tokens?

Design tokens are the single source of truth for UI styling within a design system. They’re platform-agnostic variables that store design decisions like color, typography, spacing, and more. Instead of hardcoding these values across your codebase, you define them once and reference them everywhere. This brings consistency to your design and makes updating or scaling a design system much easier.

The power of design tokens is in the fact that they give names to UI design values.
For example, instead of using a hex color code like `#FF5733`, you might define a design token called `--color-primary` that represents that color. This way, if you ever need to change the primary color of your application, you only have to update the token value in one place. This also makes it easier for designers and developers to communicate about design decisions, as they can refer to the token name instead of a specific value.

{% include "assets/images/dtls-design-tokens.svg" %}

By using design tokens, you can ensure that your product maintains consistent style and branding, regardless of platform, framework, or device.

## The Design Tokens Community Group Format

There are a variety of design token formats out there, but the most widely adopted one is the [Design Tokens Community Group (DTCG) format](https://design-tokens.github.io/community-group/). This format was created to provide a single, interoperable standard for design tokens that can be used across different platforms and tools. The format defines how design tokens should be structured and how they can be extended to support various use cases.

This shared format has become the backbone for many tools in the design systems ecosystem, like [style-dictionary](https://styledictionary.com), [figma](https://figma.com), and [penpot](https://penpot.app). By adhering to the standard, the `design-tokens-language-server` ensures compatibility with a wide range of tools while providing advanced editing capabilities for developers.

Here’s an example of the DTCG format:

```json
{
  "color": {
    "$type": "color",
    "text": {
      "primary": {
        "$value": "#333333"
        "$description": "Primary text color, for use in body text."
      },
      "secondary": {
        "$value": "#666666"
        "$description": "Secondary text color, for use in pull quotes."
      }
    }
  }
}
```

The `design-tokens-language-server` takes your project's design tokens in this format
and uses them to provide real-time feedback and advanced editing capabilities in your code editor. Just like the DTCG format is interoperable across different platforms, the language server is designed to work with any code editor that supports the Language Server Protocol (LSP).

## What Is a Language Server?

Before building the `design-tokens-language-server`, I wrote a handful of tools to help in my day-to-day work with design tokens in CSS files:
- Stylelint plugins to catch and fix issues with the tokens in my stylesheets.
- Snippets for neovim and vscode to make it easier to quickly add tokens to files
- Custom neovim scripts to do things like toggle fallback values and refactor tokens across files.

These tools were great for me, but they weren't all editor-agnostic. I wanted to create something that could be used by anyone, regardless of their editor of choice, and share my know-how with my colleagues. Just like how web components allow you to create reusable UI components that can be used in any web application, and design tokens provide a consistent way to define design decisions across platforms, I wanted to create a tool that could be used by anyone, regardless of their editor of choice. Language servers are the perfect solution for this.

A language server is a tool that provides language-specific features like auto-completion, linting, and refactoring to any code editor. It communicates with editors via the [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/), meaning it can work seamlessly across popular IDEs like VSCode, WebStorm, Sublime Text, and even terminal-based editors like NeoVim.

## Why You Need the Design Tokens Language Server

With the `design-tokens-language-server`, you get:

- **Contextual knowledge**: Understands your use of design tokens and how they relate to each other across files.
- **Real-Time Feedback**: Highlights issues and suggests fixes as you type.
- **Time-saving Commands**: Easily performs tasks like toggling fallback values or refactoring tokens across files.
- **Editor Agnosticism**: Works with any editor that supports the Language Server Protocol.

Whether you’re maintaining a design system or just getting started with design tokens, the `design-tokens-language-server` can save you time, reduce errors, and improve collaboration. By bringing advanced editing capabilities and real-time feedback to your editor, it ensures you can work with design tokens efficiently, no matter the size or complexity of your project.

## Getting Started

Ready to get started? Star the [GitHub repository][design-tokens-language-server] and join the conversation in the [issues][issues] or [discussions][discussions]. I’d love to hear your thoughts and feedback on the project.

Install the plugin for your editor of choice and start using design tokens like a pro. The `design-tokens-language-server` is designed to be easy to set up and use, so you can focus on what really matters: building great products.

- [Download the binary for your platform](https://github.com/bennypowers/design-tokens-language-server/releases/latest)
- [Configure neovim](https://github.com/bennypowers/design-tokens-language-server/#neovim)
- [Install the VSCode extension](https://marketplace.visualstudio.com/items?itemName=pwrs.design-tokens-language-server-vscode)

Let’s make design tokens easier to use for everyone.

[design-tokens-language-server]: https://github.com/bennypowers/design-tokens-language-server/
[issues]: https://github.com/bennypowers/design-tokens-language-server/issues/
[discussions]: https://github.com/bennypowers/design-tokens-language-server/discussions/
