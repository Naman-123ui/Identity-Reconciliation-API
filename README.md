# Bitespeed Identity Reconciliation

A backend service that consolidates customer identity across multiple purchases, even when they use different emails or phone numbers.

---

## 🚀 Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Deployment**: Railway / Render / Fly.io

---

## 📁 Project Structure

```
bitespeed/
├── src/
│   ├── routes/
│   │   └── identify.route.ts       # Route definitions
│   ├── controllers/
│   │   └── identify.controller.ts  # Request/response handling
│   ├── services/
│   │   └── identify.service.ts     # Core business logic ⭐
│   ├── prisma.ts                   # Prisma client singleton
│   ├── app.ts                      # Express app setup
│   └── server.ts                   # Server entry point
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # SQL migrations
├── .env.example                    # Environment variables template
├── package.json
└── tsconfig.json
```

---

## ⚙️ Local Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd bitespeed
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Set up PostgreSQL

**Option A — Local PostgreSQL:**
```bash
# Make sure PostgreSQL is running, then:
createdb bitespeed
```

**Option B — Docker:**
```bash
docker run --name bitespeed-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bitespeed \
  -p 5432:5432 \
  -d postgres
```

Update your `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/bitespeed"
```

### 4. Run database migrations

```bash
npm run prisma:migrate
# or to just push schema without migrations:
npm run prisma:push
```

### 5. Start development server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

## 🔌 API Reference

### POST `/identify`

Identifies and consolidates a contact.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

> At least one of `email` or `phoneNumber` is required.

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

### GET `/health`

Health check endpoint.

---

## 🧠 Business Logic

### Case 1 — No existing contact
Creates a new **primary** contact.

### Case 2 — Contact already exists (exact match)
Returns the consolidated contact group.

### Case 3 — Partial match (new info)
A contact with the email OR phone exists, but the combination is new.
→ Creates a new **secondary** contact linked to the existing primary.

### Case 4 — Two separate primary contacts match
Email matches one primary, phone matches a different primary.
→ The **older** primary stays. The **newer** one is demoted to secondary.
→ All secondaries of the demoted primary are re-linked to the true primary.

---

## 🧪 Testing with cURL

```bash
# Create first contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'

# Create contact with same phone, new email → becomes secondary
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'

# Query by email only
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu"}'
```

---

## 🚢 Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a PostgreSQL service
4. Deploy your GitHub repo
5. Set `DATABASE_URL` environment variable (Railway auto-provides this)
6. Set `PORT` if needed (Railway sets it automatically)

### Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set build command: `npm install && npx prisma generate && npm run build`
4. Set start command: `npx prisma migrate deploy && npm start`
5. Add a **PostgreSQL** database and link `DATABASE_URL`

### Environment Variables to Set

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (usually auto-set by platform) |
| `NODE_ENV` | Set to `production` |

---

## 📝 Notes

- Soft deletes are supported via `deletedAt` field (contacts with `deletedAt` set are excluded from queries)
- The primary contact is always the **oldest** one when merging
- All emails/phone numbers in the response are deduplicated, with primary's values listed first
