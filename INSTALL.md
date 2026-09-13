# AquaDesk V13 — Clean Install

This release is flattened so `package.json` is at the project root.

## Windows PowerShell

```powershell
npm cache verify
npm install
npm run build
npm run dev
```

If you have an old `node_modules` or lockfile from a previous AquaDesk copy,
remove them before installing:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

Configure Supabase using `.env.example` and your local `.env`.

The real `.env` is intentionally not included in this release.
