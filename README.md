🧩 Bitespeed Identity Reconciliation Service

This project is a backend service built to solve a very practical problem:

Customers often use different emails or phone numbers while making purchases.
This service intelligently links those interactions to a single identity.

So even if someone signs up with:

email A today

phone B tomorrow

We still know it's the same person.

🚀 Tech Stack Used

I chose tools that are simple, scalable and production-friendly:

Node.js + TypeScript → for type safety and maintainability

Express.js → lightweight API framework

Prisma ORM → clean and safe DB interaction

PostgreSQL → relational DB for structured identity linking

Docker (optional) → easy local DB setup

Railway / Render / Fly.io → deployment options

📁 Project Structure (Simple Breakdown)

Here’s how the code is organized:

src/
 ├── routes/
 │    identify.route.ts      → API route
 ├── controllers/
 │    identify.controller.ts → Handles request & response
 ├── services/
 │    identify.service.ts    → Main identity logic ⭐
 ├── prisma.ts               → Prisma client setup
 ├── app.ts                  → Express config
 └── server.ts               → Server entry point

prisma/
 ├── schema.prisma           → DB schema
 └── migrations/             → Migration history

👉 The real brain of this system lives in:

src/services/identify.service.ts
⚙️ How to Run Locally
Step 1 — Clone the repo
git clone <your-repo-url>
cd bitespeed
npm install
Step 2 — Setup environment variables

Create .env file:

cp .env.example .env

Add your database connection:

DATABASE_URL="postgresql://postgres:password@localhost:5432/bitespeed"
Step 3 — Setup PostgreSQL

You have 2 options 👇

Option A — Use Local PostgreSQL

Make sure Postgres is running:

createdb bitespeed
Option B — Use Docker (Recommended)

If you don’t want to install Postgres locally:

docker run --name bitespeed-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bitespeed \
  -p 5432:5432 \
  -d postgres
Step 4 — Run DB Migration
npm run prisma:migrate

OR quick sync:

npm run prisma:push
Step 5 — Start Server
npm run dev

Server will start at:

http://localhost:3000
🔌 API Endpoints
➜ POST /identify

This is the main endpoint.

It links contacts based on:

email

phone number

You must send at least one.

Request
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
Response
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
➜ GET /health

Basic health check to verify server is running.

🧠 Identity Logic Explained (Human Version)

Here’s how the system thinks:

✅ Case 1 — New User

No match found → create a primary contact

✅ Case 2 — Exact Match

Same email + phone already exists → return existing identity

✅ Case 3 — Partial Match

Example:

Existing → same phone

New → different email

➡️ Create a secondary contact

Linked to the original primary.

✅ Case 4 — Conflict Case

Example:

Email matches one primary

Phone matches another primary

Now we merge.

Rules:

Oldest contact remains Primary

Newer becomes Secondary

All linked secondaries move under oldest primary

This ensures:

👉 One single source of truth per customer

🧪 Quick Testing with cURL
# First entry → becomes primary
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
# Same phone, new email → secondary
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
# Query by email only
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu"}'
🚢 Deployment

You can deploy easily using:

Render

Use:

Build Command

npm install && npx prisma generate && npm run build

Start Command

npx prisma migrate deploy && npm start
🌟 Important Notes

Soft delete supported via deletedAt

Oldest contact always remains primary

Emails & phones are deduplicated

Response always returns unified identity

📌 Final Thought

This service focuses on solving a real-world backend problem:

👉 Maintaining customer identity consistency across multiple interactions.

It is designed to be:

Simple

Logical

Scalable

Production-ready