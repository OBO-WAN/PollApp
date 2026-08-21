# PollApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.2.

## Development server

Start the local Supabase stack and apply its seed data:

```bash
npm run supabase:start
npm run supabase:reset
npm start
```

`npm start` writes a browser-safe runtime configuration from `supabase status -o env`, then
starts Angular. Open `http://localhost:4200/`. If Supabase becomes unavailable, the application
keeps working with fixture surveys and displays a fallback notice.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
npm run test:e2e
```

The Playwright suite covers the main survey workflows and responsive viewports.

## Supabase database

The database contract lives in [`supabase/`](supabase/README.md). It includes:

- relational survey, question, answer, vote, and result tables;
- transactional functions for creating surveys and submitting votes;
- anonymous read policies with writes restricted to those functions;
- seed data matching the current Angular survey fixtures.

Angular reads surveys from the configured Data API through `@supabase/supabase-js`, with fixture
fallback when reads are unavailable. When Supabase is configured, survey creation and vote
submission use the transactional database functions and never fall back to fixture writes. Vote
submission uses a stable UUID stored only in the browser for best-effort duplicate prevention; it
does not enable Angular authentication or session persistence.

To start a clean local database, apply the migrations and seed, and run the database tests:

```bash
npm run supabase:verify
```

Docker must be installed and running. See [`supabase/README.md`](supabase/README.md) for local and hosted-project setup.

Run the focused browser integration after the local stack has started:

```bash
npm run test:e2e:supabase
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
