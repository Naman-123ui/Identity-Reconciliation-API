# Quick Setup with Neon (Free PostgreSQL)

## Step 1: Create a free Neon account
1. Go to https://neon.tech
2. Sign up with email or GitHub
3. Create a new project

## Step 2: Get your connection string
- After creating a project, you'll see a "Connect" button
- Select "psql" from the dropdown
- Copy the full connection string (looks like: `postgresql://user:password@host/dbname`)

## Step 3: Update .env file
Replace the DATABASE_URL in `.env` with your Neon connection string:
```
DATABASE_URL="postgresql://your_username:your_password@your_host.neon.tech/your_dbname"
```

## Step 4: Run migrations
```powershell
cd "c:\Users\User\OneDrive\Desktop\Bitespeed_Assignment"
npm run prisma:push
```

## Step 5: Start the development server
```powershell
npm run dev
```

## Step 6: Test the endpoints

### Test Health Check (should return immediately)
```powershell
curl -X GET http://localhost:3000/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-27T...",
  "service": "bitespeed-identity-reconciliation"
}
```

### Test Create Contact (Case 1 - New contact)
```powershell
curl -X POST http://localhost:3000/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```
Expected response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Test Partial Match (Case 3 - Same phone, new email)
```powershell
curl -X POST http://localhost:3000/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```
Expected response (secondary created):
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

### Test by Email only (Case 2 - Exact match)
```powershell
curl -X POST http://localhost:3000/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "lorraine@hillvalley.edu"}'
```
Expected response (same primary):
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

### Test Merge (Case 4 - Two primaries merge)
```powershell
# Create a second primary with different phone
curl -X POST http://localhost:3000/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "doc@hillvalley.edu", "phoneNumber": "789012"}'

# Link to first primary - should merge
curl -X POST http://localhost:3000/identify `
  -H "Content-Type: application/json" `
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "789012"}'
```
Expected: Email from primary 1, phone from primary 2, both consolidated under primary 1

## Issues Encountered

| Issue | Solution |
|-------|----------|
| PostgreSQL not running | ✅ Using Neon cloud (no local setup needed) |
| Docker not available | ✅ Not required - using cloud service |
| Dependencies missing | ✅ `npm install` completed successfully |
| TypeScript compilation | ✅ No errors - code compiles perfectly |
