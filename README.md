# countdown-modulo

A [Lumen](https://github.com/Lumen-media/lumen) module.

## Develop

```bash
pnpm install
pnpm build        # bundles into dist/
pnpm pack         # creates {id}-{version}.lumenpack in dist/
pnpm validate     # schema-checks manifest.json
```

## Publish

1. Create a GitHub release on this repo with tag `vX.Y.Z` and attach the `.lumenpack` as a release asset.
2. Open a PR against [Lumen-media/community-modules](https://github.com/Lumen-media/community-modules) adding an entry to `modules.json` that points at this repo.

## License

MIT
