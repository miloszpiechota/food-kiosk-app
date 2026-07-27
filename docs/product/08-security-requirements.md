# Security Requirements

## Purpose
Define the baseline security expectations for the Food Ordering Kiosk App MVP, with emphasis on admin access, payment integrity, validation, and safe handling of sensitive data.

## Authentication
- `NFR-SEC-001`: Only administrators shall be able to access the admin panel.
- `NFR-SEC-002`: Administrator authentication shall use email and password followed by mandatory two-factor authentication.
- `NFR-SEC-003`: Administrator credentials shall be protected using secure password hashing and safe storage practices.
- `NFR-SEC-004`: Administrator sessions shall expire and shall not remain active indefinitely.
- `NFR-SEC-005`: The system should provide visible logout behavior or timeout handling to reduce the risk of customer access to an admin session on shared kiosk-adjacent devices.
- `NFR-SEC-005A`: Two-factor authentication should use a TOTP-compatible authenticator app such as Google Authenticator.
- `NFR-SEC-005B`: QR codes may be used to enroll TOTP secrets during setup.
- `NFR-SEC-005C`: QR-assisted login shall require a trusted-device or challenge-approval design and shall not grant access from scanning a public QR code alone.

## Admin Registration And Access Control
- `NFR-SEC-006`: Administrator onboarding shall use super-admin-created invite links rather than public self-registration.
- `NFR-SEC-007`: The admin area shall require authentication on every protected route.
- `NFR-SEC-008`: The MVP shall support `SUPER_ADMIN` and `ADMIN` roles.
- `NFR-SEC-009`: Customers shall have no access to admin routes or admin data.
- `NFR-SEC-009A`: `ADMIN` users shall only access restaurants assigned to them.
- `NFR-SEC-009B`: `SUPER_ADMIN` users may invite admins and manage restaurant access.

## Payments And Order Integrity
- `NFR-SEC-010`: Payment status shall be trusted only after verified backend confirmation, including webhook-based validation where applicable.
- `NFR-SEC-011`: Frontend payment redirect results shall be treated as informational only and not as final proof of successful payment.
- `NFR-SEC-012`: Unpaid, failed, or unverified payment attempts shall not be stored as confirmed orders.
- `NFR-SEC-013`: After payment processing, the system should show safe customer-facing status information such as payment state and order number, then allow return to the kiosk start flow.

## Secrets And Sensitive Data
- `NFR-SEC-014`: Secrets shall be stored in environment variables or similarly secure configuration mechanisms, not hardcoded in source code.
- `NFR-SEC-015`: Real environment files containing secrets shall not be committed to source control.
- `NFR-SEC-016`: Example environment files shall use placeholders only for sensitive values such as JWT secrets and Stripe keys.

## Abuse Prevention And Monitoring
- `NFR-SEC-017`: The system should support protection against repeated or abusive admin login attempts.
- `NFR-SEC-018`: Suspicious authentication failures and important security-relevant events should be traceable in logs.
- `NFR-SEC-019`: The system should reduce common and basic attack scenarios, including unauthorized admin access, insecure input handling, and unsafe payment state changes.
- `NFR-SEC-019A`: Invite acceptance, login challenges, TOTP verification, and QR login challenges should expire quickly and be rate-limited.

## Validation
- `NFR-SEC-020`: All backend input shall be validated before processing.
- `NFR-SEC-021`: Order and payment-related data shall be validated on the backend and shall not be trusted from frontend input alone.
- `NFR-SEC-022`: Administrator-facing form input shall also be validated strictly.

## Error Handling
- `NFR-SEC-023`: Customer-facing and admin-facing error messages shall avoid exposing internal technical details.
- `NFR-SEC-024`: Authentication and payment failures should return safe user-facing messages while remaining traceable through internal logging.

## MVP Security Scope
- `NFR-SEC-025`: The MVP must include secure authentication and authorization for administrators.
- `NFR-SEC-026`: The MVP must include secure handling of administrator data and credentials.
- `NFR-SEC-027`: The MVP must include frontend and backend validation for security-relevant flows.
- `NFR-SEC-028`: The MVP must include session management that reduces the risk of unauthorized admin reuse.
- `NFR-SEC-028A`: The MVP must include mandatory two-factor authentication for admin users before issuing a full admin session.

## Later
- `NFR-SEC-029`: Broader hardening against more advanced attack scenarios may be expanded after the MVP.

## Notes
- This document defines baseline product security expectations and does not claim that any of them are already implemented.
- Admin invite and login screens must remain clearly separated from the customer ordering journey.
- Detailed admin auth flow is documented in [Admin Auth And Order Management](../architecture/12-admin-auth-and-order-management.md).
