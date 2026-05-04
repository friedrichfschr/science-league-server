# foodconnect-newsletter-server

Express + Nodemailer + MySQL newsletter signup server for the FoodConnectMarkt project.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/newsletter/subscribe` | Submit email → sends confirmation email |
| `GET` | `/api/newsletter/confirm?token=…` | Confirm subscription → redirects to frontend |
| `GET` | `/api/newsletter/unsubscribe?token=…` | Unsubscribe → redirects to frontend |

## Flow

1. User submits their email on the frontend.
2. Server saves the subscriber with status `pending` and sends a confirmation email with a unique token.
3. User clicks the link in the email → server sets status to `confirmed`, sends a welcome email, redirects to `FRONTEND_URL/index.html?newsletter=confirmed`.
4. Every confirmation email includes an unsubscribe link → `FRONTEND_URL/index.html?newsletter=unsubscribed` after clicking.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MySQL credentials and SMTP settings
```

### 3. Create the database

Create the MySQL database manually (the server will NOT create it):

```sql
CREATE DATABASE foodconnect_newsletter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Start the server

```bash
# Development (auto-restarts on file changes — requires Node 18+)
npm run dev

# Production
npm start
```

The server listens on `PORT` (default `3100`).

## Environment variables

See `.env.example` for all options.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `3100`) |
| `APP_ORIGIN` | Yes | Comma-separated allowed CORS origins |
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | No | MySQL port (default `3306`) |
| `DB_NAME` | Yes | MySQL database name |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | No | MySQL password |
| `EMAIL_HOST` | Yes | SMTP host |
| `EMAIL_PORT` | No | SMTP port (default `587`) |
| `EMAIL_SECURE` | No | `true` for port 465 (default `false`) |
| `EMAIL_USER` | Yes | SMTP username |
| `EMAIL_PASSWORD` | Yes | SMTP password |
| `EMAIL_FROM` | Yes | From address, e.g. `"FoodConnect <hi@example.com>"` |
| `SERVER_URL` | Yes | Public URL of this server (used in email links) |
| `FRONTEND_URL` | Yes | Public URL of the frontend (used in redirects) |

## Rate limiting

Subscribe endpoint is rate-limited to **5 requests per 15 minutes per IP** to prevent abuse.

## Database schema

```sql
newsletter_subscribers (
  id              VARCHAR(36)   PK,
  email           VARCHAR(255)  UNIQUE,
  status          ENUM('pending','confirmed','unsubscribed'),
  confirm_token   VARCHAR(64),
  unsubscribe_token VARCHAR(64),
  subscribed_at   DATETIME,
  confirmed_at    DATETIME,
  unsubscribed_at DATETIME
)
```
