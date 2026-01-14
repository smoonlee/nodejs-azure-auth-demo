# Azure Service Principal Auth Probe MVP

This MVP demonstrates how enterprise teams can validate customer-supplied Azure Active Directory service principal credentials in a controlled, browser-based experience. The solution couples a secure Express API with a Vite + React + Tailwind front end that presents credential inputs on the left and a terminal-style activity feed on the right.
<p>

![](/assets/mvp-app.png)

## Architecture

- **Client (`client/`)** – React 19 + Vite + Tailwind with a light/dark theme toggle. Collects tenant/client IDs, secrets, optional scopes, and posts them to the API. Includes optimistic validation, cancellation support, and a live console view of authentication results (now highlighting accessible subscriptions when available).
- **Server (`server/`)** – Node.js/Express with `@azure/identity`. Accepts the credential payload, attempts to acquire an Azure management-plane token with `ClientSecretCredential`, and returns success/failure metadata plus up to five subscriptions tied to the principal. Includes structured logging (Pino), validation (Zod), and security middleware (Helmet, CORS, JSON limits).

Static assets are served by Vite in development. In production, the Express app can serve the `client/dist` bundle (code path already included in `server/src/app.ts`).

## Prerequisites

- Node.js 20 (or newer) and npm 10+
- An Azure AD service principal you can use for validation
- Optional: Azure CLI for provisioning downstream resources

## Configuration

1. Copy `.env.example` to `.env` and review values:
   ```env
   # Copy this file to .env and update values as needed.
   PORT=4000
   DEFAULT_SCOPE=https://management.azure.com/.default

   # Optional: local-only dev credentials to prefill the client form
   # These are only read while running `npm run dev` and should reference
   # disposable service principals. Never commit real secrets.
   VITE_DEV_TENANT_ID=
   VITE_DEV_CLIENT_ID=
   VITE_DEV_CLIENT_SECRET=
   VITE_DEV_SCOPE=https://management.azure.com/.default
   VITE_DEV_AUTHORITY_HOST=https://login.microsoftonline.com
   ```
2. When hosting, allowlist browser origins via `ALLOWED_ORIGINS` and keep actual secrets in a secure store (Key Vault, etc.).
3. (Optional) Override the Vite dev target that Express proxies to during development with `VITE_DEV_SERVER` (defaults to `http://localhost:5173`).
4. (Optional) Prefill the client form during development by adding `VITE_DEV_TENANT_ID`, `VITE_DEV_CLIENT_ID`, `VITE_DEV_CLIENT_SECRET`, `VITE_DEV_SCOPE`, and `VITE_DEV_AUTHORITY_HOST` to `.env`. These values are only read while `npm run dev` is running and should reference disposable test principals.

## Install & Run

### Development workflow

From the repo root you can bootstrap both servers together:

```bash
npm install
npm run dev
```

The root script uses npm workspaces plus `concurrently` to launch the Express API (port 4000) and the Vite client (port 5173) in parallel, with aggregated logs in a single terminal.

Once both are up, browse to `http://localhost:4000`. Express automatically proxies every non-`/api` request to the Vite dev server, so you no longer need to remember the separate port (though `http://localhost:5173` still works if you prefer hitting Vite directly).

> [!WARNING]
> The optional `VITE_DEV_*` variables are injected into the client bundle while the Vite dev server is running. Only point them at throwaway credentials, keep the `.env` file out of source control (already enforced via `.gitignore`), and remove the secrets before sharing screen recordings or logs.

Prefer to keep them in separate panes? Run the API and client individually for granular control:

Separating the server and client keeps the build chains lightweight (Express uses tsx/TS, the client uses Vite/React tooling) and mirrors the production topology where the API may scale independently of the UI bundle. The root scripts simply orchestrate both processes for convenience without coupling their configurations.

**Terminal A – Express API (port 4000)**

```bash
cd server
npm install
npm run dev
```

**Terminal B – Vite client (port 5173)**

```bash
cd client
npm install
npm run dev
```

If the client isn't running yet, the proxy returns a helpful landing page reminding you to start Vite. In production (after `npm run build`) the Express server automatically serves `client/dist` instead.

### Production-style run

1. `cd client && npm run build` – outputs the Vite bundle to `client/dist`.
2. `cd server && npm run build` – transpiles the Express server into `server/dist`.
3. Set `NODE_ENV=production` (required so Express serves the built UI) and run `cd server && npm run start`.
   - PowerShell: `Set-Item Env:NODE_ENV "production"; npm run start`
   - Cmd: `set NODE_ENV=production && npm run start`
   - macOS/Linux/WSL: `NODE_ENV=production npm run start`

Express reads `PORT`, `DEFAULT_SCOPE`, and `ALLOWED_ORIGINS` from the root `.env` file via `dotenv`, so the interface loads on whatever port you configure once the production server is running.

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Starts both the Express API and Vite client concurrently via workspaces. |
| `cd server && npm run dev` | Runs only the Express API in watch mode on port 4000. |
| `cd client && npm run dev` | Runs only the Vite dev server with React fast refresh on port 5173. |
| `npm run build` | Builds the Vite production bundle then transpiles the server (root helper). |
| `cd client && npm run build` | Builds just the Vite production bundle into `client/dist`. |
| `cd server && npm run build` | Transpiles just the Express server into `server/dist`. |
| `npm run start` | Starts the compiled Express API (serves `client/dist` when present). |
| `npm run lint` | Runs both workspaces’ linters/type-checks in sequence. |
| `cd client && npm run lint` | Runs ESLint + TypeScript checks for the React app. |
| `cd server && npm run lint` | Runs `tsc --noEmit` to type-check the API. |
| `npm run test` | Executes the server Vitest suite followed by the client TypeScript check. |
| `cd client && npm run test` | Runs the TypeScript-only check (see note below) for the client. |
| `cd server && npm run test` | Runs the Vitest suite for the API. |

> [!NOTE]
> <br>
>  The hosted Codespaces/VS Code sandbox restricts access to the OneDrive-synchronized realpath that Vite uses internally, so the client workspace test script currently falls back to TypeScript type checking. On a local Windows machine the Vitest suite can be re-enabled by restoring `client/src/App.test.tsx` and pointing the `client` test script back to `vitest run`.

## Security Considerations

- The API never persists credentials. It simply forwards them to Azure AD for token acquisition.
- Use least-privilege principals when validating customer connectivity.
- Enforce HTTPS, secret rotation, and consider a customer-owned Key Vault with RBAC for production scenarios.
- Diagnostics from Pino intentionally redact known secret fields.

## Future Enhancements

- Replace the temporary type-check “test” script once the build environment can access the true filesystem path of the repository.
- Add telemetry (App Insights) and audit trails for credential validation attempts.
- Support additional Azure clouds (US Gov, China) via selectable authority hosts.
- Hook into Azure Cosmos DB or Storage for storing anonymized validation outcomes if persistence becomes required.
