# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

**Customers** order bottled water for home or workplace delivery on the AquaBest customer app. They create their own account with name, email, and password, then confirm the email with a one-time code.

**Drivers** fulfill those deliveries on a separate AquaBest Driver app. They do not self-register. An administrator (or a local seed) creates a verified driver account; the driver only signs in and can reset a forgotten password.

**Administrators** assign the `driver` role. No admin UI ships in this phase.

## Product Purpose

AquaBest is a water-delivery service. Phase 1 exists so customers and drivers can sign in, stay signed in on a device, and sign out — the foundation every later ordering and delivery screen depends on.

Success: a new customer can register, verify email, and enter the app; a returning customer or seeded driver can log in after a restart; logout clears the session; the wrong role cannot use the other app.

## Positioning

Two role-gated Expo apps share one better-auth backend. Customers self-serve; drivers are provisioned. Email OTP via Resend is the verification and password-reset factor; passwords remain the login factor.

## Operating Context

- Customer app: `acqua-user` (Expo Router, iOS / Android / web)
- Driver app: `acqua-driver` (same stack, `EXPO_PUBLIC_APP_ROLE=driver`)
- API: `acqua-backend` (Hono, Prisma, PostgreSQL, better-auth, Resend)
- Local email delivery requires a valid Resend key
- Portal (`acqua-portal`) is out of scope for Phase 1

## Capabilities and Constraints

**In Phase 1**

- Customer email/password registration (`name`, `email`, `password`)
- Email OTP verification after signup (Resend)
- Email/password login with optional Remember me
- Forgot password and reset via OTP (not a magic link)
- Logout and SecureStore session persistence
- Role gate: customer app requires `customer`; driver app requires `driver`
- Seeded verified driver for local development

**Out of scope**

- Google / Apple / any social login
- Passwordless OTP sign-in
- Public driver signup
- Home, ordering, dispatch, or portal UI beyond leftover sign-out

**Roles (backend):** `admin` | `customer` | `driver`. Signup default is `customer`.

**Assumption (from the approved Phase 1 plan):** OTP length is 6, expiry 5 minutes, 3 attempts; unverified customers cannot use the app.

## Brand Commitments

- Name: **AquaBest**
- Official wordmark: `acqua-user/assets/logo.png` and `acqua-driver/assets/logo.png` (same asset). Never regenerate or replace the logo. Preserve proportions.
- Palette bound by the Phase 1 brief: Primary `#222222`, Secondary `#FFFFFF`, Accent `#7EF0FF`
- Auth composition bound by the approved mock: illustration hero, overlapping white card, filled primary CTA, OTP cells, resend timer — remapped into the AquaBest palette with water illustrations, not the mock’s purple city

## Evidence on Hand

- Official logo PNG in both Expo `assets/` directories
- Auth mock (login, check-email OTP, password updated) supplied with Phase 1
- Working template auth (email/password, SecureStore, AuthGuard) already in both Expo apps
- No photography, testimonials, or customer quotes. Do not invent them.

## Product Principles

1. Role is an account property, not a self-serve toggle on the driver app.
2. Email ownership is proven with a code; passwords stay the login factor.
3. Brand on auth is the logo, charcoal, ice-cyan, and water — not a generic gray template and not the purple reference as-is.
4. Sessions live in Expo SecureStore on device; logout must actually clear them.
5. Do not invent API fields, social providers, or product claims.

## Accessibility & Inclusion

No product-specific standard was set beyond ordinary mobile a11y: 44pt (iOS) / 48dp (Android) targets, body contrast ≥ 4.5:1, ice-cyan is not body text on white.
