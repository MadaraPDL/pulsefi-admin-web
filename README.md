# PulseFi Admin Web

React + TypeScript + Vite admin dashboard for PulseFi.

## Modes

- `npm run dev` starts the real admin web app.
- `npm run dev:design` starts the temporary design preview hub.
- `src/App.tsx` selects the design preview only when `import.meta.env.MODE === "design"`.

The production admin web app accepts only backend admin roles:

- `platform_admin`
- `isp_admin`

App User screens in the design hub are reference-only for the future React Native mobile app.

## Step 27C Status

Completed locally:

- Shared admin login sends `account_type: "admin"`.
- Existing tokens are restored by calling `GET /api/v1/auth/me` on page load.
- Invalid/expired tokens and App User tokens clear the admin session.
- Platform Admin routes to the Platform Admin dashboard.
- ISP Admin routes to the ISP Admin dashboard.
- MFA verification uses `POST /api/v1/auth/mfa/verify`.
- MFA setup confirmation uses `POST /api/v1/auth/mfa/setup/confirm`.
- Session is saved only after the backend returns a valid admin token.

## Checks

```powershell
npm run lint
npm run build
npm run build -- --mode design
```

Backend local rate-limit reset while `DEBUG=True`:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/auth/rate-limit/reset
```
