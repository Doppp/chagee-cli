# Contributing to chagee-cli

Thanks for contributing.

## Project goals

- Keep the CLI simple and reliable for SG pickup flow.
- Keep default behavior safe (`dry-run` first).
- Keep command UX clear and scriptable.

## Development setup

1. Install dependencies:

```bash
npm install
```

2. Run the CLI in development:

```bash
npm run dev
```

3. Run checks before opening a PR:

```bash
npm run check
npm run build
```

## Code guidelines

- Use TypeScript strict mode compatible code.
- Keep command handlers explicit and predictable.
- Prefer small focused functions over large mixed logic blocks.
- Preserve backward compatibility for command names when possible.
- Avoid adding dependencies unless there is clear value.

## API and security guidelines

- Do not commit real phone numbers, OTPs, auth tokens, or payment links.
- Do not log sensitive data in new debug output.
- Treat upstream API behavior as unstable and handle failures gracefully.
- Keep automation respectful; avoid abusive polling or traffic patterns.

## Pull request checklist

1. Explain what changed and why.
2. Include user-facing command examples for behavior changes.
3. Confirm `npm run check` and `npm run build` pass.
4. Update `README.md` if usage or commands changed.
5. Keep changes focused; avoid unrelated refactors in the same PR.

## Reporting issues

When opening an issue, include:

- Expected behavior
- Actual behavior
- Exact command(s) run
- Relevant output (redacted)
- Node/npm versions
- OS version
