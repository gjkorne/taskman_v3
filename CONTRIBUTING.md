# Contributing to TaskMan v3

Thank you for considering contributing to TaskMan v3! We welcome all kinds of contributions, including bug reports, feature requests, documentation improvements, and code contributions.

## Reporting Issues

• Before opening an issue, please search existing issues to avoid duplicates.
• Use clear and descriptive titles.
• Provide steps to reproduce, expected behavior, and any relevant screenshots or logs.

## Branch Naming

• Prefix your branch with a category: `feature/`, `bugfix/`, `docs/`, or `refactor/`.

- Example: `feature/add-offline-support`

## Commit Messages

We follow the Conventional Commits specification:

```text
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Common types

• **feat**: A new feature
• **fix**: A bug fix
• **docs**: Documentation only changes
• **style**: Formatting, missing semicolons, etc
• **refactor**: Code change that neither fixes a bug nor adds a feature
• **test**: Adding missing tests or correcting existing ones
• **chore**: Changes to the build process or auxiliary tools

## Pull Requests

1. Fork the repository and create your branch from `main`.
2. Ensure all tests pass and linting is clean (`npm run test`, `npm run lint`).
3. Run `npm run format` to format your changes.
4. Push your branch and open a pull request against `main`.
5. Fill out the PR template and link to any related issues.

Thank you for helping make TaskMan better!
