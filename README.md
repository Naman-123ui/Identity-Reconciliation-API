# Identity Reconciliation API

A service that identifies and reconciles customer contacts across multiple communication channels (email and phone).

## Live Endpoint

```
https://identity-reconciliation-api-1-tow8.onrender.com
```

## API Endpoints

### Health Check
```
GET /health
```
Quick status check for deployment monitoring.

### Identify Contact
```
POST /identify
```
The main endpoint. Identifies a customer, links related contacts, and returns consolidated contact information.

## Request & Response Examples

### Request
```json
{
  "email": "john@example.com",
  "phoneNumber": "+919999999999"
}
```

**Fields:**
- `email` (optional): Customer's email address
- `phoneNumber` (optional): Customer's phone number
- **Note:** At least one field must be provided

### Response
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@example.com", "john.doe@work.com"],
    "phoneNumbers": ["+919999999999", "+919876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Fields:**
- `primaryContactId`: The root contact ID for this customer
- `emails`: All unique emails linked to this customer
- `phoneNumbers`: All unique phone numbers linked to this customer
- `secondaryContactIds`: IDs of related contacts (merged or linked)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Install Dependencies
```bash
npm install
```

### Environment Setup
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bitespeed
PORT=3000
NODE_ENV=development
```

### Run in Development
```bash
npm run dev
```
The server will start on `http://localhost:3000` with auto-reload enabled.

### Production Build
```bash
npm run build
npm start
```

### Database Commands
```bash
# Run migrations
npm run prisma:migrate

# Push schema to database (for first setup or testing)
npm run prisma:push

# Open Prisma Studio (visual database explorer)
npm run prisma:studio
```

## Project Architecture

```
src/
├── server.ts              # Entry point; initializes and starts the Express server
├── app.ts                 # Express app configuration (middleware, routes, error handling)
├── prisma.ts              # Prisma client instance export
├── controllers/
│   └── identify.controller.ts   # HTTP request handler—validates input, calls service, returns response
├── routes/
│   └── identify.route.ts        # Route definitions; wires POST /identify to controller
└── services/
    └── identify.service.ts      # Core business logic; handles contact matching, linking, and merging

prisma/
├── schema.prisma          # Database schema; defines Contact model and LinkPrecedence enum
└── migrations/            # Versioned migrations tracking schema changes
```

**Flow:**
1. Request hits Express route (`/identify`)
2. Route delegates to controller
3. Controller validates input
4. Controller calls service with validated data
5. Service executes business logic (search, link, merge, respond)
6. Service returns consolidated contact info
7. Controller returns JSON response

**Data Model:**
- `Contact` table with `id`, `email`, `phoneNumber`, `linkedId`, `linkPrecedence`
- Each contact is either primary or secondary
- Secondaries point to their primary via `linkedId`
- `deletedAt` field for soft deletes (data preservation)

## How It Works

When you call `/identify` with an email and/or phone number, the system:

### New Customer
If neither the email nor phone exists in the database, a new **primary contact** is created and returned.

### Existing Customer
If a contact with that email or phone already exists, the system returns their consolidated information.

### Linking Contacts
If you provide an email that belongs to Contact A and a phone that belongs to Contact B, the system recognizes they're the same person and:
- Marks the oldest as **primary** (the authoritative record)
- Links the newer one(s) as **secondary** (pointing back to primary)
- Returns all emails and phones under the primary

### Merging Multiple Records
If multiple customers could be linked together (e.g., Contact A and C both have email matches, but Contact C also matches a phone that Contact B has), all are merged:
- The oldest contact remains primary
- All others become secondary to it
- All their data rolls up into the consolidated response

### New Information
Each request that adds a previously unknown email or phone creates a new secondary contact record. This maintains a complete history and prevents accidental overwrites.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Web Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Development:** ts-node-dev (hot reload)
