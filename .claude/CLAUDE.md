# paramify-fde-platform

npm-workspaces monorepo (use npm, not pnpm/yarn). See README.md for layout and setup.

## Formatting

Always run the formatter before committing anything:

```sh
npm run format        # prettier --write
npm run format:check  # verify without writing (CI-style check)
```

Config is in `.prettierrc` (100 cols, spaces, no semicolons). `.prettierignore`
excludes generated and build output.
