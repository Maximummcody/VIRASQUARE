# ViraSquare Customer Authentication Direction

## Current state

The current ViraSquare sign-in button deliberately starts the managed Manus OAuth process. It is secure for the present build and sends a visitor back to ViraSquare after successful authentication, but the visible Manus login page is not suitable as the long-term customer-facing ViraSquare sign-in experience.

The current `users` table identifies people using the managed provider’s stable `openId`. It does not include a ViraSquare password system. We should **not** try to add password storage ourselves as a quick design change.

## Options considered

| Option | Customer experience | What ViraSquare needs | Recommendation |
| --- | --- | --- | --- |
| Keep the current managed sign-in | Visitors see Manus during entry. | No extra setup. | Suitable only while building and testing. |
| Email verification code | A visitor enters an email, receives a short code, and returns to a ViraSquare-branded screen. New customers can create their account during this same simple flow. | An authentication provider, verified sending domain, safe rate limits, and an account migration from the current managed identity. | **Best first launch option.** Familiar on phones, does not need passwords, and avoids the same-device limitation of email links. |
| Email magic link | A visitor enters an email and taps a one-time link. | Same provider/domain work as email codes. | Good later alternative, but less ideal as the only first option because a user may start on one device and open email on another. |
| Google sign-in | A visitor uses a familiar Google account flow. | Google Cloud OAuth configuration, a verified ViraSquare brand, privacy/terms links, and secure backend token verification. | Add after email code, or alongside it only if setup time allows. |
| Traditional password | A visitor creates and remembers a password. | Password hashing, reset, breach protection, anti-abuse, email delivery, and account recovery. | Do not make this the first version. It adds more failure and support paths without a clear early benefit. |

## Recommended ViraSquare experience

> **Continue with email** → **Enter the six-digit code** → **Welcome to ViraSquare**.

The ViraSquare sign-in page should use the approved logo, Navy-and-Electric-Blue design, and the simple line: **Know what to post. Create. Grow.** It should plainly say that a code will be sent to the visitor’s email. The same flow should create a new account for a first-time customer and return an existing customer to their saved workspace.

After the email-code flow is stable, add **Continue with Google** as an optional second choice. Do not add social sign-in, phone OTP, passwords, or other options at first; too many entry choices make a small-business product feel less clear.

## Important preparation before implementation

The owner should first select an authentication provider and establish a ViraSquare domain plus a branded email address. The final login should use a ViraSquare address such as `app.virasquare.com`, with mail sent from an address such as `hello@virasquare.com` or `access@virasquare.com`. The existing user identity mapping, sessions, protected procedures, and testing flows will need a careful migration, so this is a distinct approved group of work—not a small landing-page adjustment.

## Research notes

Auth0 documents email one-time-password authentication, including short expirations, a limit on failed attempts, and custom sending-domain requirements for customised templates.[1] Auth0 also documents that a branded custom domain can keep people inside the product’s visual context rather than showing a third-party hostname.[2]

Supabase documents both email OTP and magic-link paths. Its documentation notes that OTPs are entered by the user while magic links are clicked from email, and that its default handling can create a first-time user during the sign-in flow.[3] Clerk documents email verification codes, with a resend cooldown and code validity window, alongside optional social sign-in methods.[4]

Google’s current guidance says the app’s branding, verification, allowed origins, and authorized redirect URLs must be configured for a web sign-in integration, and that backend systems should validate ID tokens rather than trust profile data from the browser.[5]

## Sources

[1]: https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-otp "Auth0 — Passwordless Authentication with Email"
[2]: https://auth0.com/docs/customize/custom-domains "Auth0 — Custom Domains"
[3]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase — Passwordless Email Logins"
[4]: https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options "Clerk — Sign-up and Sign-in Options"
[5]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase — Login with Google"
