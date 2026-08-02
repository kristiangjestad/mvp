# Club Downtown VIP

Frontend-only Next.js prototype for an installable Club Downtown VIP pass.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The default prototype password is `vip2026`. It can be changed with `NEXT_PUBLIC_VIP_PASSWORD`; because this is a client-side prototype, the value is visible in the browser bundle.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the visual and technical build plan.
