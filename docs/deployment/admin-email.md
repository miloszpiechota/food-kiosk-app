# Admin Email Delivery

Admin invite and password-reset emails use `AdminEmailService`.

## Local Development

Use console delivery:

```env
ADMIN_EMAIL_PROVIDER=console
ADMIN_PUBLIC_URL=http://localhost:5173/admin-panel
```

The API logs the email payload. In non-production, responses may include preview tokens to make local testing faster.

## Production

Use Resend:

```env
ADMIN_EMAIL_PROVIDER=resend
ADMIN_EMAIL_FROM=Food Kiosk <admin@example.com>
RESEND_API_KEY=re_your_key_here
ADMIN_PUBLIC_URL=https://your-admin-domain.example/admin-panel
```

Production behavior:

- invite emails contain only the setup link
- password reset emails contain only the reset link
- preview tokens are not returned
- console delivery is rejected in production
- missing or placeholder provider values return `503`

`ADMIN_EMAIL_FROM` must be a sender/domain verified in Resend.
