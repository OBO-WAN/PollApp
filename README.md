# PollApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

The initial database contract lives in [`supabase/`](supabase/README.md). It includes:

- relational survey, question, answer, vote, and result tables;
- transactional functions for creating surveys and submitting votes;
- anonymous read policies with writes restricted to those functions;
- seed data matching the current Angular survey fixtures.

Authentication and the Angular Supabase adapter are intentionally outside this schema-only change.

To start a clean local database, apply the migrations and seed, and run the database tests:

```bash
npm run supabase:verify
```

Docker must be installed and running. See [`supabase/README.md`](supabase/README.md) for local and hosted-project setup.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
