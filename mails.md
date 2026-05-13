# Mailing System Architecture

This document describes the mailing system architecture used in the OCPP-CPMS stack. It covers the overall workflow, template management, and examples of triggering emails for specific features.

## Overview

The backend uses a central utility, `Backend/src/utils/mailer.ts`, to handle sending emails. This module is responsible for:
1. Fetching the active mail configuration from the database (`MailConfig` model).
2. Fetching optional, dynamic email templates (`MailTemplate` model).
3. Using `nodemailer` to dispatch the actual email.
4. Parsing string templates to replace runtime placeholders (e.g., `{{var}}`) with actual data.
5. Providing a fallback mechanism: if a database template is not found for a given event, the hardcoded fallback strings provided in the code are used. If no active mail configuration is found, emails are gracefully logged to the console instead of throwing errors.

## Template Management

Templates are stored in the PostgreSQL database using the Prisma model `MailTemplate`. Each template contains:
- `name`: A descriptive name for the template.
- `type`: A unique string identifier used by the backend to fetch the correct template (e.g., `registration`, `2fa_login`, `password_reset`).
- `subject`: The subject line, which supports variables (e.g., `Welcome to OCPP CMS, {{userName}}`).
- `bodyHtml`: The HTML structure of the email. Supports variables.
- `bodyText`: A plaintext version of the email. Supports variables.

Admins can manage these templates via the Frontend at **Settings -> Mail Templates** (`/settings/templates`). When creating a template via the UI, the specified `Type (Unique ID)` MUST match the exact string passed in the backend calls.

## Triggering Emails

The primary method for triggering emails is the `sendEmail` function exported from `mailer.ts`. Its signature looks like this:

```typescript
export const sendEmail = async (
  to: string,
  subjectFallback: string,
  textFallback: string,
  htmlFallback?: string,
  templateType?: string,
  variables?: Record<string, string>
) => { ... }
```

When triggering an email, pass the recipient, fallback strings, the template identifier (`templateType`), and the variables object to populate the placeholders.

### Examples

#### 1. Welcome Mail (User Registration)
When a new user successfully registers, a welcome email is dispatched. This occurs in `Backend/src/api/auth/auth.controller.ts`:

```typescript
await sendEmail(
  user.email,
  "Welcome to OCPP CMS",
  "Your account has been successfully registered.",
  "<p>Your account has been successfully registered.</p>",
  "registration",
  { userEmail: user.email, loginUrl }
);
```
- **Template Type:** `registration`
- **Variables Available:** `{{userEmail}}`, `{{loginUrl}}`

#### 2. Two-Factor Authentication (2FA) Setup Mail
During 2FA setup via email codes, a setup code is sent. This also occurs in `auth.controller.ts`:

```typescript
await sendEmail(
  user.email,
  "Your 2FA Setup Code",
  `Your two-factor authentication setup code is: ${twoFactorCode}`,
  `<p>Your two-factor authentication setup code is: <strong>${twoFactorCode}</strong></p><p>This code will expire in 10 minutes.</p>`,
  "2fa_setup",
  { twoFactorCode }
);
```
- **Template Type:** `2fa_setup`
- **Variables Available:** `{{twoFactorCode}}`

#### 3. Forgot Password Mail
When a user initiates the password reset flow, a link containing a secure token is emailed to them (`auth.controller.ts`):

```typescript
await sendEmail(
  user.email,
  "Password Reset Request",
  `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
  `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>If you did not request this, please ignore this email.</p>`,
  "password_reset",
  { resetUrl }
);
```
- **Template Type:** `password_reset`
- **Variables Available:** `{{resetUrl}}`
