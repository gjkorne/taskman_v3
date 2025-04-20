# TaskMan v3

[![CI](https://github.com/gjkorne/taskman_v3/actions/workflows/ci.yml/badge.svg)](https://github.com/gjkorne/taskman_v3/actions/workflows/ci.yml)
[![Storybook](https://github.com/gjkorne/taskman_v3/actions/workflows/storybook.yml/badge.svg)](https://github.com/gjkorne/taskman_v3/actions/workflows/storybook.yml)
[![Codecov](https://codecov.io/gh/gjkorne/taskman_v3/branch/main/graph/badge.svg)](https://codecov.io/gh/gjkorne/taskman_v3)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-badge-id/deploy-status)](https://app.netlify.com/sites/your-site-name)

> TaskMan v3 — modern task & time management app built with React, TypeScript, and Supabase.

## Badges

- CI: GitHub Actions (build, lint, tests)
- Storybook: component library preview
- Code coverage: Codecov
- Deploy preview: Netlify

## Environment & Setup

Copy and rename the example env file:

```bash
cp .env.example .env
```

### Prerequisites

- Node.js >=18
- npm >=8

### Available Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start development server (Vite)      |
| `npm run build`      | Create production build              |
| `npm run lint`       | Run ESLint checks                    |
| `npm run type-check` | Run TypeScript compiler without emit |
| `npm run test`       | Run unit tests (Vitest)              |
| `npm run storybook`  | Launch Storybook for UI components   |

## Features

- Offline support with persistent cache via React Query and IndexedDB
- URL-based routing with React Router
- Pomodoro timer and session management
- Category synchronization with Supabase
- Density-aware UI components
- Role-based access control for admins
- Reporting dashboard and calendar view

## Architecture & Documentation

See the documentation in the `docs/` folder:

- [Technical debt](docs/technical-debt.md)
- [Architecture overview](docs/architecture.md)
- [Component library (Storybook)](docs/storybook.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, branch naming, and commit messages.

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). Please adhere to it in all interactions.

## License

This project is licensed under the [MIT License](LICENSE).

## Screenshots

![App Screenshot](docs/assets/screenshot.png)
