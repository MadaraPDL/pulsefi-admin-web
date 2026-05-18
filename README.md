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

## Step 27D Status

Completed locally:

- ISP Admin Intelligence Center loads analytics summary, recommendations, reports, and active subscriptions from real backend endpoints.
- ISP Admin can generate a prediction from an active subscription.
- ISP Admin can generate a recommendation from a prediction.
- Recommendation history uses `GET /api/v1/isp-admin/recommendations`.
- Recent reports use `GET /api/v1/isp-admin/reports`.
- Normal `npm run dev` still loads the real admin app.
- `npm run dev:design` still loads the design preview only.

## Step 27E Status

Completed locally:

- ISP Admin dashboard now opens with a short Overview and keeps Users, Plans, Subscriptions, Routers, Intelligence, Invitations, Monitoring, Operations, and Network Activity as selected sections.
- Platform Admin dashboard now separates Overview, ISPs, ISP Admin Invitations, and ISP Admin Accounts without adding new backend routes.
- Long dashboard tables, recommendation history, and report lists use contained scroll areas so panel controls stay reachable.
- Real admin mode still relies on backend admin roles only; design preview remains `dev:design` only.

## API Configuration

The API base URL must come from `VITE_API_BASE_URL` when set.

Local fallback:

```text
http://127.0.0.1:8000/api/v1
```

Use `.env.development.local` for local overrides and keep `.env*` files with secrets uncommitted.

## Admin Demo Flow

1. Start the backend from `C:\PulseFi\backend`:

   ```powershell
   .\venv\Scripts\python.exe -m uvicorn app.main:app --reload
   ```

2. Start the real admin app from `C:\PulseFi\pulsefi-admin-web`:

   ```powershell
   npm run dev
   ```

3. For local development, set the API base URL in `.env.development.local`:

   ```text
   VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

   Keep `.env*` files uncommitted.

4. If DEBUG local auth rate limits block repeated demo logins, reset them:

   ```powershell
   curl.exe -X POST http://127.0.0.1:8000/api/v1/auth/rate-limit/reset
   ```

5. Login as Platform Admin, open Overview, create or update an ISP in ISPs, then create an ISP Admin invitation. The local DEBUG invitation token appears only when the backend returns it.

6. Login as ISP Admin, then review Overview, Users, Invitations, Plans, Subscriptions, Routers, Intelligence, Monitoring, Operations, and Network Activity.

7. Test MFA verification and MFA setup with accounts that require those flows, then refresh the page to confirm session restore through `GET /api/v1/auth/me`.

8. Run the design preview only when needed:

   ```powershell
   npm run dev:design
   ```

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
