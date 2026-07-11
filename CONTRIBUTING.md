# Contributing to PrimeBible Pro for OBS

Thanks for wanting to help! Contributions of all kinds are welcome — bug reports, new overlay themes, docs improvements, and translations.

## Getting Started

```bash
git clone https://github.com/primebible/primebible-obs.git
cd primebible-obs
npm install
npm start
```

The server runs on **http://localhost:4456** (set in `config.json`). Open `/control` for the control panel and `/overlay` for the OBS overlay.

## Before You Submit

1. Run the smoke test: `npm test` (boots the server and checks every page, the core API endpoints, and the WebSocket contract — no OBS or internet required).
2. If your change touches display or OBS behavior, walk through the relevant sections of [SMOKE_TEST.md](SMOKE_TEST.md) manually with OBS running.
3. Keep the docs honest: if you change a port, config option, endpoint, or shortcut, update README.md to match.

## Pull Request Flow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request describing what changed and why

## Code Style

- **JavaScript**: ES6+ syntax, async/await preferred (the project uses ES modules — `"type": "module"`)
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Dependencies**: keep them minimal — the project intentionally has only 5 runtime dependencies

## Adding an Overlay Theme

1. Add the theme to `overlayThemes` in `config.json` (id, name, description)
2. Add a `build<YourTheme>()` renderer and a `case` for its id in `public/overlay.js`
3. Add matching styles in `public/overlay.html`
4. Test it with a short verse, a long multi-slide passage, and `?highContrast=true`

## Reporting Bugs

Open an issue with your OS, Node.js version, OBS version, and the server console output. Screenshots or clips of the overlay misbehaving help a lot.
