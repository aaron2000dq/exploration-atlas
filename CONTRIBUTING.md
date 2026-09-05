# Contributing

Thank you for improving Exploration Atlas.

## Local setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run setup:e2e # first time only
npm run verify
```

## Privacy rules

- Do not include names, private accounts, contact details, home-area rehearsal
  coordinates, chat logs, faces, license plates, or photo metadata.
- Use the public Hangzhou route or clearly synthetic data in tests and docs.
- Use `public/references/*.svg` for public photo-matching examples.
- Do not attach private project briefs to issues. Replace all personal values
  with placeholders before sharing logs or screenshots.
- If a change originates in a private repository, verify both the current tree
  and the Git history before publishing.

## Scope

Good contributions include map/coordinate correctness, device compatibility,
offline reliability, accessibility, test coverage, documentation, and generic
visual components. Personal route customizations are best kept in forks or
private branches.

## Assets

Only contribute media you created or have the right to redistribute. Include
its source and license in the pull request. Avoid identifiable products,
brands, people, or protected fictional properties in newly generated art.
