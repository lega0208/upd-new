# Usability Performance Dashboard

## Stack overview & reading list

### Core
#### [Node](https://nodejs.org)
Node.js is a JavaScript runtime built on Chrome's highly optimized V8 JavaScript engine.
Nearly every part of the stack will use Node in one way or another, so it's very useful to know what it is and how it works. 

#### [npm](https://docs.npmjs.com/about-npm)
npm is the official package manager for Node.js, and comes pre-bundled. It's used to install and manage third-party Node.js packages, as well as for running scripts and/or binaries.

#### [TypeScript](https://www.typescriptlang.org)
TypeScript is a strongly-typed superset of JavaScript that compiles to plain JavaScript. The added type safety helps to prevent common programming errors and catches bugs at compile time rather than at runtime.
And while the type system allows you to create very robust and strict types, it also allows you to use or create types that are loose or flexible enough to accomodate your needs without losing type safety entirely, which you can go back and refine as needed later on.

#### [Nx](https://nx.dev)
- [Nx Documentation](https://nx.dev/getting-started/intro)
- [10-minute video showing all Nx features](https://nx.dev/getting-started/intro)
- [Interactive Tutorial](https://nx.dev/tutorial/01-create-application)

Nx is a bit difficult to describe concisely. Their home page describes it as a "Smart, Fast and Extensible Build System".
But really, it is many things. I would describe it as a toolkit for managing, organizing, automating, and speeding up all or
most aspects of the development cycle *of a monorepo*. (A monorepo being a single repository containing multiple projects)

The main features are:
- Scaffolding
  - generators for Angular, Nest, etc. which can set up build tools and test infrastructure
    - modules
    - components
    - libraries
    - basically anything you might need
- Build system with smart caching, which can cut compilation times by a lot
- Full-project test integration with smart caching, so you only run tests for code that has changed
- Fully extensible with plugins, custom generators, scripting capabilities, and more


### Front-end
#### [Angular](https://angular.io)
Opinionated, powerful, and flexible framework for building client applications in TypeScript.

#### [NgRx](https://ngrx.io/guide/store)
State-management library for Angular very reminiscent of Redux. Can be a bit confusing at first, but it's not that complicated
once you understand the concepts. Recommended to do some tutorials and play around with it to understand how it works.

### Back-end
#### [MongoDB](https://www.mongodb.com/docs/manual/)
MongoDB is a document-oriented NoSQL database that uses JSON-like documents. This makes it very flexible in terms of schema
design, but can require a bit more attention to get good query performance in some cases, especially for aggregations.

#### [NestJS](https://nestjs.com)
NestJS is a framework for building server-side applications in TypeScript with a very similar module system as Angular.
Comes out-of-the-box with a lot of useful integrations for various technologies, such as Mongoose (see below). 

#### [Mongoose](https://mongoosejs.com/docs/guide.html)
Mongoose is a MongoDB object modeling library for Node.js that allows you to use code to define schemas for your MongoDB collections
and has lots of useful functionality to help simplify interactions with the database.

### Testing
#### [Jest](https://jestjs.io/docs/getting-started)
Jest is a JavaScript testing framework that is essentially the de-facto industry standard for writing unit tests for JavaScript.
Has many utilities that make it powerful and easy to use. 

#### [Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress)
- [Overview video](https://vimeo.com/237527670)

Cypress is a powerful end-to-end testing framework with many features that allow you to simulate real interactions with your application.
Not only that, but it also lets you watch these simulations in real time, and jump to different points in the execution, giving
you "time travel debugging".

### Production environment / Deployment / Continuous Integration
#### [Azure](https://azure.microsoft.com/en-ca/)
Cloud service provider by Microsoft. Has a lot of useful tools and services for building and deploying applications.
We primarily only use a hosted virtual machine running CentOS (Linux).

#### [Docker](https://docs.docker.com/)
Docker is a tool for building and running containerized applications. It's recommended to read up on it, at least to
get an idea of what it is and how it works.

#### [Github Actions](https://docs.github.com/en/actions)
Github Actions is a feature in GitHub used for Continuous Integration allowing you to automate the building, testing, and deployment of your code.

## Additional reading and references
- [Git](https://git-scm.com/)
  - [Github guides](https://docs.github.com/en/get-started/using-git/about-git) 
  - [Atlassian tutorials and references](https://www.atlassian.com/git)
- MDN Web Docs
  - [Web Dev tooling overview](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Overview)
  - [Asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
  - [Web accessibility overview](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)
  - [CSS: The box model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model)
  - [CSS Layout: Flexbox/Grid/Responsive/Etc.](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout)
