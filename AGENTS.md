# Codex Repository Instructions

## Publishing to GitHub

Do not run `git push` directly for source changes. Every Codex-to-GitHub synchronization must use the versioned release command:

```bash
pnpm release:sync -- --type <type> --message "<description>" [release options]
```

Choose a Conventional Commit type: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, or `chore`.

- Use `--breaking`, `--database-change`, `--architecture-change`, `--framework-change`, or `--api-breaking` for a Major release.
- A `feat` produces a Minor release unless a Major flag is present.
- All other supported types produce a Patch release unless `--bump` explicitly overrides it.
- Add `--known-issue`, `--feature`, `--fixed`, `--optimization`, `--improvement`, and `--documentation` entries as needed.
- Database changes require `--database-change`; the release command must create a Migration Guide.
- Never bypass a failed validation or include secrets in a commit.

For the first commit of an empty repository, use `--bootstrap`. For local preparation without GitHub push, use `--no-push`. Use `--dry-run` to inspect the planned version safely.
