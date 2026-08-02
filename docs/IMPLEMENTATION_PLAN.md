# Club Downtown VIP — implementation plan

## Product goal

Build an installable, portrait-first mobile web app that reproduces the supplied iPhone references as closely as possible. The guest enters a name and shared access code once, remains authorized on that device for 14 days, and sees a personalized VIP pass. Tapping **Sjekk inn** replaces the button with a timestamp exactly eight hours in the future.

This is intentionally a frontend-only prototype. The access code and local session are a convenience barrier, not real security.

## Visual contract

### Palette

- Stage black: `#000000`
- Primary white: `#FFFFFF`
- Soft copy: `#F2F2F2`
- Silhouette burgundy: `#2A1418`
- Check-in pink: `#EF9FA8`
- Gold dark: `#9D6500`
- Gold: `#F3C22C`
- Gold highlight: `#FFE57A`

### Typography

- Dynamic UI and body: Arial / Helvetica stack
- Button: Segoe Print / Bradley Hand fallback stack
- Logo typography remains part of the supplied logo asset

### Layout thesis

The VIP badge is the single visual signature. It floats over the dancers, while every other element stays centered, quiet, and vertically disciplined.

```text
┌──────────────────────────────┐
│         CLUB LOGO            │
│                              │
│    dancers + VIP medallion   │
│                              │
│       [gold nameplate]       │
│     Pluss 1 stk og gratis    │
│                              │
│       [Sjekk inn]            │
│          or pink time        │
│                              │
│     italic instructions      │
└──────────────────────────────┘
```

## Implementation phases

### 1. Foundation

- Next.js App Router with TypeScript and CSS Modules/global tokens
- PWA manifest, install icons and iOS standalone metadata
- Semantic production assets copied into `public/assets`
- No component library, Tailwind, database or authentication package

### 2. Local access gate

- Name and shared password form
- Store versioned authorization object in `localStorage`
- Authorization expires 14 days after successful entry
- Name is persisted with the authorization and drives the nameplate
- Invalid or expired stored values are removed automatically

### 3. VIP pass states

- Default state matches the reference with the **Sjekk inn** button
- Checked-in state replaces the button with `Kan sjekke inn: DD.MM.YYYY kl: HH:MM`
- Timestamp is `click time + 8 hours` and is persisted with the local session

### 4. Picture-perfect calibration

- Use the supplied iPhone screenshots as fixed visual baselines
- Capture the implementation at representative viewport widths
- Compare logo width, artwork overlap, nameplate dimensions and vertical gaps
- Tune CSS tokens rather than adding one-off per-device values
- Verify at narrow, standard and Pro Max portrait widths

### 5. Final PWA verification

- Install from Safari using Add to Home Screen
- Confirm standalone opening, icon, safe areas and black launch surface
- Confirm persistence after closing and reopening the Home Screen app
- Confirm 14-day expiry and eight-hour time calculation

## Acceptance criteria

- Main screen is visually aligned with both supplied reference states
- Name is dynamic and never baked into an image
- Button and timestamp occupy the same stable layout slot
- Check-in timestamp is exactly eight hours after the tap
- Authorization survives normal reloads and app restarts for 14 days
- App remains usable from approximately 360–440 CSS pixels wide
- No backend, database or network call is required after static assets load

## Known prototype limitation

Because all logic runs in the browser, a technical user can inspect or bypass the access gate. This is accepted for this prototype and must be revisited before the pass is used as a real admission credential.
