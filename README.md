# Bitespeed Identity Reconciliation

A backend service that identifies and reconciles customer contacts across multiple interactions. When a customer reaches out via different email addresses or phone numbers, this system finds or creates the connections between them and consolidates their identity.

## Problem & Solution

Real-world customer data is messy. A customer might contact you with:
- Email on day 1, phone number on day 2
- Different email addresses across platforms
- Shared devices or accounts in families

Without identity reconciliation, you end up with duplicate contact records, fragmented communication history, and poor customer data quality.

This service solves that by maintaining a graph of related contacts. When a new identify request comes in, it:
1. Finds all existing contacts that match the email or phone number
2. Links them under a single primary contact
3. Returns a consolidated view of all known identities for that person

## Tech Stack

- **Express.js** - HTTP server framework
- **TypeScript** - Type-safe JavaScript for catching errors at compile time
- **Prisma** - Type-safe database ORM for easier queries and migrations
- **PostgreSQL** - Relational database
- **Docker** - Optional containerization for development

## How It Works

The system models contacts as a graph with two types of nodes:

**Primary Contact**: The authoritative record. All other related contacts point to this one.

**Secondary Contact**: A record that's been linked to a primary contact because it shares an email or phone number.

When you call `/identify`:

1. **Search**: Find all non-deleted contacts matching the provided email and/or phone number
2. **No match**: Create a new primary contact
3. **One match**: Use its root primary contact
4. **Multiple matches**: Find all root primaries, keep the oldest one as the true primary, demote others to secondary, and consolidate their secondaries under the true primary
5. **New info**: If the request contains an email or phone number not yet in the system, create a new secondary contact under the primary
6. **Return**: Send back the primary contact ID, all emails, all phone numbers, and list of secondary IDs

This approach ensures:
- No lost information (all emails and phones are preserved)
- One source of truth (the primary contact)
- No circular links (each secondary points directly to a primary)
- Predictable behavior (oldest contact wins in a conflict)

## Project Structure

```
src/
├── app.ts                 # Express app setup with middleware and routes
├── server.ts              # Entry point; starts the server
├── prisma.ts              # Prisma client instance import
├── controllers/
│   └── identify.controller.ts   # Request validation and response handling
├── routes/
│   └── identify.route.ts        # Route definitions
└── services/
    └── identify.service.ts      # Core business logic

prisma/
├── schema.prisma          # Database schema definition
└── migrations/            # Versioned database changes
```

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ running locally, or Docker installed
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Bitespeed_Assignment

# Install dependencies
npm install

# Generate Prisma client (required for TypeScript definitions)
npm run prisma:generate
```

### Database Setup

**Option 1: Local PostgreSQL**

```bash
# Create a .env file in the project root
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed"
EOF

# Replace 'user' and 'password' with your PostgreSQL credentials

# Run migrations
npm run prisma:migrate
```

**Option 2: Docker PostgreSQL**

```bash
# Start a PostgreSQL container
docker run -d \
  --name bitespeed-db \
  -e POSTGRES_USER=bitespeed \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bitespeed \
  -p 5432:5432 \
  postgres:15-alpine

# Create .env with Docker connection
cat > .env << EOF
DATABASE_URL="postgresql://bitespeed:password@localhost:5432/bitespeed"
EOF

# Run migrations
npm run prisma:migrate
```

### Running the Server

**Development** (with hot reload):
```bash
npm run dev
```

**Production** (build and start):
```bash
npm run build
npm start
```

The server starts on port `8001` by default.

Verify it's running:
```bash
curl http://localhost:8001/health
```

## API Documentation

### POST `/identify`

Identify or reconcile a contact.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "phoneNumber": "9123456789"
}
```

At least one of `email` or `phoneNumber` must be provided. Both are optional.

**Response (200 OK):**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["alice@example.com", "alice.smith@work.com"],
    "phoneNumbers": ["9123456789", "9198765432"],
    "secondaryContactIds": [2, 4]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing email and phoneNumber, or invalid types
- `500 Internal Server Error` - Database error or unhandled exception

### GET `/health`

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-06-15T10:30:45.123Z",
  "service": "bitespeed-identity-reconciliation"
}
```

## Business Logic in Action

### Scenario 1: New Contact
Request: `email="alice@example.com", phoneNumber=null`

- No existing contacts found
- Create primary contact with ID 1
- Return: `{ primaryContactId: 1, emails: ["alice@example.com"], phoneNumbers: [], secondaryContactIds: [] }`

### Scenario 2: Exact Match
Previous state:
- Contact 1 (primary): alice@example.com, 9123456789

Request: `email="alice@example.com", phoneNumber="9123456789"`

- Contact 1 matches both
- Already linked, no change needed
- Return consolidated view of Contact 1

### Scenario 3: Partial Match (Secondary Created)
Previous state:
- Contact 1 (primary): alice@example.com, null

Request: `email="alice@example.com", phoneNumber="9123456789"`

- Contact 1 matches via email
- Phone number is new information
- Create Contact 2 (secondary) linked to Contact 1 with the phone number
- Return: `{ primaryContactId: 1, emails: ["alice@example.com"], phoneNumbers: ["9123456789"], secondaryContactIds: [2] }`

### Scenario 4: Merging Primaries (Conflict Resolution)
Previous state:
- Contact 1 (primary): alice@example.com, created Jan 1
- Contact 3 (primary): bob@example.com, created Jan 2
- Contact 2 (secondary): linked to Contact 1
- Contact 4 (secondary): linked to Contact 3

Request: `email="alice@example.com", phoneNumber="9123456789"` where Contact 3 also has this phone

- Contacts 1 and 3 are both root primaries
- Contact 1 is older, so it becomes the true primary
- Contact 3 becomes secondary to Contact 1
- Contact 4 (was secondary to Contact 3) is re-linked to Contact 1
- All data consolidated under Contact 1

## Testing with Curl

**Create a new contact:**
```bash
curl -X POST http://localhost:8001/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "phoneNumber": "9123456789"
  }'
```

**Link an existing contact:**
```bash
curl -X POST http://localhost:8001/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "phoneNumber": null
  }'
```

**Test error handling:**
```bash
# Missing both email and phoneNumber
curl -X POST http://localhost:8001/identify \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Check server health:**
```bash
curl http://localhost:8001/health
```

## Useful Development Commands

```bash
# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Reset database (careful!)
npx prisma migrate reset

# Create a new migration after schema changes
npm run prisma:migrate

# View generated TypeScript types
cat node_modules/.prisma/client/index.d.ts
```

## Deployment

### Render

The `render.yaml` file is configured for deployment to Render:

1. Connect your GitHub repository to Render
2. Render automatically detects and runs the build command
3. Set `DATABASE_URL` environment variable to your PostgreSQL instance
4. Deploy starts the service


## Key Design Decisions

**1. Oldest Primary Wins**
When multiple primary contacts are linked, the oldest one becomes the source of truth. This is predictable and prevents unnecessary churn when old records are suddenly re-linked.

**2. Direct Linking Only**
Secondaries link directly to their primary, not in a chain. This prevents accidentally breaking the graph if an intermediate secondary is deleted.

**3. No Cascading Deletes**
When a contact is soft-deleted (`deletedAt` set), it doesn't affect linked contacts. This preserves the relationship graph for historical queries.

**4. New Info = New Secondary**
Rather than updating an existing secondary, we create a new one when new email/phone combinations arrive. This preserves historical audit trails and prevents accidental overwrites.

**5. Email and Phone Normalization**
Inputs are trimmed of whitespace. No lowercasing is done (allowing case-sensitive matching when needed). This keeps the system simple while handling common whitespace issues.

## Assumptions

- **Emails and phone numbers are unique within a person.** Someone won't have multiple primary contacts with the same email.
- **The request email and phone are both correct.** If a customer provides conflicting information, we treat it as a new record.
- **PostgreSQL is the database.** The schema uses PostgreSQL-specific features like autoincrement.
- **In-memory operation is acceptable.** No caching or async processing is used; requests are synchronous.
- **No soft deletes on the Contact table itself.** Soft deletes via `deletedAt` are used for data preservation, but the service still functions correctly when contacts are logically deleted.

## Troubleshooting

**"Database URL is not set"**
- Make sure `.env` file exists in the project root with a valid `DATABASE_URL`

**"relation 'public.Contact' does not exist"**
- Run `npm run prisma:migrate` to create tables

**"ECONNREFUSED" when connecting to PostgreSQL**
- Check that PostgreSQL is running and accessible at the connection string URL
- Verify username, password, and database name

**Port 8001 already in use**
- Change the port in `src/server.ts` or kill the process using that port

## Questions or Issues?

Check the service logs for detailed error messages. The app logs all requests with timestamps for debugging.
