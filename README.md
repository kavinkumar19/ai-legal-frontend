# legal-frontend — Run locally

Quick steps to run the frontend locally:

1. Open a terminal and change to the frontend folder:

```bash
cd "legal-frontend"
```

2. Install dependencies (only once):

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

Dev server URL (Vite default):

- http://localhost:5173/

What this URL serves

- Root HTML: `index.html` (served from the project root)
- React entry: `src/main.jsx` which mounts `App.jsx` from `src`
- Built production files (after `npm run build`): `dist/`

If you need the dev server to listen on all interfaces (for testing from other devices), start with:

```bash
npm run dev -- --host
```

Or add `"dev": "vite --host --port 5173"` to the `scripts` in `package.json` to always enable it.
