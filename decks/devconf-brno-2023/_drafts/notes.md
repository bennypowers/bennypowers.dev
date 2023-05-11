---
permalink: false
---

# PART 1: A History of Design Systems at Red Hat

## PatternFly 2015
### Bootstrap
### The Web Lacked a Component Model
Until 2015, when a group of browser and web developers at Google produced the 
first iteration of **Polymer**: an initial concept for what would eventually 
become the Web Components standards.

While engineers at Google and other drafted the standards, facebook engineers 
developed their own, incompatible client-side solution

## PatternFly React
Adopting React was a sensible choice at the time, since most - *but not all* - 
PatternFly users were already using it, or were able to use it.

One unfortunate side effect of the decision to go all-in on react is that it cut 
some use cases off from the latest-and-greatest designs. PatternFly v4 core 
provided some css classes, but teams using it had to implement their own 
interactions. PatternFly React was great if you were already using react, but 
harder to interop with if you weren't.

# PART 2: Why PatternFly Elements?

## Version 1: like PF, but different
pfe v1 implemented designs that were similar to patternfly core, but different 
enough to be their own thing. This was because the design and technical needs of 
the teams using pfe v1 were different from the teams using PFv4

## Version 2: PatternFly 1:1
Bringing the best of PatternFly design to more use cases via spec-standard HTML.

## PatternFly Design, but Web Components
- based on design from PF upstream
- but using HTML-first, browser native component model
- look at some components
    - card (mostly css)
    - accordion
    - jump links (mostly javascript)

## What are Web Components
(large scale - compare to native ui frameworks) {slot=notes}

UI toolkits and frameworks stretching back to Delphi 1 (1995) have modelled UIs 
around **components** - reusable, encapsulated objects with consistent external 
APIs

Diagram: a button has a severity, a label, and an action

### Web Component Core Technologies
<figure-img src="ce.svg">Custom Elements</figure-img>
<figure-img src="sd.svg" haha="jokes">Shadow *DOM*</figure-img>
<figure-img src="te.svg">Template Element</figure-img>
<figure-img src="esm.svg">JavaScript Modules</figure-img>

### Who is Using Web Components?
Large Organizations and small Projects
- YouTube
- SAP
- Reddit
- Salesforce
- Scania
- Went to space on the SpaceX Dragon Capsule
- Wordle
{.logo-grid}

[Are Web Components a Thing Yet?](https://arewebcomponentsathingyet.com)
- who's using web components? (youtube, spacex, reddit, etc)
{slot=notes}

### Advantages of Web Components
- Performance / Low Overhead
- Interoperability
- Future Proof
- Knowledge Transfer

### What can you Build with Web Components?
- Apps/ SPAs
- Reusable Widgets
- Design Systems
- Progressively Enhanced Pages

# PART 3: Tech Demo

## Making PFE
- Lit
- TypeScript
- CSS / Tokens

## Getting PFE
- NPM
- CDN (rh / 3rd party)

## Using PFE
### Developer Experience
HTML-First: Remember writing HTML?
Ease up on that webpack config for a minute
Try a CDN first, maybe write an event listener

write a simple demo,

```bash
mkdir /tmp/pfe-demo
cd /tmp/pfe-demo
touch index.html
python -m http.server
```

# CONCLUSION
## The Future
  - demo react wrapper
  - more components (get involved on github!)

## Thanks
